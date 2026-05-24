const express = require('express')
const db      = require('../database')
const { autenticar } = require('../middleware/autenticar')

const router = express.Router()
router.use(autenticar)

// GET /pacientes
router.get('/', (req, res) => {
  const { busca } = req.query

  if (busca) {
    db.all(
      'SELECT * FROM pacientes WHERE nome LIKE ? OR email LIKE ? ORDER BY nome ASC',
      [`%${busca}%`, `%${busca}%`],
      (err, rows) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar pacientes.' })
        res.json(rows)
      }
    )
  } else {
    db.all('SELECT * FROM pacientes ORDER BY nome ASC', [], (err, rows) => {
      if (err) return res.status(500).json({ erro: 'Erro ao buscar pacientes.' })
      res.json(rows)
    })
  }
})

// GET /pacientes/:id
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM pacientes WHERE id = ?', [req.params.id], (err, paciente) => {
    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado.' })

    db.all(
      'SELECT * FROM consultas WHERE paciente_id = ? ORDER BY data DESC',
      [req.params.id],
      (err, consultas) => {
        res.json({ ...paciente, consultas: consultas || [] })
      }
    )
  })
})

// POST /pacientes
router.post('/', (req, res) => {
  const { nome, email, telefone, idade, convenio, observacoes } = req.body

  if (!nome) return res.status(400).json({ erro: 'O nome do paciente é obrigatório.' })

  db.run(
    'INSERT INTO pacientes (nome, email, telefone, idade, convenio, observacoes) VALUES (?, ?, ?, ?, ?, ?)',
    [nome, email, telefone, idade, convenio || 'Particular', observacoes],
    function (err) {
      if (err) return res.status(500).json({ erro: 'Erro ao cadastrar paciente.' })
      res.status(201).json({ mensagem: 'Paciente cadastrado!', id: this.lastID, nome })
    }
  )
})

// PUT /pacientes/:id
router.put('/:id', (req, res) => {
  const { nome, email, telefone, idade, convenio, observacoes } = req.body

  db.run(
    'UPDATE pacientes SET nome=?, email=?, telefone=?, idade=?, convenio=?, observacoes=? WHERE id=?',
    [nome, email, telefone, idade, convenio, observacoes, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ erro: 'Erro ao atualizar paciente.' })
      res.json({ mensagem: 'Paciente atualizado!' })
    }
  )
})

// DELETE /pacientes/:id
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM consultas WHERE paciente_id = ?', [req.params.id], () => {
    db.run('DELETE FROM pacientes WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ erro: 'Erro ao remover paciente.' })
      res.json({ mensagem: 'Paciente removido!' })
    })
  })
})

module.exports = router