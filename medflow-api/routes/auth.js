const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const db      = require('../database')
const { SEGREDO } = require('../middleware/autenticar')

const router = express.Router()

// POST /auth/registro
router.post('/registro', async (req, res) => {
  const { nome, email, senha, cargo } = req.body

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' })
  }

  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' })
  }

  db.get('SELECT id FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
    if (usuario) {
      return res.status(400).json({ erro: 'Este email já está cadastrado.' })
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10)

    db.run(
      'INSERT INTO usuarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)',
      [nome, email, senhaCriptografada, cargo || 'medico'],
      function (err) {
        if (err) return res.status(500).json({ erro: 'Erro ao criar usuário.' })
        res.status(201).json({ mensagem: 'Usuário criado com sucesso!', id: this.lastID, nome, email })
      }
    )
  })
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' })
  }

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
    if (!usuario) {
      return res.status(401).json({ erro: 'Email não encontrado.' })
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha incorreta.' })
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nome: usuario.nome, cargo: usuario.cargo },
      SEGREDO,
      { expiresIn: '7d' }
    )

    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, cargo: usuario.cargo }
    })
  })
})

module.exports = router