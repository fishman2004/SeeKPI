import { NextResponse } from 'next/server';
import db from '@/lib/db';
import '@/lib/schema';

/* ------------------------------------------------------------------ */
/*  GET /api/reppos                                                   */
/*  Retorna analise de vendas do Reppos (Pedidos iniciando em '380')  */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || '';
    const dia = searchParams.get('dia') || '';

    // Filtro de Data
    let dateFilter = '';
    const dateParams: string[] = [];
    if (mes && mes !== 'todos') {
      if (dia) {
        dateFilter = ` AND (data_pedido LIKE ? OR data_pedido LIKE ?)`;
        dateParams.push(`${dia}/${mes}/%`, `%/${mes}/${dia}%`);
      } else {
        dateFilter = ` AND (data_pedido LIKE ? OR data_pedido LIKE ?)`;
        dateParams.push(`%/${mes}/%`, `%-0${mes}-%`);
      }
    }

    // Condição para Pedidos Reppos
    const repposCondition = `(numero_pedido LIKE '380%' OR posicao_ped LIKE '380%')`;
    const repposFornecedoresCondition = `UPPER(nome_fornecedor) IN ('RECKITT CORE', 'VESTACY')`;

    /* ── 1. Resumo Geral Reppos vs Geral (Reckitt Core + Vestacy) ─── */
    const faturamentoGeral = (db.prepare(`
      SELECT SUM(valor) as fat, COUNT(DISTINCT numero_pedido) as pedidos, COUNT(DISTINCT id_cliente) as pos
      FROM vendas_brutas WHERE ${repposFornecedoresCondition} ${dateFilter}
    `).get(...dateParams) as any) || { fat: 0, pedidos: 0, pos: 0 };

    const faturamentoReppos = (db.prepare(`
      SELECT SUM(valor) as fat, COUNT(DISTINCT numero_pedido) as pedidos, COUNT(DISTINCT id_cliente) as pos
      FROM vendas_brutas
      WHERE ${repposCondition} ${dateFilter}
    `).get(...dateParams) as any) || { fat: 0, pedidos: 0, pos: 0 };

    const fatGeral = faturamentoGeral.fat || 0;
    const fatReppos = faturamentoReppos.fat || 0;
    const posGeral = faturamentoGeral.pos || 0;
    const posReppos = faturamentoReppos.pos || 0;
    const pedGeral = faturamentoGeral.pedidos || 0;
    const pedReppos = faturamentoReppos.pedidos || 0;

    const shareFaturamento = fatGeral > 0 ? (fatReppos / fatGeral) * 100 : 0;
    const sharePositivacao = posGeral > 0 ? (posReppos / posGeral) * 100 : 0;
    const ticketMedioGeral = pedGeral > 0 ? fatGeral / pedGeral : 0;
    const ticketMedioReppos = pedReppos > 0 ? fatReppos / pedReppos : 0;

    const resumoGeral = {
      fatGeral,
      fatReppos,
      shareFaturamento,
      posGeral,
      posReppos,
      sharePositivacao,
      pedGeral,
      pedReppos,
      ticketMedioGeral,
      ticketMedioReppos
    };

    /* ── 2. Desempenho Reppos Por Supervisor ────────────────────── */
    let supervisoresList = db.prepare(`
      SELECT DISTINCT nome_supervisor as nome FROM base_vendedores WHERE nome_supervisor IS NOT NULL AND nome_supervisor != ''
    `).all() as any[];

    if (supervisoresList.length === 0) {
      supervisoresList = db.prepare(`
        SELECT DISTINCT nome_supervisor as nome FROM vendas_brutas WHERE nome_supervisor IS NOT NULL AND nome_supervisor != ''
      `).all() as any[];
    }

    const supervisores = supervisoresList.map(sup => {
      const nomeSup = sup.nome;

      // Faturamento total do supervisor (Apenas Reckitt Core + Vestacy)
      const supTot = (db.prepare(`
        SELECT SUM(valor) as fat, COUNT(DISTINCT id_cliente) as pos
        FROM vendas_brutas
        WHERE nome_supervisor = ? AND ${repposFornecedoresCondition} ${dateFilter}
      `).get(nomeSup, ...dateParams) as any) || { fat: 0, pos: 0 };

      // Faturamento Reppos do supervisor
      const supRep = (db.prepare(`
        SELECT SUM(valor) as fat, COUNT(DISTINCT id_cliente) as pos
        FROM vendas_brutas
        WHERE nome_supervisor = ? AND ${repposCondition} ${dateFilter}
      `).get(nomeSup, ...dateParams) as any) || { fat: 0, pos: 0 };

      const totalFat = supTot.fat || 0;
      const repposFat = supRep.fat || 0;
      const totalPos = supTot.pos || 0;
      const repposPos = supRep.pos || 0;

      const shareFat = totalFat > 0 ? (repposFat / totalFat) * 100 : 0;
      const sharePos = totalPos > 0 ? (repposPos / totalPos) * 100 : 0;

      // Vendedores da equipe do supervisor
      const vendedoresDoSup = db.prepare(`
        SELECT DISTINCT id_vendedor, nome_vendedor FROM base_vendedores WHERE nome_supervisor = ?
      `).all(nomeSup) as any[];

      const vendedores = vendedoresDoSup.map(v => {
        const vTot = (db.prepare(`
          SELECT SUM(valor) as fat, COUNT(DISTINCT id_cliente) as pos
          FROM vendas_brutas
          WHERE id_rca = ? AND ${repposFornecedoresCondition} ${dateFilter}
        `).get(v.id_vendedor, ...dateParams) as any) || { fat: 0, pos: 0 };

        const vRep = (db.prepare(`
          SELECT SUM(valor) as fat, COUNT(DISTINCT id_cliente) as pos
          FROM vendas_brutas
          WHERE id_rca = ? AND ${repposCondition} ${dateFilter}
        `).get(v.id_vendedor, ...dateParams) as any) || { fat: 0, pos: 0 };

        const vTotalFat = vTot.fat || 0;
        const vRepposFat = vRep.fat || 0;
        const vTotalPos = vTot.pos || 0;
        const vRepposPos = vRep.pos || 0;

        return {
          id: v.id_vendedor,
          nome: v.nome_vendedor || `Vendedor ${v.id_vendedor}`,
          totalFat: vTotalFat,
          repposFat: vRepposFat,
          shareFat: vTotalFat > 0 ? (vRepposFat / vTotalFat) * 100 : 0,
          totalPos: vTotalPos,
          repposPos: vRepposPos,
          sharePos: vTotalPos > 0 ? (vRepposPos / vTotalPos) * 100 : 0
        };
      });

      return {
        nome: nomeSup,
        totalFat,
        repposFat,
        shareFat,
        totalPos,
        repposPos,
        sharePos,
        vendedores
      };
    });

    /* ── 3. Top Clientes Compradores no Reppos ──────────────────── */
    const topClientesRaw = db.prepare(`
      SELECT 
        v.id_cliente,
        v.cliente_nome,
        SUM(v.valor) as repposFat,
        COUNT(DISTINCT v.numero_pedido) as pedidos
      FROM vendas_brutas v
      WHERE ${repposCondition} ${dateFilter}
      GROUP BY v.id_cliente
      ORDER BY repposFat DESC
      LIMIT 15
    `).all(...dateParams) as any[];

    const topClientes = topClientesRaw.map(c => {
      const idCli = c.id_cliente;

      // 1. Tenta buscar na base_pdv_premiado (onde tem o nome da REDE ex: REDE BEMAIS)
      const pdvInfo = db.prepare(`
        SELECT cliente_nome, rede
        FROM base_pdv_premiado WHERE id_cliente = ? AND rede IS NOT NULL AND rede != '' LIMIT 1
      `).get(idCli) as any;

      // 2. Se não tiver na base_pdv_premiado, busca o nome na base_msl_clientes
      const mslInfo = db.prepare(`
        SELECT cliente_nome
        FROM base_msl_clientes WHERE id_cliente = ? LIMIT 1
      `).get(idCli) as any;

      // 3. Tenta buscar nome alternativo na vendas_brutas se não for nulo/número
      const vendaNomeReal = (db.prepare(`
        SELECT cliente_nome FROM vendas_brutas
        WHERE id_cliente = ? AND cliente_nome IS NOT NULL AND cliente_nome != '' AND cliente_nome NOT LIKE ? LIMIT 1
      `).get(idCli, `${idCli}%`) as any)?.cliente_nome;

      let nomeLimpo = pdvInfo?.cliente_nome || mslInfo?.cliente_nome || vendaNomeReal || c.cliente_nome || '';
      if (!nomeLimpo || nomeLimpo.trim() === String(idCli).trim() || nomeLimpo.startsWith('PDV') || nomeLimpo === `Cliente ${idCli}`) {
        nomeLimpo = `Cliente #${idCli}`;
      }

      const nomeRede = pdvInfo?.rede && pdvInfo.rede.trim() !== '' ? pdvInfo.rede : 'Independente';

      return {
        id_cliente: idCli,
        cliente_nome: nomeLimpo,
        rede: nomeRede,
        repposFat: c.repposFat,
        pedidos: c.pedidos
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        resumoGeral,
        supervisores,
        topClientes
      }
    });

  } catch (error) {
    console.error('Erro na API Reppos:', error);
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : 'Desconhecido'}` },
      { status: 500 }
    );
  }
}
