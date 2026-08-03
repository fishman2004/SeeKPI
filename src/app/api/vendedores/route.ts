import { NextResponse } from 'next/server';
import db from '@/lib/db';
import '@/lib/schema';

/* ------------------------------------------------------------------ */
/*  GET /api/vendedores                                                */
/*  ?action=list          → lista todos os vendedores                  */
/*  ?id=XXX               → dados completos do vendedor XXX            */
/*  ?id=XXX&mes=06&dia=15 → dados do vendedor filtrados por data       */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const vendedorId = searchParams.get('id');
    const mes = searchParams.get('mes') || '';
    const dia = searchParams.get('dia') || '';

    /* ── Lista de vendedores ──────────────────────────────────── */
    if (action === 'list' || !vendedorId) {
      // Busca lista de vendedores priorizando base_vendedores e completando com vendas_brutas
      let vendedores = db.prepare(`
        SELECT DISTINCT 
          COALESCE(bv.id_vendedor, v.id_rca) as id,
          COALESCE(bv.nome_vendedor, v.nome_rca) as nome,
          COALESCE(bv.nome_supervisor, v.nome_supervisor) as supervisor
        FROM vendas_brutas v
        LEFT JOIN base_vendedores bv ON v.id_rca = bv.id_vendedor
        WHERE v.id_rca IS NOT NULL AND v.id_rca != ''
        GROUP BY v.id_rca
        ORDER BY nome
      `).all() as any[];

      if (vendedores.length === 0) {
        vendedores = db.prepare(`
          SELECT DISTINCT bv.id_vendedor as id, bv.nome_vendedor as nome, bv.nome_supervisor as supervisor
          FROM base_vendedores bv
          WHERE bv.id_vendedor IS NOT NULL
          ORDER BY bv.nome_vendedor
        `).all() as any[];
      }

      return NextResponse.json({ success: true, data: vendedores });
    }

    /* ── Dados completos de um vendedor ───────────────────────── */

    // Construir filtro de data para vendas_brutas
    let dateFilter = '';
    const dateParams: string[] = [];
    if (mes) {
      if (dia) {
        dateFilter = ` AND data_pedido LIKE ?`;
        dateParams.push(`${dia}/${mes}/%`);
      } else {
        dateFilter = ` AND data_pedido LIKE ?`;
        dateParams.push(`%/${mes}/%`);
      }
    }

    // Info do vendedor
    const vendedorInfo = db.prepare(`
      SELECT id_vendedor as id, nome_vendedor as nome, nome_supervisor as supervisor
      FROM base_vendedores WHERE id_vendedor = ?
    `).get(vendedorId) as any;

    // Se não achar na base_vendedores, tenta pegar da vendas_brutas
    const info = vendedorInfo || db.prepare(`
      SELECT DISTINCT id_rca as id, nome_rca as nome, nome_supervisor as supervisor
      FROM vendas_brutas WHERE id_rca = ? LIMIT 1
    `).get(vendedorId) as any;

    if (!info) {
      return NextResponse.json({ success: false, error: 'Vendedor não encontrado.' }, { status: 404 });
    }

    // Determinar a "pasta" (canal) a partir do nome_rca ou nome_supervisor
    let pasta = 'B'; // default
    const nomeUpper = (info.nome || info.supervisor || '').toUpperCase().trim();
    if (nomeUpper.startsWith('G')) pasta = 'G';
    else if (nomeUpper.startsWith('P')) pasta = 'P';
    else if (!nomeUpper.startsWith('B')) pasta = 'E';

    /* ── 1. FORNECEDORES: Meta vs Realizado ───────────────────── */

    // Metas por fornecedor (da base de metas gerais)
    const metasFornecedor = db.prepare(`
      SELECT id_fornecedor, nome_fornecedor, meta_financeira, meta_positivacao
      FROM base_metas_gerais
      WHERE id_vendedor = ?
    `).all(vendedorId) as any[];

    // Realizado por fornecedor (vendas brutas)
    const realizadoFornecedor = db.prepare(`
      SELECT id_fornecedor, nome_fornecedor, 
             SUM(valor) as realizado_financeiro,
             COUNT(DISTINCT id_cliente) as realizado_positivacao
      FROM vendas_brutas
      WHERE id_rca = ? ${dateFilter}
      GROUP BY id_fornecedor
    `).all(vendedorId, ...dateParams) as any[];

    // Cruzar metas com realizado
    const realizadoMap = new Map();
    realizadoFornecedor.forEach((r: any) => {
      realizadoMap.set(r.id_fornecedor, r);
    });

    const fornecedores = metasFornecedor.map((m: any) => {
      const r = realizadoMap.get(m.id_fornecedor) || { realizado_financeiro: 0, realizado_positivacao: 0 };
      const gapFin = r.realizado_financeiro - m.meta_financeira;
      const gapPos = r.realizado_positivacao - m.meta_positivacao;
      const pctFin = m.meta_financeira > 0 ? (r.realizado_financeiro / m.meta_financeira) * 100 : 0;
      const pctPos = m.meta_positivacao > 0 ? (r.realizado_positivacao / m.meta_positivacao) * 100 : 0;

      return {
        id_fornecedor: m.id_fornecedor,
        nome_fornecedor: m.nome_fornecedor || r.nome_fornecedor || `Fornecedor ${m.id_fornecedor}`,
        pasta: pasta,
        meta_financeira: m.meta_financeira || 0,
        realizado_financeiro: r.realizado_financeiro || 0,
        gap_financeiro: gapFin,
        percent_financeiro: pctFin,
        meta_positivacao: m.meta_positivacao || 0,
        realizado_positivacao: r.realizado_positivacao || 0,
        gap_positivacao: gapPos,
        percent_positivacao: pctPos,
      };
    });

    // Adicionar fornecedores que estão nas vendas mas não têm meta cadastrada
    realizadoFornecedor.forEach((r: any) => {
      const hasMeta = metasFornecedor.some((m: any) => m.id_fornecedor === r.id_fornecedor);
      if (!hasMeta) {
        fornecedores.push({
          id_fornecedor: r.id_fornecedor,
          nome_fornecedor: r.nome_fornecedor,
          pasta: pasta,
          meta_financeira: 0,
          realizado_financeiro: r.realizado_financeiro || 0,
          gap_financeiro: r.realizado_financeiro || 0,
          percent_financeiro: 0,
          meta_positivacao: 0,
          realizado_positivacao: r.realizado_positivacao || 0,
          gap_positivacao: r.realizado_positivacao || 0,
          percent_positivacao: 0,
        });
      }
    });

    // Totais
    const totais = {
      meta_financeira: fornecedores.reduce((a: number, f: any) => a + f.meta_financeira, 0),
      realizado_financeiro: fornecedores.reduce((a: number, f: any) => a + f.realizado_financeiro, 0),
      meta_positivacao: fornecedores.reduce((a: number, f: any) => a + f.meta_positivacao, 0),
      realizado_positivacao: fornecedores.reduce((a: number, f: any) => a + f.realizado_positivacao, 0),
      gap_financeiro: 0,
      percent_financeiro: 0,
      gap_positivacao: 0,
      percent_positivacao: 0,
    };
    totais.gap_financeiro = totais.realizado_financeiro - totais.meta_financeira;
    totais.percent_financeiro = totais.meta_financeira > 0 ? (totais.realizado_financeiro / totais.meta_financeira) * 100 : 0;
    totais.gap_positivacao = totais.realizado_positivacao - totais.meta_positivacao;
    totais.percent_positivacao = totais.meta_positivacao > 0 ? (totais.realizado_positivacao / totais.meta_positivacao) * 100 : 0;

    /* ── 2. KPI: Carteira Ativa (70%) ─────────────────────────── */
    const carteira = db.prepare(`SELECT total_clientes FROM base_carteira WHERE id_vendedor = ?`).get(vendedorId) as any;
    const totalClientes = carteira?.total_clientes || 0;
    const metaCarteira = Math.round(totalClientes * 0.70);
    const realizadoCarteira = (db.prepare(`
      SELECT COUNT(DISTINCT id_cliente) as qtd
      FROM vendas_brutas WHERE id_rca = ? ${dateFilter}
    `).get(vendedorId, ...dateParams) as any)?.qtd || 0;

    /* ── 3. KPI: CLC Categorias (Resumo) ──────────────────────── */
    // Metas individuais do vendedor
    const metasCLC = db.prepare(`
      SELECT categoria, meta_clientes
      FROM base_metas_clc_categorias
      WHERE id_vendedor = ?
    `).all(vendedorId) as any[];

    // Se não tem metas individuais, tenta pegar globais (fallback)
    const metasCLCFinal = metasCLC.length > 0 ? metasCLC : db.prepare(`
      SELECT categoria, meta_clientes
      FROM base_metas_clc_categorias
      WHERE id_vendedor IS NULL OR id_vendedor = ''
    `).all() as any[];

    // Realizado CLC do vendedor por categoria + Lista de Clientes
    const realizadoCLC = db.prepare(`
      SELECT p.categoria, COUNT(DISTINCT v.id_cliente) as realizado
      FROM vendas_brutas v
      JOIN base_produtos p ON v.id_produto = p.id_produto
      WHERE v.id_rca = ? ${dateFilter} AND p.categoria IS NOT NULL AND p.categoria != ''
      GROUP BY p.categoria
    `).all(vendedorId, ...dateParams) as any[];

    const realizadoCLCMap = new Map();
    realizadoCLC.forEach((r: any) => realizadoCLCMap.set(r.categoria?.toUpperCase(), r.realizado));

    const clcCategorias = metasCLCFinal.map((m: any) => {
      const realizado = realizadoCLCMap.get(m.categoria?.toUpperCase()) || 0;
      const gap = realizado - m.meta_clientes;
      const pct = m.meta_clientes > 0 ? (realizado / m.meta_clientes) * 100 : 0;

      // Busca clientes positivados nesta categoria específica
      const clientesPositivados = db.prepare(`
        SELECT DISTINCT v.id_cliente, v.cliente_nome, SUM(v.valor) as valor_total, SUM(v.qtde_und) as unidades
        FROM vendas_brutas v
        JOIN base_produtos p ON v.id_produto = p.id_produto
        WHERE v.id_rca = ? ${dateFilter} AND UPPER(p.categoria) = UPPER(?)
        GROUP BY v.id_cliente, v.cliente_nome
        ORDER BY valor_total DESC
      `).all(vendedorId, ...dateParams, m.categoria) as any[];

      return {
        categoria: m.categoria,
        meta: m.meta_clientes,
        realizado,
        gap,
        percent: pct,
        clientes: clientesPositivados
      };
    });

    let clcBatidas = 0;
    clcCategorias.forEach((c: any) => { if (c.meta > 0 && c.realizado >= c.meta) clcBatidas++; });

    /* ── 4. KPI: Reppos (Participação) ────────────────────────── */
    const repposResult = db.prepare(`
      SELECT SUM(valor) as fat, COUNT(DISTINCT id_cliente) as pos
      FROM vendas_brutas
      WHERE id_rca = ? ${dateFilter} AND numero_pedido LIKE '380%'
    `).get(vendedorId, ...dateParams) as any;

    const totalVendasVendedor = db.prepare(`
      SELECT SUM(valor) as fat, COUNT(DISTINCT id_cliente) as pos
      FROM vendas_brutas
      WHERE id_rca = ? ${dateFilter}
    `).get(vendedorId, ...dateParams) as any;

    const reppos = {
      financeiro: repposResult?.fat || 0,
      positivacao: repposResult?.pos || 0,
      percentFat: (totalVendasVendedor?.fat > 0) ? ((repposResult?.fat || 0) / totalVendasVendedor.fat) * 100 : 0,
      percentPos: (totalVendasVendedor?.pos > 0) ? ((repposResult?.pos || 0) / totalVendasVendedor.pos) * 100 : 0,
    };

    /* ── 5. KPI: MSL (Mix Sortimento de Loja - Trimestre Móvel) ─ */
    // Determina os últimos 3 meses presentes na base de vendas brutas (ou com base no filtro)
    const datasDisponiveis = db.prepare(`
      SELECT DISTINCT data_pedido FROM vendas_brutas WHERE id_rca = ?
    `).all(vendedorId) as any[];

    // Extrai meses únicos das datas ex: '15/06/2026' -> '06/2026'
    const mesesSet = new Set<string>();
    datasDisponiveis.forEach(d => {
      const parts = d.data_pedido?.split('/');
      if (parts && parts.length === 3) {
        mesesSet.add(`${parts[1]}/${parts[2]}`);
      }
    });

    const ultimosMeses = Array.from(mesesSet).sort().slice(-3); // Pega até os últimos 3 meses

    // Filtro SQL para o trimestre móvel
    let mslDateFilter = '';
    const mslDateParams: string[] = [];
    if (ultimosMeses.length > 0) {
      const conditions = ultimosMeses.map(() => `data_pedido LIKE ?`).join(' OR ');
      mslDateFilter = ` AND (${conditions})`;
      ultimosMeses.forEach(m => {
        const [mNum, aNum] = m.split('/');
        mslDateParams.push(`%/${mNum}/${aNum}`);
      });
    }

    const calcMSLForType = (tipo: string) => {
      const clientesMSL = db.prepare(`
        SELECT id_cliente, cliente_nome, segmento
        FROM base_msl_clientes
        WHERE id_vendedor = ? AND UPPER(tipo_msl) = UPPER(?)
      `).all(vendedorId, tipo) as any[];

      if (clientesMSL.length === 0) return { totalClientes: 0, metaGlobal: 0, realizadoGlobal: 0, percentGlobal: 0, clientes: [] };

      let totalMetaItensGlobal = 0;
      let totalRealizadoItensGlobal = 0;

      const clientesComDetalhe = clientesMSL.map(cliente => {
        // Produtos obrigatórios do segmento do cliente
        const prodsObrigatorios = db.prepare(`
          SELECT id_produto, nome_produto, segmento
          FROM base_msl_produtos
          WHERE UPPER(segmento) = UPPER(?) AND UPPER(tipo_msl) = UPPER(?)
        `).all(cliente.segmento, tipo) as any[];

        if (prodsObrigatorios.length === 0) {
          return {
            ...cliente,
            totalItens: 0,
            itensValidos: 0,
            percent: 0,
            produtos: []
          };
        }

        // Vendas do cliente no trimestre móvel
        const vendasTrimestre = db.prepare(`
          SELECT id_produto, SUM(qtde_und) as total_und
          FROM vendas_brutas
          WHERE id_cliente = ? ${mslDateFilter}
          GROUP BY id_produto
        `).all(cliente.id_cliente, ...mslDateParams) as any[];

        const vendasMap = new Map();
        vendasTrimestre.forEach((v: any) => vendasMap.set(v.id_produto, v.total_und || 0));

        let itensValidosCount = 0;
        const produtosDetalhe = prodsObrigatorios.map(p => {
          const qtdVendida = vendasMap.get(p.id_produto) || 0;
          const statusValido = qtdVendida >= 3; // Regra de Trimestre Móvel (>= 3 unidades)
          if (statusValido) itensValidosCount++;

          return {
            id_produto: p.id_produto,
            nome_produto: p.nome_produto,
            qtdVendida,
            statusValido,
            faltam: Math.max(0, 3 - qtdVendida)
          };
        });

        totalMetaItensGlobal += prodsObrigatorios.length;
        totalRealizadoItensGlobal += itensValidosCount;

        const pctCliente = prodsObrigatorios.length > 0 ? (itensValidosCount / prodsObrigatorios.length) * 100 : 0;

        return {
          ...cliente,
          totalItens: prodsObrigatorios.length,
          itensValidos: itensValidosCount,
          percent: pctCliente,
          produtos: produtosDetalhe
        };
      });

      const pctGlobal = totalMetaItensGlobal > 0 ? (totalRealizadoItensGlobal / totalMetaItensGlobal) * 100 : 0;

      return {
        totalClientes: clientesMSL.length,
        metaGlobal: totalMetaItensGlobal,
        realizadoGlobal: totalRealizadoItensGlobal,
        percentGlobal: pctGlobal,
        clientes: clientesComDetalhe
      };
    };

    const mslReckittCore = calcMSLForType('RECKITT CORE');
    const mslVestacy = calcMSLForType('VESTACY');

    /* ── 6. Pedidos e Clientes Atendidos ──────────────────────── */
    const pedidosTotal = (db.prepare(`
      SELECT COUNT(DISTINCT numero_pedido) as qtd FROM vendas_brutas WHERE id_rca = ? ${dateFilter}
    `).get(vendedorId, ...dateParams) as any)?.qtd || 0;

    /* ── Resposta ─────────────────────────────────────────────── */
    return NextResponse.json({
      success: true,
      data: {
        vendedor: { ...info, pasta },
        fornecedores,
        totais,
        kpis: {
          carteiraAtiva: {
            totalClientes: totalClientes,
            meta: metaCarteira,
            realizado: realizadoCarteira,
            percent: metaCarteira > 0 ? (realizadoCarteira / metaCarteira) * 100 : 0,
            gap: realizadoCarteira - metaCarteira,
          },
          clc: {
            categorias: clcCategorias,
            batidas: clcBatidas,
            total: clcCategorias.length,
          },
          reppos,
          mslReckittCore,
          mslVestacy,
          pedidosTotal,
        },
      },
    });

  } catch (error) {
    console.error('Erro na API de vendedores:', error);
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : 'Desconhecido'}` },
      { status: 500 }
    );
  }
}
