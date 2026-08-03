import { NextResponse } from 'next/server';
import { parse } from 'csv-parse';
import * as xlsx from 'xlsx';
import { Readable } from 'stream';
import db from '@/lib/db';
import '@/lib/schema';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const baseType = formData.get('baseType') as string | null;

    if (!file || !baseType) {
      return NextResponse.json({ error: 'Arquivo ou tipo de base ausente.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let totalImported = 0;

    // Define qual tabela e quais campos de acordo com o tipo
    let tableName = '';
    let insertQuery = '';
    let normalizeRow: (row: any) => any;

    const getVal = (row: any, keys: string[]) => {
      const rowKeys = Object.keys(row);
      const key = rowKeys.find(k => keys.includes(k.toUpperCase().trim()));
      return key ? row[key] : null;
    };

    if (baseType === 'produtos') {
      tableName = 'base_produtos';
      insertQuery = `INSERT INTO base_produtos (id_produto, nome_produto, categoria) VALUES (@id_produto, @nome_produto, @categoria)`;
      normalizeRow = (row) => ({
        id_produto: getVal(row, ['ID PRODUTO', 'ID_PRODUTO', 'CÓD PRODUTO', 'COD PRODUTO', 'D PRODUTO', 'ID'])?.toString() || null,
        nome_produto: getVal(row, ['NOME PRODUTO', 'NOME_PRODUTO', 'NOME', 'DESCRIÇÃO', 'DESCRICAO', 'PRODUTO'])?.toString() || null,
        categoria: getVal(row, ['CATEGORIA'])?.toString() || null,
      });
    } else if (baseType === 'pdv_premiado') {
      tableName = 'base_pdv_premiado';
      insertQuery = `INSERT INTO base_pdv_premiado (id_cliente, cliente_nome, meta_financeira, mes, rede, categoria_loja, quarter, vendedor_responsavel) VALUES (@id_cliente, @cliente_nome, @meta_financeira, @mes, @rede, @categoria_loja, @quarter, @vendedor_responsavel)`;
      normalizeRow = (row) => ({
        id_cliente: getVal(row, ['ID CLIENTE', 'ID_CLIENTE', 'CÓD CLIENTE', 'COD CLIENTE', 'CLIENTE', 'ID'])?.toString() || null,
        cliente_nome: getVal(row, ['CLIENTE NOME', 'CLIENTE_NOME', 'NOME CLIENTE', 'NOME DO CLIENTE', 'RAZÃO SOCIAL', 'RAZAO SOCIAL', 'CLIENTE'])?.toString() || null,
        meta_financeira: parseFloat((getVal(row, ['META FINANCEIRA', 'META_FINANCEIRA', 'META R$', 'META', 'VALOR']) || '0').toString().replace(',', '.')) || 0,
        mes: getVal(row, ['MÊS', 'MES'])?.toString() || null,
        rede: getVal(row, ['REDE'])?.toString() || null,
        categoria_loja: getVal(row, ['CATEGORIA', 'CATEGORIA LOJA', 'CATEGORIA DA LOJA'])?.toString() || null,
        quarter: getVal(row, ['Q', 'QUARTER', 'TRIMESTRE'])?.toString() || null,
        vendedor_responsavel: getVal(row, ['VENDEDOR', 'VENDEDOR_RESPONSAVEL', 'RESPONSAVEL'])?.toString() || null,
      });
    } else if (baseType === 'metas_gerais') {
      tableName = 'base_metas_gerais';
      insertQuery = `INSERT INTO base_metas_gerais (id_vendedor, nome_vendedor, id_fornecedor, nome_fornecedor, meta_financeira, meta_positivacao) VALUES (@id_vendedor, @nome_vendedor, @id_fornecedor, @nome_fornecedor, @meta_financeira, @meta_positivacao)`;
      normalizeRow = (row) => ({
        id_vendedor: getVal(row, ['ID RCA', 'ID_RCA', 'RCA', 'ID VENDEDOR', 'ID_VENDEDOR', 'CÓD VENDEDOR', 'COD VENDEDOR', 'VENDEDOR', 'ID', 'ROTA'])?.toString() || null,
        nome_vendedor: getVal(row, ['NOME RCA', 'NOME_RCA', 'NOME VENDEDOR', 'NOME_VENDEDOR', 'NOME', 'VENDEDOR'])?.toString() || null,
        id_fornecedor: getVal(row, ['ID FORNECEDOR', 'ID_FORNECEDOR', 'CÓD FORNECEDOR', 'COD FORNECEDOR', 'FORNECEDOR', 'ID'])?.toString() || null,
        nome_fornecedor: getVal(row, ['NOME FORNECEDOR', 'NOME_FORNECEDOR', 'FORNECEDOR NOME', 'FORNECEDOR'])?.toString() || null,
        meta_financeira: parseFloat((getVal(row, ['META FINANCEIRA', 'META_FINANCEIRA', 'META R$', 'META', 'VALOR', 'META ATENDIMENTO']) || '0').toString().replace(',', '.')) || 0,
        meta_positivacao: parseInt(getVal(row, ['META POSITIVACAO', 'META_POSITIVACAO', 'POSITIVACAO', 'CLIENTES', 'META CLI', 'META POSITIVAÇÃO', 'META ATENDIMENTO']) || 0, 10) || 0,
      });
    } else if (baseType === 'vendedores') {
      tableName = 'base_vendedores';
      insertQuery = `INSERT INTO base_vendedores (id_vendedor, nome_vendedor, nome_supervisor) VALUES (@id_vendedor, @nome_vendedor, @nome_supervisor)`;
      normalizeRow = (row) => ({
        id_vendedor: getVal(row, ['ID RCA', 'ID_RCA', 'RCA', 'ID VENDEDOR', 'ID_VENDEDOR', 'ID', 'COD VENDEDOR', 'ROTA'])?.toString() || null,
        nome_vendedor: getVal(row, ['NOME RCA', 'NOME_RCA', 'NOME VENDEDOR', 'NOME_VENDEDOR', 'NOME', 'VENDEDOR'])?.toString() || null,
        nome_supervisor: getVal(row, ['SUPERVISOR', 'NOME SUPERVISOR', 'NOME_SUPERVISOR', 'GESTOR'])?.toString() || null,
      });
    } else if (baseType === 'metas_clc') {
      tableName = 'base_metas_clc_categorias';
      insertQuery = `INSERT INTO base_metas_clc_categorias (id_vendedor, nome_vendedor, categoria, meta_clientes) VALUES (@id_vendedor, @nome_vendedor, @categoria, @meta_clientes)`;
      normalizeRow = (row) => ({
        id_vendedor: getVal(row, ['ID RCA', 'ID_RCA', 'RCA', 'ID VENDEDOR', 'ID_VENDEDOR', 'ID', 'COD VENDEDOR', 'VENDEDOR', 'ROTA'])?.toString() || null,
        nome_vendedor: getVal(row, ['NOME RCA', 'NOME_RCA', 'NOME VENDEDOR', 'NOME_VENDEDOR', 'NOME'])?.toString() || null,
        categoria: getVal(row, ['CATEGORIA', 'NOME CATEGORIA', 'CATEGORIA CLC'])?.toString() || null,
        meta_clientes: parseInt(getVal(row, ['META CLC', 'META_CLC', 'META', 'META CLIENTES', 'CLIENTES']) || 0, 10) || 0,
      });
    } else if (baseType === 'carteira') {
      tableName = 'base_carteira';
      insertQuery = `INSERT INTO base_carteira (id_vendedor, total_clientes) VALUES (@id_vendedor, @total_clientes)`;
      normalizeRow = (row) => ({
        id_vendedor: getVal(row, ['ID RCA', 'ID_RCA', 'RCA', 'ID VENDEDOR', 'ID_VENDEDOR', 'ID', 'COD VENDEDOR', 'VENDEDOR', 'ROTA'])?.toString() || null,
        total_clientes: parseInt(getVal(row, ['TOTAL CLIENTES', 'TOTAL_CLIENTES', 'CLIENTES', 'CARTEIRA', 'QTD CLIENTES']) || 0, 10) || 0,
      });
    } else if (baseType === 'msl_clientes') {
      tableName = 'base_msl_clientes';
      insertQuery = `INSERT INTO base_msl_clientes (id_cliente, cliente_nome, segmento, id_vendedor, tipo_msl) VALUES (@id_cliente, @cliente_nome, @segmento, @id_vendedor, @tipo_msl)`;
      normalizeRow = (row) => ({
        id_cliente: getVal(row, ['ID CLIENTE', 'ID_CLIENTE', 'CÓD CLIENTE', 'COD CLIENTE', 'CLIENTE', 'ID'])?.toString() || null,
        cliente_nome: getVal(row, ['CLIENTE NOME', 'CLIENTE_NOME', 'NOME CLIENTE', 'NOME DO CLIENTE', 'RAZÃO SOCIAL', 'RAZAO SOCIAL', 'CLIENTE'])?.toString() || null,
        segmento: getVal(row, ['SEGMENTO PDV', 'SEGMENTO_PDV', 'SEGMENTO', 'SEGMENTAÇÃO', 'SEGMENTACAO', 'CANAL', 'TAMANHO'])?.toString() || null,
        id_vendedor: getVal(row, ['ID RCA', 'ID_RCA', 'RCA', 'ID VENDEDOR', 'ID_VENDEDOR', 'COD VENDEDOR', 'VENDEDOR', 'VENDEDOR RESPONSAVEL', 'VENDEDOR RESPONSÁVEL'])?.toString() || null,
        tipo_msl: (getVal(row, ['TIPO MSL', 'TIPO_MSL', 'TIPO', 'PROJETO', 'MSL'])?.toString() || 'RECKITT CORE').toUpperCase().includes('VESTACY') ? 'VESTACY' : 'RECKITT CORE',
      });
    } else if (baseType === 'msl_produtos') {
      tableName = 'base_msl_produtos';
      insertQuery = `INSERT INTO base_msl_produtos (id_produto, nome_produto, segmento, tipo_msl) VALUES (@id_produto, @nome_produto, @segmento, @tipo_msl)`;
      normalizeRow = (row) => ({
        id_produto: getVal(row, ['ID PRODUTO', 'ID_PRODUTO', 'CÓD PRODUTO', 'COD PRODUTO', 'PRODUTO', 'ID'])?.toString() || null,
        nome_produto: getVal(row, ['NOME PRODUTO', 'NOME_PRODUTO', 'PRODUTO NOME', 'DESCRIÇÃO', 'DESCRICAO', 'NOME'])?.toString() || null,
        segmento: getVal(row, ['SEGMENTO PDV', 'SEGMENTO_PDV', 'SEGMENTO', 'SEGMENTAÇÃO', 'SEGMENTACAO', 'CANAL', 'TAMANHO'])?.toString() || null,
        tipo_msl: (getVal(row, ['TIPO MSL', 'TIPO_MSL', 'TIPO', 'PROJETO', 'MSL'])?.toString() || 'RECKITT CORE').toUpperCase().includes('VESTACY') ? 'VESTACY' : 'RECKITT CORE',
      });
    } else {
      return NextResponse.json({ error: 'Tipo de base desconhecido.' }, { status: 400 });
    }

    // Limpa a tabela atual antes de inserir a nova (Over-write total)
    db.prepare(`DELETE FROM ${tableName}`).run();

    const insertStmt = db.prepare(insertQuery);
    const insertBatch = db.transaction((rows: any[]) => {
      for (const row of rows) {
        try {
          insertStmt.run(row);
        } catch(e) {
          // ignora duplicações de chave primária para não quebrar a base inteira
        }
      }
    });

    const isCSV = file.name.toLowerCase().endsWith('.csv');

    if (isCSV) {
      await new Promise((resolve, reject) => {
        const stream = Readable.from(buffer);
        const parser = parse({
          columns: true,
          skip_empty_lines: true,
          delimiter: [';', ','],
          trim: true,
          relax_quotes: true,
          relax_column_count: true,
          bom: true
        });

        let batch: any[] = [];
        parser.on('readable', () => {
          let record;
          while ((record = parser.read()) !== null) {
            // Convert properties to upper case to match logic easily
            const upperRecord: any = {};
            for (let k of Object.keys(record)) {
              upperRecord[k.toUpperCase().trim()] = record[k];
            }
            batch.push(normalizeRow(upperRecord));
            if (batch.length >= 2000) {
              insertBatch(batch);
              totalImported += batch.length;
              batch = [];
            }
          }
        });

        parser.on('error', (err) => reject(err));
        parser.on('end', () => {
          if (batch.length > 0) {
            insertBatch(batch);
            totalImported += batch.length;
          }
          resolve(true);
        });

        stream.pipe(parser);
      });
    } else {
      // Processamento de Excel (.xlsx)
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0]; // Pega a primeira aba
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet) as any[];

      let batch: any[] = [];
      for (const record of data) {
        const upperRecord: any = {};
        for (let k of Object.keys(record)) {
          upperRecord[k.toUpperCase().trim()] = record[k];
        }
        batch.push(normalizeRow(upperRecord));
        if (batch.length >= 2000) {
          insertBatch(batch);
          totalImported += batch.length;
          batch = [];
        }
      }
      if (batch.length > 0) {
        insertBatch(batch);
        totalImported += batch.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Base atualizada com sucesso! Total: ${totalImported} linhas.`,
    });

  } catch (error) {
    console.error('Erro na API de bases:', error);
    return NextResponse.json(
      { error: `Erro ao processar: ${error instanceof Error ? error.message : 'Desconhecido'}` }, 
      { status: 500 }
    );
  }
}
