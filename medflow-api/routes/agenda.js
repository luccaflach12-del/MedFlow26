const express = require('express')
const pool    = require('../database')
const { autenticar } = require('../middleware/autenticar')

const router = express.Router()
router.use(autenticar)

// GET /agenda
router.get('/', async (req, res) => {
  try {
    const { data } = req.query
    let result
    if (data) {
      result = await pool.query(`
        SELECT c.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.convenio
        FROM consultas c JOIN pacientes p ON c.paciente_id = p.id
        WHERE c.data = $1 ORDER BY c.hora ASC
      `, [data])
    } else {
      result = await pool.query(`
        SELECT c.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.convenio
        FROM consultas c JOIN pacientes p ON c.paciente_id = p.id
        ORDER BY c.data ASC, c.hora ASC
      `)
    }
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar agenda.' })
  }
})

// GET /agenda/hoje
router.get('/hoje', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0]
    const result = await pool.query(`
      SELECT c.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.convenio
      FROM consultas c JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.data = $1 ORDER BY c.hora ASC
    `, [hoje])
    res.json({ data: hoje, total: result.rows.length, consultas: result.rows })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar agenda de hoje.' })
  }
})

// GET /agenda/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.nome AS paciente_nome, p.email AS paciente_email,
             p.telefone AS paciente_telefone, p.convenio
      FROM consultas c JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.id = $1
    `, [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Consulta não encontrada.' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar consulta.' })
  }
})

// POST /agenda
router.post('/', async (req, res) => {
  const { paciente_id, data, hora, tipo, especialidade, observacoes } = req.body
  if (!paciente_id || !data || !hora)
    return res.status(400).json({ erro: 'Paciente, data e hora são obrigatórios.' })

  try {
    const paciente = await pool.query('SELECT id FROM pacientes WHERE id = $1', [paciente_id])
    if (paciente.rows.length === 0) return res.status(404).json({ erro: 'Paciente não encontrado.' })

    const conflito = await pool.query(
      "SELECT id FROM consultas WHERE data = $1 AND hora = $2 AND status != 'Cancelado'",
      [data, hora]
    )
    if (conflito.rows.length > 0) return res.status(400).json({ erro: 'Já existe uma consulta neste horário.' })

    const result = await pool.query(
      'INSERT INTO consultas (paciente_id, data, hora, tipo, especialidade, observacoes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [paciente_id, data, hora, tipo || 'Consulta', especialidade || 'Clínico Geral', observacoes]
    )
    res.status(201).json({ mensagem: 'Consulta agendada!', id: result.rows[0].id, data, hora })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao agendar consulta.' })
  }
})

// PUT /agenda/:id/status
router.put('/:id/status', async (req, res) => {
  const { status } = req.body
  const validos = ['Pendente', 'Confirmado', 'Cancelado', 'Realizado', 'Aguardando']
  if (!validos.includes(status))
    return res.status(400).json({ erro: `Status inválido. Use: ${validos.join(', ')}` })

  try {
    await pool.query('UPDATE consultas SET status = $1 WHERE id = $2', [status, req.params.id])
    res.json({ mensagem: `Status atualizado para "${status}"` })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar status.' })
  }
})

// PUT /agenda/:id
router.put('/:id', async (req, res) => {
  const { data, hora, tipo, especialidade, status, observacoes } = req.body
  try {
    await pool.query(
      'UPDATE consultas SET data=$1, hora=$2, tipo=$3, especialidade=$4, status=$5, observacoes=$6 WHERE id=$7',
      [data, hora, tipo, especialidade, status, observacoes, req.params.id]
    )
    res.json({ mensagem: 'Consulta atualizada!' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar consulta.' })
  }
})

// DELETE /agenda/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query("UPDATE consultas SET status = 'Cancelado' WHERE id = $1", [req.params.id])
    res.json({ mensagem: 'Consulta cancelada.' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cancelar consulta.' })
  }
})

module.exports = router