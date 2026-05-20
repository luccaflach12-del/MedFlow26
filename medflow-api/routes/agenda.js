const express = require('express')
const db      = require('../database')
const { autenticar } = require('../middleware/autenticar')

const router = express.Router()

router.use(autenticar)

// ─────────────────────────────────────────
// GET /agenda
// Lista consultas. Filtra por data se enviado ?data=2026-05-19
// ─────────────────────────────────────────
router.get('/', (req, res) => {
  const { data } = req.query

  let consultas

  if (data) {
    consultas = db.prepare(`
      SELECT c.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.convenio
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.data = ?
      ORDER BY c.hora ASC
    `).all(data)
  } else {
    consultas = db.prepare(`
      SELECT c.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.convenio
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      ORDER BY c.data ASC, c.hora ASC
    `).all()
  }

  res.json(consultas)
})

// ─────────────────────────────────────────
// GET /agenda/hoje
// Atalho para as consultas de hoje
// ─────────────────────────────────────────
router.get('/hoje', (req, res) => {
  const hoje = new Date().toISOString().split('T')[0] // formato YYYY-MM-DD

  const consultas = db.prepare(`
    SELECT c.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.convenio
    FROM consultas c
    JOIN pacientes p ON c.paciente_id = p.id
    WHERE c.data = ?
    ORDER BY c.hora ASC
  `).all(hoje)

  res.json({ data: hoje, total: consultas.length, consultas })
})

// ─────────────────────────────────────────
// GET /agenda/:id
// Busca uma consulta específica
// ─────────────────────────────────────────
router.get('/:id', (req, res) => {
  const consulta = db.prepare(`
    SELECT c.*, p.nome AS paciente_nome, p.email AS paciente_email,
           p.telefone AS paciente_telefone, p.convenio
    FROM consultas c
    JOIN pacientes p ON c.paciente_id = p.id
    WHERE c.id = ?
  `).get(req.params.id)

  if (!consulta) {
    return res.status(404).json({ erro: 'Consulta não encontrada.' })
  }

  res.json(consulta)
})

// ─────────────────────────────────────────
// POST /agenda
// Cria um novo agendamento
// ─────────────────────────────────────────
router.post('/', (req, res) => {
  const { paciente_id, data, hora, tipo, especialidade, observacoes } = req.body

  if (!paciente_id || !data || !hora) {
    return res.status(400).json({ erro: 'Paciente, data e hora são obrigatórios.' })
  }

  // Verifica se o paciente existe
  const paciente = db.prepare('SELECT id FROM pacientes WHERE id = ?').get(paciente_id)
  if (!paciente) {
    return res.status(404).json({ erro: 'Paciente não encontrado.' })
  }

  // Verifica conflito de horário
  const conflito = db.prepare(`
    SELECT id FROM consultas WHERE data = ? AND hora = ? AND status != 'Cancelado'
  `).get(data, hora)

  if (conflito) {
    return res.status(400).json({ erro: 'Já existe uma consulta neste horário.' })
  }

  const resultado = db.prepare(`
    INSERT INTO consultas (paciente_id, data, hora, tipo, especialidade, observacoes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(paciente_id, data, hora, tipo || 'Consulta', especialidade || 'Clínico Geral', observacoes)

  res.status(201).json({
    mensagem: 'Consulta agendada com sucesso!',
    id: resultado.lastInsertRowid,
    data,
    hora
  })
})

// ─────────────────────────────────────────
// PUT /agenda/:id/status
// Atualiza o status de uma consulta
// Ex: { "status": "Confirmado" }
// ─────────────────────────────────────────
router.put('/:id/status', (req, res) => {
  const { status } = req.body
  const statusValidos = ['Pendente', 'Confirmado', 'Cancelado', 'Realizado', 'Aguardando']

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: `Status inválido. Use: ${statusValidos.join(', ')}` })
  }

  const consulta = db.prepare('SELECT id FROM consultas WHERE id = ?').get(req.params.id)
  if (!consulta) {
    return res.status(404).json({ erro: 'Consulta não encontrada.' })
  }

  db.prepare('UPDATE consultas SET status = ? WHERE id = ?').run(status, req.params.id)

  res.json({ mensagem: `Status atualizado para "${status}"` })
})

// ─────────────────────────────────────────
// PUT /agenda/:id
// Atualiza todos os dados de uma consulta
// ─────────────────────────────────────────
router.put('/:id', (req, res) => {
  const { data, hora, tipo, especialidade, status, observacoes } = req.body

  const consulta = db.prepare('SELECT id FROM consultas WHERE id = ?').get(req.params.id)
  if (!consulta) {
    return res.status(404).json({ erro: 'Consulta não encontrada.' })
  }

  db.prepare(`
    UPDATE consultas
    SET data = ?, hora = ?, tipo = ?, especialidade = ?, status = ?, observacoes = ?
    WHERE id = ?
  `).run(data, hora, tipo, especialidade, status, observacoes, req.params.id)

  res.json({ mensagem: 'Consulta atualizada com sucesso!' })
})

// ─────────────────────────────────────────
// DELETE /agenda/:id
// Cancela (ou remove) uma consulta
// ─────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const consulta = db.prepare('SELECT id FROM consultas WHERE id = ?').get(req.params.id)
  if (!consulta) {
    return res.status(404).json({ erro: 'Consulta não encontrada.' })
  }

  // Em vez de deletar, apenas marca como cancelada
  db.prepare("UPDATE consultas SET status = 'Cancelado' WHERE id = ?").run(req.params.id)

  res.json({ mensagem: 'Consulta cancelada com sucesso.' })
})

module.exports = router