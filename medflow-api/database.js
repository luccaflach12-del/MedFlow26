const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('medflow.db', (err) => {
  if (err) {
    console.error('Erro ao conectar no banco:', err.message)
  } else {
    console.log('✅ Banco de dados MedFlow pronto!')
  }
})

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      TEXT NOT NULL,
    email     TEXT UNIQUE NOT NULL,
    senha     TEXT NOT NULL,
    cargo     TEXT DEFAULT 'medico',
    criado_em TEXT DEFAULT (datetime('now', 'localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS pacientes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL,
    email       TEXT,
    telefone    TEXT,
    idade       INTEGER,
    convenio    TEXT DEFAULT 'Particular',
    observacoes TEXT,
    criado_em   TEXT DEFAULT (datetime('now', 'localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS consultas (
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
  )`)
})

module.exports = db