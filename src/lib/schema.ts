import db from './db';

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS vendas_brutas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_rca TEXT,
    nome_rca TEXT,
    nome_supervisor TEXT,
    numero_pedido TEXT,
    posicao_ped TEXT,
    data_pedido TEXT,
    id_cliente TEXT,
    cliente_nome TEXT,
    id_produto TEXT,
    nome_produto TEXT,
    id_fornecedor TEXT,
    nome_fornecedor TEXT,
    qtde_cx INTEGER,
    qtde_und INTEGER,
    valor REAL,
    qtde_cx_vendida REAL,
    data_importacao TEXT
  );

  CREATE TABLE IF NOT EXISTS base_produtos (
    id_produto TEXT PRIMARY KEY,
    nome_produto TEXT,
    categoria TEXT
  );

  CREATE TABLE IF NOT EXISTS base_pdv_premiado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente TEXT,
    cliente_nome TEXT,
    meta_financeira REAL,
    mes TEXT,
    rede TEXT,
    categoria_loja TEXT,
    quarter TEXT,
    vendedor_responsavel TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS base_metas_gerais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_vendedor TEXT,
    nome_vendedor TEXT,
    id_fornecedor TEXT,
    nome_fornecedor TEXT,
    meta_financeira REAL,
    meta_positivacao INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS base_vendedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_vendedor TEXT,
    nome_vendedor TEXT,
    nome_supervisor TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS base_metas_clc_categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_vendedor TEXT,
    nome_vendedor TEXT,
    categoria TEXT,
    meta_clientes INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS base_carteira (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_vendedor TEXT,
    total_clientes INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS base_msl_clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente TEXT,
    cliente_nome TEXT,
    segmento TEXT,
    id_vendedor TEXT,
    tipo_msl TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS base_msl_produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_produto TEXT,
    nome_produto TEXT,
    segmento TEXT,
    tipo_msl TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// Executa a criação da tabela
db.exec(createTableQuery);

// Migração: adicionar colunas id_vendedor e nome_vendedor caso a tabela já exista sem elas
try { db.exec('ALTER TABLE base_metas_clc_categorias ADD COLUMN id_vendedor TEXT'); } catch(e) { /* coluna já existe */ }
try { db.exec('ALTER TABLE base_metas_clc_categorias ADD COLUMN nome_vendedor TEXT'); } catch(e) { /* coluna já existe */ }

console.log('Schema do banco de dados verificado/criado com sucesso.');

export default db;
