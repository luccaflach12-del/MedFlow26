const express = require('express')
const pool    = require('../database')
const { autenticar } = require('../middleware/autenticar')

const router = express.Router()
router.use(autenticar)

// GET /pacientes
router.get('/', async (req, res) => {
  try {
    const { busca } = req.query
    let result
    if (busca) {
      result = await pool.query(
        'SELECT * FROM pacientes WHERE nome ILIKE $1 OR email ILIKE $1 ORDER BY nome ASC',
        [`%${busca}%`]
      )
    } else {
      result = await pool.query('SELECT * FROM pacientes ORDER BY nome ASC')
    }
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pacientes.' })
  }
})

// GET /pacientes/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM pacientes WHERE id = $1', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ erro: 'Paciente não encontrado.' })

    const consultas = await pool.query(
      'SELECT * FROM consultas WHERE paciente_id = $1 ORDER BY data DESC',
      [req.params.id]
    )
    res.json({ ...rows[0], consultas: consultas.rows })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar paciente.' })
  }
})

// POST /pacientes
router.post('/', async (req, res) => {
  const { nome, email, telefone, idade, convenio, observacoes } = req.body
  if (!nome) return res.status(400).json({ erro: 'O nome é obrigatório.' })

  try {
    const { rows } = await pool.query(
      'INSERT INTO pacientes (nome, email, telefone, idade, convenio, observacoes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [nome, email, telefone, idade, convenio || 'Particular', observacoes]
    )
    res.status(201).json({ mensagem: 'Paciente cadastrado!', id: rows[0].id, nome })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cadastrar paciente.' })
  }
})

// PUT /pacientes/:id
router.put('/:id', async (req, res) => {
  const { nome, email, telefone, idade, convenio, observacoes } = req.body
  try {
    await pool.query(
      'UPDATE pacientes SET nome=$1, email=$2, telefone=$3, idade=$4, convenio=$5, observacoes=$6 WHERE id=$7',
      [nome, email, telefone, idade, convenio, observacoes, req.params.id]
    )
    res.json({ mensagem: 'Paciente atualizado!' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar paciente.' })
  }
})

// DELETE /pacientes/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM consultas WHERE paciente_id = $1', [req.params.id])
    await pool.query('DELETE FROM pacientes WHERE id = $1', [req.params.id])
    res.json({ mensagem: 'Paciente removido!' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover paciente.' })
  }
})

module.exports = router