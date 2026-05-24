const Database = require('better-sqlite3')
const db = new Database('medflow.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      TEXT NOT NULL,
    email     TEXT UNIQUE NOT NULL,
    senha     TEXT NOT NULL,
    cargo     TEXT DEFAULT 'medico',
    criado_em TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS pacientes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL,
    email       TEXT,
    telefone    TEXT,
    idade       INTEGER,
    convenio    TEXT DEFAULT 'Particular',
    observacoes TEXT,
    criado_em   TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS consultas (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id   INTEGER NOT NULL,
    data          TEXT NOT NULL,
    hora          TEXT NOT NULL,
    tipo          TEXT DEFAULT 'Consulta',
    especialidade TEXT DEFAULT 'Clínico Geral',
    status        TEXT DEFAULT 'Pendente',
    observacoes   TEXT,
    criado_em     TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
  );
`)

console.log('✅ Banco de dados MedFlow pronto!')

module.exports = db