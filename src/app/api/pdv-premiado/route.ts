import { NextResponse } from 'next/server';
import db from '@/lib/db';
import '@/lib/schema';

/* ------------------------------------------------------------------ */
/*  GET /api/pdv-premiado                                             */
/*  Retorna indicadores do PDV Premiado:                              */
/*  - Realizado estritamente de RECKITT CORE para cada PDV           */
/*  - Classificação GOLD (Meta < R$ 10k) e DIAMOND (Meta >= R$ 10k)    */
/*  - Total de PDVs Batidos e Restantes                               */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || '';
    const dia = searchParams.get('dia') || '';

    // Filtro de Data para vendas_brutas
    let dateFilter = '';
    const dateParams: string[] = [];
    if (mes && mes !== 'todos') {
      if (dia) {
        dateFilter = ` AND (v.data_pedido LIKE ? OR v.data_pedido LIKE ?)`;
        dateParams.push(`${dia}/${mes}/%`, `%/${mes}/${dia}%`);
      } else {
        dateFilter = ` AND (v.data_pedido LIKE ? OR v.data_pedido LIKE ?)`;
        dateParams.push(`%/${mes}/%`, `%-0${mes}-%`);
      }
    }

    // Busca todos os PDVs participantes na base_pdv_premiado
    const pdvsDb = db.prepare(`
      SELECT p.id_cliente, p.cliente_nome, p.meta_financeira, p.rede, p.categoria_loja
      FROM base_pdv_premiado p
      WHERE p.id_cliente IS NOT NULL AND p.id_cliente != ''
      GROUP BY p.id_cliente
    `).all() as any[];

    let totalMeta = 0;
    let totalRealizadoReckitt = 0;
    let goldCountTotal = 0;
    let goldCountBatidos = 0;
    let diamondCountTotal = 0;
    let diamondCountBatidos = 0;

    const pdvs = pdvsDb.map(pdv => {
      const idCli = pdv.id_cliente;
      const meta = pdv.meta_financeira || 0;

      // Realizado ESTRITAMENTE de RECKITT CORE
      const realReckitt = (db.prepare(`
        SELECT SUM(v.valor) as total
        FROM vendas_brutas v
        WHERE v.id_cliente = ? AND UPPER(v.nome_fornecedor) = 'RECKITT CORE' ${dateFilter}
      `).get(idCli, ...dateParams) as any)?.total || 0;

      const gap = realReckitt - meta;
      const percent = meta > 0 ? (realReckitt / meta) * 100 : 0;
      const isBatido = meta > 0 && realReckitt >= meta;

      // Categoria da Loja: DIAMOND se Meta >= R$ 10.000, GOLD se Meta < R$ 10.000
      const categoria = pdv.categoria_loja || (meta >= 10000 ? 'DIAMOND' : 'GOLD');

      if (categoria === 'DIAMOND') {
        diamondCountTotal++;
        if (isBatido) diamondCountBatidos++;
      } else {
        goldCountTotal++;
        if (isBatido) goldCountBatidos++;
      }

      totalMeta += meta;
      totalRealizadoReckitt += realReckitt;

      return {
        id_cliente: idCli,
        cliente_nome: pdv.cliente_nome || `PDV #${idCli}`,
        rede: pdv.rede || 'Independente',
        categoria,
        meta,
        realizado: realReckitt,
        gap,
        percent,
        isBatido
      };
    });

    // Ordenar primeiro os batidos, depois os com maior % de atingimento
    pdvs.sort((a, b) => b.percent - a.percent);

    const resumo = {
      totalPdvs: pdvs.length,
      pdvsBatidos: goldCountBatidos + diamondCountBatidos,
      pdvsRestantes: pdvs.length - (goldCountBatidos + diamondCountBatidos),
      goldTotal: goldCountTotal,
      goldBatidos: goldCountBatidos,
      diamondTotal: diamondCountTotal,
      diamondBatidos: diamondCountBatidos,
      metaTotal: totalMeta,
      realizadoTotal: totalRealizadoReckitt,
      gapTotal: totalRealizadoReckitt - totalMeta,
      percentGeral: totalMeta > 0 ? (totalRealizadoReckitt / totalMeta) * 100 : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        resumo,
        pdvs
      }
    });

  } catch (error) {
    console.error('Erro na API PDV Premiado:', error);
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : 'Desconhecido'}` },
      { status: 500 }
    );
  }
}
