const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const db      = require('../database')
const { SEGREDO } = require('../middleware/autenticar')

const router = express.Router()

// POST /auth/registro
router.post('/registro', async (req, res) => {
  const { nome, email, senha, cargo } = req.body

  if (!nome || !email || !senha)
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' })

  if (senha.length < 6)
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' })

  const usuarioExistente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email)
  if (usuarioExistente)
    return res.status(400).json({ erro: 'Este email já está cadastrado.' })

  const senhaCriptografada = await bcrypt.hash(senha, 10)

  const resultado = db.prepare(
    'INSERT INTO usuarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)'
  ).run(nome, email, senhaCriptografada, cargo || 'medico')

  res.status(201).json({ mensagem: 'Usuário criado!', id: resultado.lastInsertRowid, nome, email })
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body

  if (!email || !senha)
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' })

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email)
  if (!usuario)
    return res.status(401).json({ erro: 'Email não encontrado.' })

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
  if (!senhaCorreta)
    return res.status(401).json({ erro: 'Senha incorreta.' })

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, nome: usuario.nome, cargo: usuario.cargo },
    SEGREDO,
    { expiresIn: '7d' }
  )

  res.json({
    mensagem: 'Login realizado!',
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, cargo: usuario.cargo }
  })
})

module.exports = router