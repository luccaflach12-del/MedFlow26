const express = require('express')
const cors    = require('cors')

const rotasAuth      = require('./routes/auth')
const rotasPacientes = require('./routes/pacientes')
const rotasAgenda    = require('./routes/agenda')

const app = express()

// Permite que o frontend HTML acesse a API
app.use(cors())

// Permite receber JSON no corpo das requisições
app.use(express.json())

// Rotas
app.use('/auth',      rotasAuth)
app.use('/pacientes', rotasPacientes)
app.use('/agenda',    rotasAgenda)

// Rota raiz para testar se a API está online
app.get('/', (req, res) => {
  res.json({ mensagem: 'MedFlow API está funcionando!', versao: '1.0.0' })
})

const PORTA = 3000
app.listen(PORTA, () => {
  console.log(`✅ MedFlow API rodando em http://localhost:${PORTA}`)
})