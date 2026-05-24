const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const pool    = require('../database')
const { SEGREDO } = require('../middleware/autenticar')

const router = express.Router()

// POST /auth/registro
router.post('/registro', async (req, res) => {
  const { nome, email, senha, cargo } = req.body

  if (!nome || !email || !senha)
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' })

  if (senha.length < 6)
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' })

  try {
    const { rows } = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email])
    if (rows.length > 0)
      return res.status(400).json({ erro: 'Este email já está cadastrado.' })

    const senhaCriptografada = await bcrypt.hash(senha, 10)

    const resultado = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id',
      [nome, email, senhaCriptografada, cargo || 'medico']
    )

    res.status(201).json({ mensagem: 'Usuário criado!', id: resultado.rows[0].id, nome, email })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar usuário.' })
  }
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body

  if (!email || !senha)
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' })

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
    if (rows.length === 0)
      return res.status(401).json({ erro: 'Email não encontrado.' })

    const usuario = rows[0]
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
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao fazer login.' })
  }
})

module.exports = router