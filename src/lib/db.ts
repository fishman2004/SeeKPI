import Database from 'better-sqlite3';
import path from 'path';

// O banco de dados será criado na raiz do projeto (caminho absoluto)
const dbPath = path.resolve(process.cwd(), 'seekpi.db');

// Configuração do better-sqlite3 com resiliência a travamentos (timeout de 10s)
const db = new Database(dbPath, { timeout: 10000 });

// Otimizações para performance e acesso concorrente sem bloqueio
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 10000');

export default db;
