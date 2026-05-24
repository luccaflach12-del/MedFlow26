const express = require('express')
const db      = require('../database')
const router  = express.Router()

// GET /publico/horarios?data=2026-05-20
router.get('/horarios', (req, res) => {
  const { data } = req.query
  if (!data) return res.status(400).json({ erro: 'Informe a data' })

  db.all(
    "SELECT hora FROM consultas WHERE data = ? AND status != 'Cancelado'",
    [data],
    (err, rows) => {
      const ocupados = rows.map(r => r.hora)

      const todosHorarios = [
        '08:00','08:30','09:00','09:30','10:00','10:30',
        '11:00','11:30','14:00','14:30','15:00','15:30',
        '16:00','16:30','17:00'
      ]

      const disponiveis = todosHorarios.filter(h => !ocupados.includes(h))
      res.json({ data, disponiveis, ocupados })
    }
  )
})

// POST /publico/agendar
router.post('/agendar', (req, res) => {
  const { nome, telefone, email, data, hora, especialidade } = req.body

  if (!nome || !telefone || !data || !hora) {
    return res.status(400).json({ erro: 'Nome, telefone, data e hora são obrigatórios.' })
  }

  db.get(
    "SELECT id FROM consultas WHERE data=? AND hora=? AND status!='Cancelado'",
    [data, hora],
    (err, conflito) => {
      if (conflito) return res.status(400).json({ erro: 'Horário não disponível. Escolha outro.' })

      db.run(
        'INSERT OR IGNORE INTO pacientes (nome, telefone, email) VALUES (?,?,?)',
        [nome, telefone, email],
        function() {
          const pacienteId = this.lastID

          const salvarConsulta = (pid) => {
            db.run(
              `INSERT INTO consultas (paciente_id, data, hora, tipo, especialidade, status)
               VALUES (?, ?, ?, 'Consulta', ?, 'Pendente')`,
              [pid, data, hora, especialidade || 'Clínico Geral'],
              function(err) {
                if (err) return res.status(500).json({ erro: 'Erro ao agendar.' })
                res.status(201).json({
                  mensagem: 'Consulta agendada com sucesso!',
                  data, hora, nome
                })
              }
            )
          }

          if (pacienteId) {
            salvarConsulta(pacienteId)
          } else {
            db.get('SELECT id FROM pacientes WHERE telefone=?', [telefone], (e, p) => {
              salvarConsulta(p.id)
            })
          }
        }
      )
    }
  )
})

module.exports = router