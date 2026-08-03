import { NextResponse } from 'next/server';
import db from '@/lib/db';
import '@/lib/schema';

/* ------------------------------------------------------------------ */
/*  GET /api/categorias                                               */
/*  Retorna visões consolidadas das Categorias CLC:                    */
/*  - resumoGeral (Categorias, Metas, Realizados, Batidas vs Restam)   */
/*  - supervisoresMatriz (Gestão x Categorias CLC)                    */
/*  - vendedoresMatriz (Vendedores x Categorias CLC + Batidas)         */
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
        dateFilter = ` AND (data_pedido LIKE ? OR data_pedido LIKE ?)`;
        dateParams.push(`${dia}/${mes}/%`, `%/${mes}/${dia}%`);
      } else {
        dateFilter = ` AND (data_pedido LIKE ? OR data_pedido LIKE ?)`;
        dateParams.push(`%/${mes}/%`, `%-0${mes}-%`);
      }
    }

    /* ── 1. Resumo Geral de Categorias CLC ────────────────────────── */
    // Busca todas as categorias únicas na base_metas_clc_categorias ou base_msl_produtos
    const categoriasDb = db.prepare(`
      SELECT DISTINCT categoria FROM base_metas_clc_categorias WHERE categoria IS NOT NULL AND categoria != '' ORDER BY categoria
    `).all() as any[];

    // Se não tiver cadastradas, busca os nomes das categorias
    const categoriasList = categoriasDb.map(c => c.categoria);

    // Calculo do Resumo Geral por Categoria
    let totalMetaGeral = 0;
    let totalRealGeral = 0;
    let categoriasBatidasCount = 0;

    const resumoCategorias = categoriasList.map(catName => {
      // Meta total da categoria
      const metaCat = (db.prepare(`
        SELECT SUM(meta_clientes) as m FROM base_metas_clc_categorias WHERE UPPER(categoria) = UPPER(?)
      `).get(catName) as any)?.m || 0;

      // Realizado da categoria (Se for GERAL, e a Positivacao Total de Clientes em Reckitt Core)
      let realCat = 0;
      if (catName.toUpperCase() === 'GERAL') {
        realCat = (db.prepare(`
          SELECT COUNT(DISTINCT id_cliente) as pos
          FROM vendas_brutas
          WHERE UPPER(nome_fornecedor) = 'RECKITT CORE' ${dateFilter}
        `).get(...dateParams) as any)?.pos || 0;
      } else {
        realCat = (db.prepare(`
          SELECT COUNT(DISTINCT v.id_cliente) as pos
          FROM vendas_brutas v
          JOIN base_produtos p ON v.id_produto = p.id_produto
          WHERE UPPER(p.categoria) = UPPER(?) ${dateFilter}
        `).get(catName, ...dateParams) as any)?.pos || 0;
      }

      const gap = realCat - metaCat;
      const percent = metaCat > 0 ? (realCat / metaCat) * 100 : 0;
      const isBatida = metaCat > 0 && realCat >= metaCat;

      if (isBatida) categoriasBatidasCount++;
      totalMetaGeral += metaCat;
      totalRealGeral += realCat;

      return {
        categoria: catName,
        meta: metaCat,
        realizado: realCat,
        gap,
        percent,
        isBatida
      };
    });

    const resumoGeral = {
      totalCategorias: categoriasList.length,
      batidas: categoriasBatidasCount,
      restantes: categoriasList.length - categoriasBatidasCount,
      metaGeral: totalMetaGeral,
      realGeral: totalRealGeral,
      gapGeral: totalRealGeral - totalMetaGeral,
      percentGeral: totalMetaGeral > 0 ? (totalRealGeral / totalMetaGeral) * 100 : 0,
      categorias: resumoCategorias
    };

    /* ── 2. Visão Matriz Por Supervisor ─────────────────────────── */
    let supervisoresList = db.prepare(`
      SELECT DISTINCT nome_supervisor as nome FROM base_vendedores WHERE nome_supervisor IS NOT NULL AND nome_supervisor != ''
    `).all() as any[];

    if (supervisoresList.length === 0) {
      supervisoresList = db.prepare(`
        SELECT DISTINCT nome_supervisor as nome FROM vendas_brutas WHERE nome_supervisor IS NOT NULL AND nome_supervisor != ''
      `).all() as any[];
    }

    const supervisoresMatriz = supervisoresList.map(sup => {
      const nomeSup = sup.nome;

      // Vendedores do supervisor
      const vendedoresDoSup = db.prepare(`
        SELECT DISTINCT id_vendedor FROM base_vendedores WHERE nome_supervisor = ?
      `).all(nomeSup) as any[];

      const vIds = vendedoresDoSup.map(v => v.id_vendedor).filter(Boolean);

      let supMetaTotal = 0;
      let supRealTotal = 0;

      const categoriasSup = categoriasList.map(catName => {
        let metaSupCat = 0;
        let realSupCat = 0;

        if (vIds.length > 0) {
          const vPlaceholders = vIds.map(() => '?').join(',');

          // Meta da categoria para os vendedores do supervisor
          metaSupCat = (db.prepare(`
            SELECT SUM(meta_clientes) as m FROM base_metas_clc_categorias 
            WHERE UPPER(categoria) = UPPER(?) AND id_vendedor IN (${vPlaceholders})
          `).get(catName, ...vIds) as any)?.m || 0;

          // Realizado do supervisor (Se for GERAL, e Positivacao de Clientes em Reckitt Core)
          if (catName.toUpperCase() === 'GERAL') {
            realSupCat = (db.prepare(`
              SELECT COUNT(DISTINCT id_cliente) as pos
              FROM vendas_brutas
              WHERE id_rca IN (${vPlaceholders}) AND UPPER(nome_fornecedor) = 'RECKITT CORE' ${dateFilter}
            `).get(...vIds, ...dateParams) as any)?.pos || 0;
          } else {
            realSupCat = (db.prepare(`
              SELECT COUNT(DISTINCT v.id_cliente) as pos
              FROM vendas_brutas v
              JOIN base_produtos p ON v.id_produto = p.id_produto
              WHERE v.id_rca IN (${vPlaceholders}) AND UPPER(p.categoria) = UPPER(?) ${dateFilter}
            `).get(...vIds, catName, ...dateParams) as any)?.pos || 0;
          }
        }

        supMetaTotal += metaSupCat;
        supRealTotal += realSupCat;

        return {
          categoria: catName,
          meta: metaSupCat,
          realizado: realSupCat,
          gap: realSupCat - metaSupCat,
          percent: metaSupCat > 0 ? (realSupCat / metaSupCat) * 100 : 0
        };
      });

      return {
        nome: nomeSup,
        metaTotal: supMetaTotal,
        realTotal: supRealTotal,
        gapTotal: supRealTotal - supMetaTotal,
        percentTotal: supMetaTotal > 0 ? (supRealTotal / supMetaTotal) * 100 : 0,
        categorias: categoriasSup
      };
    });

    /* ── 3. Visão Matriz Por Vendedor ────────────────────────────── */
    let vendedoresList = db.prepare(`
      SELECT DISTINCT id_vendedor as id, nome_vendedor as nome, nome_supervisor as supervisor
      FROM base_vendedores WHERE id_vendedor IS NOT NULL
      ORDER BY nome
    `).all() as any[];

    const vendedoresMatriz = vendedoresList.map(v => {
      let vMetaTotal = 0;
      let vRealTotal = 0;
      let vBatidasCount = 0;

      const categoriasVendedor = categoriasList.map(catName => {
        const metaVCat = (db.prepare(`
          SELECT SUM(meta_clientes) as m FROM base_metas_clc_categorias 
          WHERE UPPER(categoria) = UPPER(?) AND id_vendedor = ?
        `).get(catName, v.id) as any)?.m || 0;

        let realVCat = 0;
        if (catName.toUpperCase() === 'GERAL') {
          realVCat = (db.prepare(`
            SELECT COUNT(DISTINCT id_cliente) as pos
            FROM vendas_brutas
            WHERE id_rca = ? AND UPPER(nome_fornecedor) = 'RECKITT CORE' ${dateFilter}
          `).get(v.id, ...dateParams) as any)?.pos || 0;
        } else {
          realVCat = (db.prepare(`
            SELECT COUNT(DISTINCT v.id_cliente) as pos
            FROM vendas_brutas v
            JOIN base_produtos p ON v.id_produto = p.id_produto
            WHERE v.id_rca = ? AND UPPER(p.categoria) = UPPER(?) ${dateFilter}
          `).get(v.id, catName, ...dateParams) as any)?.pos || 0;
        }

        const isBatida = metaVCat > 0 && realVCat >= metaVCat;
        if (isBatida) vBatidasCount++;

        vMetaTotal += metaVCat;
        vRealTotal += realVCat;

        return {
          categoria: catName,
          meta: metaVCat,
          realizado: realVCat,
          gap: realVCat - metaVCat,
          percent: metaVCat > 0 ? (realVCat / metaVCat) * 100 : 0,
          isBatida
        };
      });

      return {
        id: v.id,
        nome: v.nome || `Vendedor ${v.id}`,
        supervisor: v.supervisor || 'N/A',
        metaTotal: vMetaTotal,
        realTotal: vRealTotal,
        gapTotal: vRealTotal - vMetaTotal,
        percentTotal: vMetaTotal > 0 ? (vRealTotal / vMetaTotal) * 100 : 0,
        batidasCount: vBatidasCount,
        totalCategorias: categoriasList.length,
        categorias: categoriasVendedor
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        resumoGeral,
        supervisoresMatriz,
        vendedoresMatriz
      }
    });

  } catch (error) {
    console.error('Erro na API Categorias CLC:', error);
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : 'Desconhecido'}` },
      { status: 500 }
    );
  }
}
