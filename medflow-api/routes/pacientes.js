const express = require('express')
const db      = require('../database')
const { autenticar } = require('../middleware/autenticar')

const router = express.Router()
router.use(autenticar)

// GET /pacientes
router.get('/', (req, res) => {
  const { busca } = req.query
  if (busca) {
    const rows = db.prepare(
      'SELECT * FROM pacientes WHERE nome LIKE ? OR email LIKE ? ORDER BY nome ASC'
    ).all(`%${busca}%`, `%${busca}%`)
    res.json(rows)
  } else {
    res.json(db.prepare('SELECT * FROM pacientes ORDER BY nome ASC').all())
  }
})

// GET /pacientes/:id
router.get('/:id', (req, res) => {
  const paciente = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(req.params.id)
  if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado.' })
  const consultas = db.prepare('SELECT * FROM consultas WHERE paciente_id = ? ORDER BY data DESC').all(req.params.id)
  res.json({ ...paciente, consultas })
})

// POST /pacientes
router.post('/', (req, res) => {
  const { nome, email, telefone, idade, convenio, observacoes } = req.body
  if (!nome) return res.status(400).json({ erro: 'O nome é obrigatório.' })
  const r = db.prepare(
    'INSERT INTO pacientes (nome, email, telefone, idade, convenio, observacoes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(nome, email, telefone, idade, convenio || 'Particular', observacoes)
  res.status(201).json({ mensagem: 'Paciente cadastrado!', id: r.lastInsertRowid, nome })
})

// PUT /pacientes/:id
router.put('/:id', (req, res) => {
  const { nome, email, telefone, idade, convenio, observacoes } = req.body
  db.prepare(
    'UPDATE pacientes SET nome=?, email=?, telefone=?, idade=?, convenio=?, observacoes=? WHERE id=?'
  ).run(nome, email, telefone, idade, convenio, observacoes, req.params.id)
  res.json({ mensagem: 'Paciente atualizado!' })
})

// DELETE /pacientes/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM consultas WHERE paciente_id = ?').run(req.params.id)
  db.prepare('DELETE FROM pacientes WHERE id = ?').run(req.params.id)
  res.json({ mensagem: 'Paciente removido!' })
})

module.exports = router