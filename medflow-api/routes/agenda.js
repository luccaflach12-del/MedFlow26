const express = require('express')
const db      = require('../database')
const { autenticar } = require('../middleware/autenticar')

const router = express.Router()
router.use(autenticar)

// GET /agenda
router.get('/', (req, res) => {
  const { data } = req.query
  if (data) {
    const rows = db.prepare(`
      SELECT c.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.convenio
      FROM consultas c JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.data = ? ORDER BY c.hora ASC
    `).all(data)
    res.json(rows)
  } else {
    const rows = db.prepare(`
      SELECT c.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.convenio
      FROM consultas c JOIN pacientes p ON c.paciente_id = p.id
      ORDER BY c.data ASC, c.hora ASC
    `).all()
    res.json(rows)
  }
})

// GET /agenda/hoje
router.get('/hoje', (req, res) => {
  const hoje = new Date().toISOString().split('T')[0]
  const rows = db.prepare(`
    SELECT c.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.convenio
    FROM consultas c JOIN pacientes p ON c.paciente_id = p.id
    WHERE c.data = ? ORDER BY c.hora ASC
  `).all(hoje)
  res.json({ data: hoje, total: rows.length, consultas: rows })
})

// GET /agenda/:id
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT c.*, p.nome AS paciente_nome, p.email AS paciente_email,
           p.telefone AS paciente_telefone, p.convenio
    FROM consultas c JOIN pacientes p ON c.paciente_id = p.id
    WHERE c.id = ?
  `).get(req.params.id)
  if (!row) return res.status(404).json({ erro: 'Consulta não encontrada.' })
  res.json(row)
})

// POST /agenda
router.post('/', (req, res) => {
  const { paciente_id, data, hora, tipo, especialidade, observacoes } = req.body
  if (!paciente_id || !data || !hora)
    return res.status(400).json({ erro: 'Paciente, data e hora são obrigatórios.' })

  const paciente = db.prepare('SELECT id FROM pacientes WHERE id = ?').get(paciente_id)
  if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado.' })

  const conflito = db.prepare(
    "SELECT id FROM consultas WHERE data = ? AND hora = ? AND status != 'Cancelado'"
  ).get(data, hora)
  if (conflito) return res.status(400).json({ erro: 'Já existe uma consulta neste horário.' })

  const r = db.prepare(
    'INSERT INTO consultas (paciente_id, data, hora, tipo, especialidade, observacoes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(paciente_id, data, hora, tipo || 'Consulta', especialidade || 'Clínico Geral', observacoes)

  res.status(201).json({ mensagem: 'Consulta agendada!', id: r.lastInsertRowid, data, hora })
})

// PUT /agenda/:id/status
router.put('/:id/status', (req, res) => {
  const { status } = req.body
  const validos = ['Pendente', 'Confirmado', 'Cancelado', 'Realizado', 'Aguardando']
  if (!validos.includes(status))
    return res.status(400).json({ erro: `Status inválido. Use: ${validos.join(', ')}` })
  db.prepare('UPDATE consultas SET status = ? WHERE id = ?').run(status, req.params.id)
  res.json({ mensagem: `Status atualizado para "${status}"` })
})

// PUT /agenda/:id
router.put('/:id', (req, res) => {
  const { data, hora, tipo, especialidade, status, observacoes } = req.body
  db.prepare(
    'UPDATE consultas SET data=?, hora=?, tipo=?, especialidade=?, status=?, observacoes=? WHERE id=?'
  ).run(data, hora, tipo, especialidade, status, observacoes, req.params.id)
  res.json({ mensagem: 'Consulta atualizada!' })
})

// DELETE /agenda/:id
router.delete('/:id', (req, res) => {
  db.prepare("UPDATE consultas SET status = 'Cancelado' WHERE id = ?").run(req.params.id)
  res.json({ mensagem: 'Consulta cancelada.' })
})

module.exports = router