const express = require('express')
const db      = require('../database')
const { autenticar } = require('../middleware/autenticar')

const router = express.Router()
router.use(autenticar)

// GET /agenda
router.get('/', (req, res) => {
  const { data } = req.query

  const sql = `
    SELECT c.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.convenio
    FROM consultas c
    JOIN pacientes p ON c.paciente_id = p.id
    ${data ? 'WHERE c.data = ?' : ''}
    ORDER BY c.data ASC, c.hora ASC
  `

  db.all(sql, data ? [data] : [], (err, rows) => {
    if (err) return res.status(500).json({ erro: 'Erro ao buscar agenda.' })
    res.json(rows)
  })
})

// GET /agenda/hoje
router.get('/hoje', (req, res) => {
  const hoje = new Date().toISOString().split('T')[0]

  db.all(
    `SELECT c.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.convenio
     FROM consultas c
     JOIN pacientes p ON c.paciente_id = p.id
     WHERE c.data = ? ORDER BY c.hora ASC`,
    [hoje],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: 'Erro ao buscar agenda de hoje.' })
      res.json({ data: hoje, total: rows.length, consultas: rows })
    }
  )
})

// GET /agenda/:id
router.get('/:id', (req, res) => {
  db.get(
    `SELECT c.*, p.nome AS paciente_nome, p.email AS paciente_email,
            p.telefone AS paciente_telefone, p.convenio
     FROM consultas c
     JOIN pacientes p ON c.paciente_id = p.id
     WHERE c.id = ?`,
    [req.params.id],
    (err, row) => {
      if (!row) return res.status(404).json({ erro: 'Consulta não encontrada.' })
      res.json(row)
    }
  )
})

// POST /agenda
router.post('/', (req, res) => {
  const { paciente_id, data, hora, tipo, especialidade, observacoes } = req.body

  if (!paciente_id || !data || !hora) {
    return res.status(400).json({ erro: 'Paciente, data e hora são obrigatórios.' })
  }

  db.get('SELECT id FROM pacientes WHERE id = ?', [paciente_id], (err, paciente) => {
    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado.' })

    db.get(
      "SELECT id FROM consultas WHERE data = ? AND hora = ? AND status != 'Cancelado'",
      [data, hora],
      (err, conflito) => {
        if (conflito) return res.status(400).json({ erro: 'Já existe uma consulta neste horário.' })

        db.run(
          'INSERT INTO consultas (paciente_id, data, hora, tipo, especialidade, observacoes) VALUES (?, ?, ?, ?, ?, ?)',
          [paciente_id, data, hora, tipo || 'Consulta', especialidade || 'Clínico Geral', observacoes],
          function (err) {
            if (err) return res.status(500).json({ erro: 'Erro ao agendar consulta.' })
            res.status(201).json({ mensagem: 'Consulta agendada!', id: this.lastID, data, hora })
          }
        )
      }
    )
  })
})

// PUT /agenda/:id/status
router.put('/:id/status', (req, res) => {
  const { status } = req.body
  const statusValidos = ['Pendente', 'Confirmado', 'Cancelado', 'Realizado', 'Aguardando']

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: `Status inválido. Use: ${statusValidos.join(', ')}` })
  }

  db.run('UPDATE consultas SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ erro: 'Erro ao atualizar status.' })
    res.json({ mensagem: `Status atualizado para "${status}"` })
  })
})

// PUT /agenda/:id
router.put('/:id', (req, res) => {
  const { data, hora, tipo, especialidade, status, observacoes } = req.body

  db.run(
    'UPDATE consultas SET data=?, hora=?, tipo=?, especialidade=?, status=?, observacoes=? WHERE id=?',
    [data, hora, tipo, especialidade, status, observacoes, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ erro: 'Erro ao atualizar consulta.' })
      res.json({ mensagem: 'Consulta atualizada!' })
    }
  )
})

// DELETE /agenda/:id
router.delete('/:id', (req, res) => {
  db.run("UPDATE consultas SET status = 'Cancelado' WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ erro: 'Erro ao cancelar consulta.' })
    res.json({ mensagem: 'Consulta cancelada.' })
  })
})

module.exports = router