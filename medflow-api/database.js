const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:NJrCKOfAacqcWBVLqQtLypTWJqcvRzLj@zephyr.proxy.rlwy.net:49236/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function inicializar() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id        SERIAL PRIMARY KEY,
      nome      TEXT NOT NULL,
      email     TEXT UNIQUE NOT NULL,
      senha     TEXT NOT NULL,
      cargo     TEXT DEFAULT 'medico',
      criado_em TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id          SERIAL PRIMARY KEY,
      nome        TEXT NOT NULL,
      email       TEXT,
      telefone    TEXT,
      idade       INTEGER,
      convenio    TEXT DEFAULT 'Particular',
      observacoes TEXT,
      criado_em   TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS consultas (
      id            SERIAL PRIMARY KEY,
      paciente_id   INTEGER NOT NULL REFERENCES pacientes(id),
      data          TEXT NOT NULL,
      hora          TEXT NOT NULL,
      tipo          TEXT DEFAULT 'Consulta',
      especialidade TEXT DEFAULT 'Clínico Geral',
      status        TEXT DEFAULT 'Pendente',
      observacoes   TEXT,
      criado_em     TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `)

  console.log('✅ Banco de dados PostgreSQL pronto!')
}

inicializar().catch(console.error)

module.exports = pool