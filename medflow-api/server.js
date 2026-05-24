const express = require('express')

const rotasAuth      = require('./routes/auth')
const rotasPacientes = require('./routes/pacientes')
const rotasAgenda    = require('./routes/agenda')
const rotasPublicas  = require('./routes/agendamento-publico')

const app = express()

// CORS completo
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.use(express.json())

app.use('/auth',      rotasAuth)
app.use('/pacientes', rotasPacientes)
app.use('/agenda',    rotasAgenda)
app.use('/publico',   rotasPublicas)

app.get('/', (req, res) => {
  res.json({ mensagem: 'MedFlow API está funcionando!', versao: '1.0.0' })
})

const PORTA = 3000
app.listen(PORTA, () => {
  console.log(`✅ MedFlow API rodando em http://localhost:${PORTA}`)
})