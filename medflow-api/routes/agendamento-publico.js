const express = require('express')
const pool    = require('../database')
const router  = express.Router()

// GET /publico/horarios?data=2026-05-20
router.get('/horarios', async (req, res) => {
  const { data } = req.query
  if (!data) return res.status(400).json({ erro: 'Informe a data' })

  try {
    const result = await pool.query(
      "SELECT hora FROM consultas WHERE data = $1 AND status != 'Cancelado'",
      [data]
    )
    const ocupados = result.rows.map(r => r.hora)

    const todosHorarios = [
      '08:00','08:30','09:00','09:30','10:00','10:30',
      '11:00','11:30','14:00','14:30','15:00','15:30',
      '16:00','16:30','17:00'
    ]

    const disponiveis = todosHorarios.filter(h => !ocupados.includes(h))
    res.json({ data, disponiveis, ocupados })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar horários.' })
  }
})

// POST /publico/agendar
router.post('/agendar', async (req, res) => {
  const { nome, telefone, email, data, hora, especialidade } = req.body

  if (!nome || !telefone || !data || !hora)
    return res.status(400).json({ erro: 'Nome, telefone, data e hora são obrigatórios.' })

  try {
    const conflito = await pool.query(
      "SELECT id FROM consultas WHERE data=$1 AND hora=$2 AND status!='Cancelado'",
      [data, hora]
    )
    if (conflito.rows.length > 0)
      return res.status(400).json({ erro: 'Horário não disponível. Escolha outro.' })

    // Cria paciente se não existir
    await pool.query(
      'INSERT INTO pacientes (nome, telefone, email) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [nome, telefone, email]
    )

    const paciente = await pool.query(
      'SELECT id FROM pacientes WHERE telefone=$1',
      [telefone]
    )

    await pool.query(
      "INSERT INTO consultas (paciente_id, data, hora, tipo, especialidade, status) VALUES ($1,$2,$3,'Consulta',$4,'Pendente')",
      [paciente.rows[0].id, data, hora, especialidade || 'Clínico Geral']
    )

    res.status(201).json({ mensagem: 'Consulta agendada com sucesso!', data, hora, nome })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao agendar.' })
  }
})

module.exports = router