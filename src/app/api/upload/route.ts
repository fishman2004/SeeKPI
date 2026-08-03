import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import db from '@/lib/db';
import '@/lib/schema'; // Garante que a tabela existe

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado.' },
        { status: 400 }
      );
    }

    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let totalImported = 0;
    const dataImportacao = new Date().toISOString();

    // Limpa a base de vendas atual para garantir que o novo arquivo sobrescreva e não duplique dados
    db.prepare('DELETE FROM vendas_brutas').run();

    const insertStmt = db.prepare(`
      INSERT INTO vendas_brutas (
        id_rca, nome_rca, nome_supervisor, numero_pedido, posicao_ped, 
        data_pedido, id_cliente, cliente_nome, id_produto, nome_produto, 
        id_fornecedor, nome_fornecedor, qtde_cx, qtde_und, valor, 
        qtde_cx_vendida, data_importacao
      ) VALUES (
        @id_rca, @nome_rca, @nome_supervisor, @numero_pedido, @posicao_ped, 
        @data_pedido, @id_cliente, @cliente_nome, @id_produto, @nome_produto, 
        @id_fornecedor, @nome_fornecedor, @qtde_cx, @qtde_und, @valor, 
        @qtde_cx_vendida, @data_importacao
      )
    `);

    const insertBatch = db.transaction((rows: any[]) => {
      for (const row of rows) {
        insertStmt.run(row);
      }
    });

    const normalizeRow = (row: any) => {
      // Helper to find key case-insensitively since CSV/Excel headers might vary
      const getVal = (keys: string[]) => {
        const key = Object.keys(row).find(k => keys.includes(k.toUpperCase().trim()));
        return key ? row[key] : null;
      };

      return {
        id_rca: getVal(['ID RCA', 'ID_RCA'])?.toString() || null,
        nome_rca: getVal(['NOME RCA', 'NOME_RCA'])?.toString() || null,
        nome_supervisor: getVal(['NOME SUPERVISOR', 'NOME_SUPERVISOR'])?.toString() || null,
        numero_pedido: getVal(['NUMERO PEDIDO', 'NUMERO_PEDIDO', 'NOME PEDIDO'])?.toString() || null,
        posicao_ped: getVal(['POSICAO PED', 'POSICAO_PED'])?.toString() || null,
        data_pedido: getVal(['DATA PEDIDO', 'DATA_PEDIDO'])?.toString() || null,
        id_cliente: getVal(['COD CLIENTE', 'COD_CLIENTE', 'COD CLI', 'ID CLIENTE', 'ID_CLIENTE', 'CODIGO'])?.toString() || null,
        cliente_nome: getVal(['CLIENTE', 'NOME CLIENTE', 'NOME_CLIENTE', 'CLIENTE NOME', 'CLIENTE_NOME', 'RAZAO SOCIAL', 'NOME DO CLIENTE'])?.toString() || null,
        id_produto: getVal(['ID PRODUTO', 'ID_PRODUTO', 'PRODUTO'])?.toString() || null,
        nome_produto: getVal(['NOME PRODUTO', 'NOME_PRODUTO', 'DESCRICAO'])?.toString() || null,
        id_fornecedor: getVal(['ID FORNECEDOR', 'ID_FORNECEDOR', 'FORNECEDOR'])?.toString() || null,
        nome_fornecedor: getVal(['NOME FORNECEDOR', 'NOME_FORNECEDOR'])?.toString() || null,
        qtde_cx: parseInt(getVal(['QTDE CX', 'QTDE_CX']) || 0, 10) || 0,
        qtde_und: parseInt(getVal(['QTDE UND', 'QTDE_UND']) || 0, 10) || 0,
        valor: parseFloat((getVal(['VALOR']) || 0).toString().replace(',', '.')) || 0,
        qtde_cx_vendida: parseFloat((getVal(['QTDE CX VENDIDA', 'QTDE_CX_VENDIDA']) || 0).toString().replace(',', '.')) || 0,
        data_importacao: dataImportacao,
      };
    };

    if (isCSV) {
      // Motor de Alta Performance para CSV (Leitura direta em memória + Inserção em Bloco Único)
      let text = buffer.toString('utf-8');
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1); // Remove BOM se houver
      }

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        throw new Error('O arquivo CSV parece estar vazio ou sem linhas de dados.');
      }

      // Auto-detecta delimitador da primeira linha (; ou , ou tab)
      const firstLine = lines[0];
      let delimiter = ';';
      if ((firstLine.match(/,/g) || []).length > (firstLine.match(/;/g) || []).length) {
        delimiter = ',';
      } else if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/;/g) || []).length) {
        delimiter = '\t';
      }

      // Função simples de split respeitando aspas básicas
      const splitRow = (rowStr: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < rowStr.length; i++) {
          const char = rowStr[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
      };

      const headers = splitRow(lines[0]).map(h => h.toUpperCase().trim());

      const findIdx = (candidates: string[]) => {
        return headers.findIndex(h => candidates.includes(h));
      };

      const colIdx = {
        id_rca: findIdx(['ID RCA', 'ID_RCA', 'RCA', 'ID VENDEDOR', 'COD VENDEDOR']),
        nome_rca: findIdx(['NOME RCA', 'NOME_RCA', 'VENDEDOR', 'NOME VENDEDOR']),
        nome_supervisor: findIdx(['NOME SUPERVISOR', 'NOME_SUPERVISOR', 'SUPERVISOR']),
        numero_pedido: findIdx(['NUMERO PEDIDO', 'NUMERO_PEDIDO', 'NOME PEDIDO', 'PEDIDO']),
        posicao_ped: findIdx(['POSICAO PED', 'POSICAO_PED', 'POSICAO', 'STATUS']),
        data_pedido: findIdx(['DATA PEDIDO', 'DATA_PEDIDO', 'DATA']),
        id_cliente: findIdx(['COD CLIENTE', 'COD_CLIENTE', 'COD CLI', 'CODIGO CLIENTE', 'ID CLIENTE', 'ID_CLIENTE', 'CODIGO']),
        cliente_nome: findIdx(['CLIENTE', 'NOME CLIENTE', 'NOME_CLIENTE', 'CLIENTE NOME', 'CLIENTE_NOME', 'RAZAO SOCIAL', 'NOME DO CLIENTE']),
        id_produto: findIdx(['ID PRODUTO', 'ID_PRODUTO', 'PRODUTO', 'COD PRODUTO']),
        nome_produto: findIdx(['NOME PRODUTO', 'NOME_PRODUTO', 'DESCRICAO', 'PRODUTO NOME']),
        id_fornecedor: findIdx(['ID FORNECEDOR', 'ID_FORNECEDOR', 'FORNECEDOR', 'COD FORNECEDOR']),
        nome_fornecedor: findIdx(['NOME FORNECEDOR', 'NOME_FORNECEDOR', 'FORNECEDOR NOME']),
        qtde_cx: findIdx(['QTDE CX', 'QTDE_CX', 'QTD CX', 'CAIXAS']),
        qtde_und: findIdx(['QTDE UND', 'QTDE_UND', 'QTD UND', 'UNIDADES']),
        valor: findIdx(['VALOR', 'VALOR TOTAL', 'TOTAL R$', 'VALOR R$']),
        qtde_cx_vendida: findIdx(['QTDE CX VENDIDA', 'QTDE_CX_VENDIDA', 'CX VENDIDAS']),
      };

      const getColVal = (cols: string[], idx: number) => {
        return idx !== -1 && cols[idx] !== undefined ? cols[idx] : null;
      };

      const allRowsToInsert: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = splitRow(lines[i]);
        if (cols.length < 3) continue; // Pula linha corrompida

        allRowsToInsert.push({
          id_rca: getColVal(cols, colIdx.id_rca),
          nome_rca: getColVal(cols, colIdx.nome_rca),
          nome_supervisor: getColVal(cols, colIdx.nome_supervisor),
          numero_pedido: getColVal(cols, colIdx.numero_pedido),
          posicao_ped: getColVal(cols, colIdx.posicao_ped),
          data_pedido: getColVal(cols, colIdx.data_pedido),
          id_cliente: getColVal(cols, colIdx.id_cliente),
          cliente_nome: getColVal(cols, colIdx.cliente_nome),
          id_produto: getColVal(cols, colIdx.id_produto),
          nome_produto: getColVal(cols, colIdx.nome_produto),
          id_fornecedor: getColVal(cols, colIdx.id_fornecedor),
          nome_fornecedor: getColVal(cols, colIdx.nome_fornecedor),
          qtde_cx: parseInt(getColVal(cols, colIdx.qtde_cx) || '0', 10) || 0,
          qtde_und: parseInt(getColVal(cols, colIdx.qtde_und) || '0', 10) || 0,
          valor: parseFloat((getColVal(cols, colIdx.valor) || '0').replace(',', '.')) || 0,
          qtde_cx_vendida: parseFloat((getColVal(cols, colIdx.qtde_cx_vendida) || '0').replace(',', '.')) || 0,
          data_importacao: dataImportacao,
        });
      }

      // Executa tudo dentro de UMA ÚNICA transação atômica limpa sem mudar pragmas da conexão
      const insertAll = db.transaction((rows: any[]) => {
        for (const row of rows) {
          insertStmt.run(row);
        }
      });

      insertAll(allRowsToInsert);
      totalImported = allRowsToInsert.length;

      return NextResponse.json({ 
        success: true, 
        message: `Upload realizado via CSV! Total: ${totalImported} linhas importadas no banco de dados em tempo recorde!`,
        rowsImported: totalImported 
      });

    } else {
      // Fallback para Excel (.xlsx)
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      
      let targetSheetName = workbook.SheetNames[0];
      let maxRows = 0;
      
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const sheetData = xlsx.utils.sheet_to_json(sheet) as any[];
        if (sheetData.length > maxRows) {
          maxRows = sheetData.length;
          targetSheetName = sheetName;
        }
      }

      const worksheet = workbook.Sheets[targetSheetName];
      const data = xlsx.utils.sheet_to_json(worksheet) as any[];

      if (data.length === 0) {
        throw new Error('A planilha está vazia.');
      }

      const BATCH_SIZE = 1000;
      let batch: any[] = [];
      
      for (const row of data) {
        batch.push(normalizeRow(row));
        if (batch.length >= BATCH_SIZE) {
          insertBatch(batch);
          totalImported += batch.length;
          batch = [];
        }
      }
      if (batch.length > 0) {
        insertBatch(batch);
        totalImported += batch.length;
      }

      return NextResponse.json({ 
        success: true, 
        message: `Upload realizado via Excel! Aba processada: "${targetSheetName}". Total: ${totalImported} linhas importadas no banco de dados.`,
        rowsImported: totalImported 
      });
    }

  } catch (error) {
    console.error('Erro no upload ou importação:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { 
        error: `Erro ao processar: ${errorMessage}`, 
        details: errorMessage
      }, 
      { status: 500 }
    );
  }
}
