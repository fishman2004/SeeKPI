import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fornecedor = searchParams.get('fornecedor') || ''; 
    const mes = searchParams.get('mes') || '';
    const dia = searchParams.get('dia') || '';

    let whereClause = '1=1';
    let params: string[] = [];
    
    if (fornecedor) {
      whereClause += ' AND UPPER(nome_fornecedor) LIKE ?';
      params.push(`%${fornecedor.toUpperCase()}%`);
    }

    if (mes) {
      if (dia) {
        whereClause += ' AND data_pedido LIKE ?';
        params.push(`${dia}/${mes}/%`);
      } else {
        whereClause += ' AND data_pedido LIKE ?';
        params.push(`%/${mes}/%`);
      }
    }

    // 1. Faturamento e Positivação (Global ou por Fornecedor se passado)
    const vendasResult = db.prepare(`
      SELECT 
        SUM(valor) as faturamento_total,
        COUNT(DISTINCT id_cliente) as positivacao_total
      FROM vendas_brutas
      WHERE ${whereClause}
    `).get(...params) as any;

    // 2. Metas Gerais e Carteira
    const metasResult = db.prepare(`
      SELECT 
        SUM(meta_financeira) as meta_faturamento
      FROM base_metas_gerais
      WHERE 1=1 ${fornecedor ? "AND UPPER(nome_fornecedor) LIKE '%" + fornecedor.toUpperCase() + "%'" : ""}
    `).get() as any;

    const carteiraResult = db.prepare(`
      SELECT SUM(total_clientes) as total_carteira FROM base_carteira
    `).get() as any;
    
    const meta_positivacao_calculada = Math.round((carteiraResult?.total_carteira || 0) * 0.70);

    // 3. Reppos (Pedidos começando com 380 vs Faturamento e Positivação de Reckitt Core + Vestacy)
    const repposResult = db.prepare(`
      SELECT 
        SUM(valor) as faturamento_reppos,
        COUNT(DISTINCT id_cliente) as positivacao_reppos
      FROM vendas_brutas
      WHERE ${whereClause} AND (numero_pedido LIKE '380%' OR posicao_ped LIKE '380%')
    `).get(...params) as any;

    const totalReckittVestacy = db.prepare(`
      SELECT 
        SUM(valor) as fat_total,
        COUNT(DISTINCT id_cliente) as pos_total
      FROM vendas_brutas
      WHERE ${whereClause} AND UPPER(nome_fornecedor) IN ('RECKITT CORE', 'VESTACY')
    `).get(...params) as any;

    // 4. Categorias CLC (Somente as que estão cadastradas na base_produtos)
    // Mostraremos as categorias batidas vs total
    const clcByCategory = db.prepare(`
      SELECT 
        p.categoria as name,
        COUNT(DISTINCT v.id_cliente) as value,
        COALESCE(m.meta, 0) as meta
      FROM vendas_brutas v
      JOIN base_produtos p ON v.id_produto = p.id_produto
      LEFT JOIN (
        SELECT categoria, SUM(meta_clientes) as meta 
        FROM base_metas_clc_categorias 
        GROUP BY categoria
      ) m ON UPPER(p.categoria) = UPPER(m.categoria)
      WHERE ${whereClause} AND p.categoria IS NOT NULL AND p.categoria != ''
      GROUP BY p.categoria
      ORDER BY value DESC
    `).all(...params) as any[];

    // Calcula quantas categorias bateram a meta
    let categoriasBatidas = 0;
    let totalCategorias = clcByCategory.length;
    clcByCategory.forEach((cat: any) => {
      if (cat.meta > 0 && cat.value >= cat.meta) {
        categoriasBatidas++;
      }
    });

    // 5. PDV Premiado (Lojas Diamond e Gold separadas com faturamento Reckitt Core)
    const pdvsDbDashboard = db.prepare(`
      SELECT p.id_cliente, p.meta_financeira, p.categoria_loja
      FROM base_pdv_premiado p
      WHERE p.id_cliente IS NOT NULL AND p.id_cliente != ''
      GROUP BY p.id_cliente
    `).all() as any[];

    let diamondAtingiram = 0;
    let diamondTotal = 0;
    let goldAtingiram = 0;
    let goldTotal = 0;

    pdvsDbDashboard.forEach(pdv => {
      const meta = pdv.meta_financeira || 0;
      const realReckitt = (db.prepare(`
        SELECT SUM(valor) as total
        FROM vendas_brutas
        WHERE id_cliente = ? AND UPPER(nome_fornecedor) = 'RECKITT CORE'
      `).get(pdv.id_cliente) as any)?.total || 0;

      const isBatido = meta > 0 && realReckitt >= meta;
      const categoria = pdv.categoria_loja || (meta >= 10000 ? 'DIAMOND' : 'GOLD');

      if (categoria === 'DIAMOND') {
        diamondTotal++;
        if (isBatido) diamondAtingiram++;
      } else {
        goldTotal++;
        if (isBatido) goldAtingiram++;
      }
    });

    // 6. Gráfico de Vendas por Canal (A lógica das letras B, G, P)
    // Agrupa pela inicial do nome_supervisor. 
    // B = Venda Direta
    // G = Canal Farma
    // P = Televendas
    // Outros = E-commerce Polybalas
    const salesByChannelRaw = db.prepare(`
      SELECT 
        COALESCE((
          SELECT bv.nome_supervisor 
          FROM base_vendedores bv 
          WHERE v.nome_supervisor LIKE '%' || bv.id_vendedor || '%' 
             OR v.nome_rca LIKE '%' || bv.id_vendedor || '%'
          LIMIT 1
        ), v.nome_supervisor) as supervisor_limpo,
        SUM(v.valor) as value
      FROM vendas_brutas v
      WHERE ${whereClause}
      GROUP BY supervisor_limpo
    `).all(...params);

    const salesBySupervisorMap = new Map();
    salesByChannelRaw.forEach((row: any) => {
      let supervisor = row.supervisor_limpo?.toUpperCase()?.trim() || '';
      let canal = '';
      
      if (supervisor.startsWith('B')) {
        canal = supervisor; // Mantém o nome do supervisor para Venda Direta
      } else if (supervisor.startsWith('G')) {
        canal = 'CANAL FARMA';
      } else if (supervisor.startsWith('P')) {
        canal = 'TELEVENDAS';
      } else {
        canal = 'E-COMMERCE POLYBALAS';
      }

      const current = salesBySupervisorMap.get(canal) || 0;
      salesBySupervisorMap.set(canal, current + row.value);
    });

    const salesBySupervisor = Array.from(salesBySupervisorMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 7. Resumo do Dia (Quick Stats)
    // Se o filtro global tiver um dia selecionado, usamos ele. Senão, pegamos a data mais recente filtrada.
    let ultimaData = '';
    if (dia && mes) {
      ultimaData = `${dia}/${mes}/2026`; // Aproximação, pois data no banco costuma ter o ano
    } else {
      const dataQuery = db.prepare(`SELECT MAX(data_pedido) as ultima_data FROM vendas_brutas WHERE ${whereClause}`).get(...params) as any;
      ultimaData = dataQuery?.ultima_data || '';
    }

    let vendedoresAtivosHoje = 0;
    let totalVendedores = 0;
    let pedidosHoje = 0;
    let pedidosTotal = 0;
    let fornecedorDestaque = null;
    let pracaMaisPositivou = null;
    let faturamentoHoje = 0;

    if (ultimaData) {
      const dateParams = [...params, ultimaData];

      // Pedidos
      pedidosHoje = (db.prepare(`SELECT COUNT(DISTINCT numero_pedido) as qtd FROM vendas_brutas WHERE ${whereClause} AND data_pedido = ?`).get(...dateParams) as any).qtd;
      pedidosTotal = (db.prepare(`SELECT COUNT(DISTINCT numero_pedido) as qtd FROM vendas_brutas WHERE ${whereClause}`).get(...params) as any).qtd;
      faturamentoHoje = (db.prepare(`SELECT SUM(valor) as val FROM vendas_brutas WHERE ${whereClause} AND data_pedido = ?`).get(...dateParams) as any).val;

      // Vendedores
      vendedoresAtivosHoje = (db.prepare(`SELECT COUNT(DISTINCT id_rca) as qtd FROM vendas_brutas WHERE ${whereClause} AND data_pedido = ?`).get(...dateParams) as any).qtd;
      totalVendedores = (db.prepare(`SELECT COUNT(DISTINCT id_vendedor) as qtd FROM base_carteira`).get() as any).qtd;
      if (totalVendedores === 0) {
        totalVendedores = (db.prepare(`SELECT COUNT(DISTINCT id_vendedor) as qtd FROM base_vendedores`).get() as any).qtd;
      }

      // Fornecedor Destaque Hoje (com Positivação e Valor)
      fornecedorDestaque = db.prepare(`
        SELECT nome_fornecedor, SUM(valor) as fat, COUNT(DISTINCT id_cliente) as pos
        FROM vendas_brutas
        WHERE ${whereClause} AND data_pedido = ?
        GROUP BY nome_fornecedor
        ORDER BY fat DESC LIMIT 1
      `).get(...dateParams) as any;

      // Região com mais positivação (Apenas B-)
      const pracasHoje = db.prepare(`
        SELECT nome_supervisor, COUNT(DISTINCT id_cliente) as pos, SUM(valor) as fat
        FROM vendas_brutas
        WHERE ${whereClause} AND data_pedido = ? AND UPPER(nome_supervisor) LIKE 'B-%'
        GROUP BY nome_supervisor
        ORDER BY pos DESC LIMIT 1
      `).get(...dateParams) as any;

      if (pracasHoje) {
        let n = pracasHoje.nome_supervisor.toUpperCase();
        let regiao = n;
        if (n.includes('EMILIA')) regiao = 'João Pessoa';
        if (n.includes('ALEXANDRE')) regiao = 'Brejo/CG';
        if (n.includes('NATANIEL')) regiao = 'Sertão';
        if (n.includes('SALEZIO') || n.includes('SALÉZIO')) regiao = 'Redes Grandes';
        
        const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pracasHoje.fat);
        pracaMaisPositivou = `${regiao} (${pracasHoje.pos} POS | ${valorFormatado})`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          faturamento: {
            realizado: vendasResult?.faturamento_total || 0,
            meta: metasResult?.meta_faturamento || 0
          },
          positivacao: {
            realizado: vendasResult?.positivacao_total || 0,
            meta: meta_positivacao_calculada || 0
          },
          reppos: {
            realizado: repposResult?.faturamento_reppos || 0,
            positivacao: repposResult?.positivacao_reppos || 0,
            percentFat: totalReckittVestacy?.fat_total > 0 ? ((repposResult?.faturamento_reppos || 0) / totalReckittVestacy.fat_total) * 100 : 0,
            percentPos: totalReckittVestacy?.pos_total > 0 ? ((repposResult?.positivacao_reppos || 0) / totalReckittVestacy.pos_total) * 100 : 0,
          },
          clc: {
            categoriasBatidas: categoriasBatidas,
            totalCategorias: totalCategorias,
            todas: clcByCategory
          },
          pdvPremiado: {
            diamond: diamondAtingiram,
            diamondTotal: diamondTotal,
            gold: goldAtingiram,
            goldTotal: goldTotal
          },
          resumoDia: {
            data: ultimaData,
            vendedoresAtivos: vendedoresAtivosHoje,
            vendedoresFaltam: Math.max(0, totalVendedores - vendedoresAtivosHoje),
            pedidosHoje: pedidosHoje,
            pedidosTotal: pedidosTotal,
            faturamentoHoje: faturamentoHoje,
            fornecedorDestaque: fornecedorDestaque 
              ? `${fornecedorDestaque.nome_fornecedor} (${fornecedorDestaque.pos} POS | ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fornecedorDestaque.fat)})` 
              : 'N/A',
            pracaMaisPositivou: pracaMaisPositivou || 'N/A'
          }
        },
        charts: {
          clcByCategory,
          salesBySupervisor,
          pdvBreakdown: []
        }
      }
    });

  } catch (error) {
    console.error('Erro ao calcular KPIs:', error);
    return NextResponse.json(
      { error: 'Erro interno ao calcular KPIs' }, 
      { status: 500 }
    );
  }
}
