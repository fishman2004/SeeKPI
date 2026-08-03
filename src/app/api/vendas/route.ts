import { NextResponse } from 'next/server';
import db from '@/lib/db';
import '@/lib/schema';

/* ------------------------------------------------------------------ */
/*  GET /api/vendas                                                    */
/*  Retorna visões agregadas de vendas:                                */
/*  - resumoGlobal (Meta, Realizado, GAP, % de Sell-Out e Positivação) */
/*  - supervisores (Consolidado por Supervisor com vendedores)         */
/*  - fornecedores (Consolidado por Fornecedor)                        */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || '';
    const dia = searchParams.get('dia') || '';

    // Filtros de Data
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

    /* ── 1. Resumo Global (Empresa) ─────────────────────────────── */
    const faturamentoReal = (db.prepare(`
      SELECT SUM(valor) as fat FROM vendas_brutas WHERE 1=1 ${dateFilter}
    `).get(...dateParams) as any)?.fat || 0;

    const positivacaoReal = (db.prepare(`
      SELECT COUNT(DISTINCT id_cliente) as pos FROM vendas_brutas WHERE 1=1 ${dateFilter}
    `).get(...dateParams) as any)?.pos || 0;

    const metaFaturamentoGlobal = (db.prepare(`
      SELECT SUM(meta_financeira) as meta FROM base_metas_gerais
    `).get() as any)?.meta || 0;

    const metaCarteiraGlobal = (db.prepare(`
      SELECT SUM(total_clientes) as meta FROM base_carteira
    `).get() as any)?.meta || 0;

    const metaPositivacaoGlobal = metaCarteiraGlobal > 0 ? Math.round(metaCarteiraGlobal * 0.7) : 0;

    const resumoGlobal = {
      sellOut: {
        meta: metaFaturamentoGlobal,
        real: faturamentoReal,
        gap: faturamentoReal - metaFaturamentoGlobal,
        percent: metaFaturamentoGlobal > 0 ? (faturamentoReal / metaFaturamentoGlobal) * 100 : 0
      },
      positivacao: {
        meta: metaPositivacaoGlobal,
        real: positivacaoReal,
        gap: positivacaoReal - metaPositivacaoGlobal,
        percent: metaPositivacaoGlobal > 0 ? (positivacaoReal / metaPositivacaoGlobal) * 100 : 0
      }
    };

    /* ── 2. Visão Por Supervisor ────────────────────────────────── */
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

      const supReal = db.prepare(`
        SELECT SUM(valor) as fat, COUNT(DISTINCT id_cliente) as pos
        FROM vendas_brutas
        WHERE nome_supervisor = ? ${dateFilter}
      `).get(nomeSup, ...dateParams) as any;

      const vendedoresDoSup = db.prepare(`
        SELECT DISTINCT id_vendedor, nome_vendedor FROM base_vendedores WHERE nome_supervisor = ?
      `).all(nomeSup) as any[];

      const vendedorIds = vendedoresDoSup.map(v => v.id_vendedor).filter(Boolean);

      let supMetaFat = 0;
      let supMetaPos = 0;

      if (vendedorIds.length > 0) {
        const placeholders = vendedorIds.map(() => '?').join(',');
        supMetaFat = (db.prepare(`
          SELECT SUM(meta_financeira) as meta FROM base_metas_gerais WHERE id_vendedor IN (${placeholders})
        `).get(...vendedorIds) as any)?.meta || 0;

        const totalCarteiraSup = (db.prepare(`
          SELECT SUM(total_clientes) as total FROM base_carteira WHERE id_vendedor IN (${placeholders})
        `).get(...vendedorIds) as any)?.total || 0;

        supMetaPos = totalCarteiraSup > 0 ? Math.round(totalCarteiraSup * 0.7) : 0;
      }

      const fatReal = supReal?.fat || 0;
      const posReal = supReal?.pos || 0;

      const vendedoresDetalhe = vendedoresDoSup.map(v => {
        const vReal = db.prepare(`
          SELECT SUM(valor) as fat, COUNT(DISTINCT id_cliente) as pos
          FROM vendas_brutas
          WHERE id_rca = ? ${dateFilter}
        `).get(v.id_vendedor, ...dateParams) as any;

        const vMetaFat = (db.prepare(`
          SELECT SUM(meta_financeira) as meta FROM base_metas_gerais WHERE id_vendedor = ?
        `).get(v.id_vendedor) as any)?.meta || 0;

        const vCarteira = (db.prepare(`
          SELECT total_clientes FROM base_carteira WHERE id_vendedor = ?
        `).get(v.id_vendedor) as any)?.total_clientes || 0;

        const vMetaPos = vCarteira > 0 ? Math.round(vCarteira * 0.7) : 0;

        const vFat = vReal?.fat || 0;
        const vPos = vReal?.pos || 0;

        // Vendas do vendedor quebradas por fornecedor
        const vFornecedoresReal = db.prepare(`
          SELECT nome_fornecedor, SUM(valor) as fat, COUNT(DISTINCT id_cliente) as pos
          FROM vendas_brutas
          WHERE id_rca = ? ${dateFilter} AND nome_fornecedor IS NOT NULL AND nome_fornecedor != ''
          GROUP BY nome_fornecedor
        `).all(v.id_vendedor, ...dateParams) as any[];

        const vFornecedoresMap = new Map();
        vFornecedoresReal.forEach((f: any) => {
          vFornecedoresMap.set(f.nome_fornecedor?.toUpperCase(), f);
        });

        // Metas do vendedor por fornecedor
        const vMetasFornecedores = db.prepare(`
          SELECT nome_fornecedor, meta_financeira, meta_positivacao
          FROM base_metas_gerais
          WHERE id_vendedor = ?
        `).all(v.id_vendedor) as any[];

        const vMetasMap = new Map();
        vMetasFornecedores.forEach((m: any) => {
          vMetasMap.set(m.nome_fornecedor?.toUpperCase(), m);
        });

        // Todos os fornecedores únicos
        const allFornNames = Array.from(new Set([...vFornecedoresMap.keys(), ...vMetasMap.keys()]));

        const porFornecedor = allFornNames.map((fName) => {
          const fReal = vFornecedoresMap.get(fName);
          const fMeta = vMetasMap.get(fName);

          const fatRealF = fReal?.fat || 0;
          const posRealF = fReal?.pos || 0;
          const metaFatF = fMeta?.meta_financeira || 0;
          const metaPosF = fMeta?.meta_positivacao || 0;

          return {
            nome: fName,
            sellOut: {
              meta: metaFatF,
              real: fatRealF,
              gap: fatRealF - metaFatF,
              percent: metaFatF > 0 ? (fatRealF / metaFatF) * 100 : 0
            },
            positivacao: {
              meta: metaPosF,
              real: posRealF,
              gap: posRealF - metaPosF,
              percent: metaPosF > 0 ? (posRealF / metaPosF) * 100 : 0
            }
          };
        });

        return {
          id: v.id_vendedor,
          nome: v.nome_vendedor || `Vendedor ${v.id_vendedor}`,
          sellOut: {
            meta: vMetaFat,
            real: vFat,
            gap: vFat - vMetaFat,
            percent: vMetaFat > 0 ? (vFat / vMetaFat) * 100 : 0
          },
          positivacao: {
            meta: vMetaPos,
            real: vPos,
            gap: vPos - vMetaPos,
            percent: vPos > 0 ? (vPos / vMetaPos) * 100 : 0
          },
          porFornecedor
        };
      });

      return {
        nome: nomeSup,
        sellOut: {
          meta: supMetaFat,
          real: fatReal,
          gap: fatReal - supMetaFat,
          percent: supMetaFat > 0 ? (fatReal / supMetaFat) * 100 : 0
        },
        positivacao: {
          meta: supMetaPos,
          real: posReal,
          gap: posReal - supMetaPos,
          percent: supMetaPos > 0 ? (posReal / supMetaPos) * 100 : 0
        },
        vendedores: vendedoresDetalhe
      };
    });

    /* ── 3. Visão Por Fornecedor ────────────────────────────────── */
    const fornecedoresList = db.prepare(`
      SELECT DISTINCT nome_fornecedor as nome FROM vendas_brutas WHERE nome_fornecedor IS NOT NULL AND nome_fornecedor != ''
    `).all() as any[];

    const fornecedores = fornecedoresList.map(f => {
      const nomeF = f.nome;

      const fReal = db.prepare(`
        SELECT SUM(valor) as fat, COUNT(DISTINCT id_cliente) as pos
        FROM vendas_brutas
        WHERE nome_fornecedor = ? ${dateFilter}
      `).get(nomeF, ...dateParams) as any;

      const fMeta = db.prepare(`
        SELECT SUM(meta_financeira) as meta_fat, SUM(meta_positivacao) as meta_pos
        FROM base_metas_gerais
        WHERE UPPER(nome_fornecedor) = UPPER(?)
      `).get(nomeF) as any;

      const fatReal = fReal?.fat || 0;
      const posReal = fReal?.pos || 0;
      const metaFat = fMeta?.meta_fat || 0;
      const metaPos = fMeta?.meta_pos || 0;

      return {
        nome: nomeF,
        sellOut: {
          meta: metaFat,
          real: fatReal,
          gap: fatReal - metaFat,
          percent: metaFat > 0 ? (fatReal / metaFat) * 100 : 0
        },
        positivacao: {
          meta: metaPos,
          real: posReal,
          gap: posReal - metaPos,
          percent: metaPos > 0 ? (posReal / metaPos) * 100 : 0
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        resumoGlobal,
        supervisores,
        fornecedores
      }
    });

  } catch (error) {
    console.error('Erro na API de vendas:', error);
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : 'Desconhecido'}` },
      { status: 500 }
    );
  }
}
