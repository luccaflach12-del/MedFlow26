const express = require('express')
const db      = require('../database')
const { autenticar } = require('../middleware/autenticar')

const router = express.Router()

// Todas as rotas de pacientes exigem autenticação
router.use(autenticar)

// ─────────────────────────────────────────
// GET /pacientes
// Lista todos os pacientes
// ─────────────────────────────────────────
router.get('/', (req, res) => {
  const { busca } = req.query

  let pacientes

  if (busca) {
    // Se veio um termo de busca, filtra por nome ou email
    pacientes = db.prepare(`
      SELECT * FROM pacientes
      WHERE nome LIKE ? OR email LIKE ?
      ORDER BY nome ASC
    `).all(`%${busca}%`, `%${busca}%`)
  } else {
    pacientes = db.prepare('SELECT * FROM pacientes ORDER BY nome ASC').all()
  }

  res.json(pacientes)
})

// ─────────────────────────────────────────
// GET /pacientes/:id
// Busca um paciente pelo ID
// ─────────────────────────────────────────
router.get('/:id', (req, res) => {
  const paciente = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(req.params.id)

  if (!paciente) {
    return res.status(404).json({ erro: 'Paciente não encontrado.' })
  }

  // Busca também as consultas desse paciente
  const consultas = db.prepare(`
    SELECT * FROM consultas WHERE paciente_id = ? ORDER BY data DESC, hora DESC
  `).all(req.params.id)

  res.json({ ...paciente, consultas })
})

// ─────────────────────────────────────────
// POST /pacientes
// Cria um novo paciente
// ─────────────────────────────────────────
router.post('/', (req, res) => {
  const { nome, email, telefone, idade, convenio, observacoes } = req.body

  if (!nome) {
    return res.status(400).json({ erro: 'O nome do paciente é obrigatório.' })
  }

  const resultado = db.prepare(`
    INSERT INTO pacientes (nome, email, telefone, idade, convenio, observacoes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(nome, email, telefone, idade, convenio || 'Particular', observacoes)

  res.status(201).json({
    mensagem: 'Paciente cadastrado com sucesso!',
    id: resultado.lastInsertRowid,
    nome
  })
})

// ─────────────────────────────────────────
// PUT /pacientes/:id
// Atualiza os dados de um paciente
// ─────────────────────────────────────────
router.put('/:id', (req, res) => {
  const { nome, email, telefone, idade, convenio, observacoes } = req.body

  const paciente = db.prepare('SELECT id FROM pacientes WHERE id = ?').get(req.params.id)
  if (!paciente) {
    return res.status(404).json({ erro: 'Paciente não encontrado.' })
  }

  db.prepare(`
    UPDATE pacientes
    SET nome = ?, email = ?, telefone = ?, idade = ?, convenio = ?, observacoes = ?
    WHERE id = ?
  `).run(nome, email, telefone, idade, convenio, observacoes, req.params.id)

  res.json({ mensagem: 'Paciente atualizado com sucesso!' })
})

// ─────────────────────────────────────────
// DELETE /pacientes/:id
// Remove um paciente
// ─────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const paciente = db.prepare('SELECT id FROM pacientes WHERE id = ?').get(req.params.id)
  if (!paciente) {
    return res.status(404).json({ erro: 'Paciente não encontrado.' })
  }

  db.prepare('DELETE FROM consultas WHERE paciente_id = ?').run(req.params.id)
  db.prepare('DELETE FROM pacientes WHERE id = ?').run(req.params.id)

  res.json({ mensagem: 'Paciente removido com sucesso.' })
})

module.exports = router