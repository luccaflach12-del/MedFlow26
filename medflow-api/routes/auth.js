const express = require('express')
const bcrypt = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const db      = require('../database')
const { SEGREDO } = require('../middleware/autenticar')

const router = express.Router()

// ─────────────────────────────────────────
// POST /auth/registro
// Cria um novo usuário (médico ou recepcionista)
// ─────────────────────────────────────────
router.post('/registro', async (req, res) => {
  const { nome, email, senha, cargo } = req.body

  // Validações básicas
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' })
  }

  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' })
  }

  // Verifica se o email já existe
  const usuarioExistente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email)
  if (usuarioExistente) {
    return res.status(400).json({ erro: 'Este email já está cadastrado.' })
  }

  // Criptografa a senha antes de salvar
  const senhaCriptografada = await bcrypt.hash(senha, 10)

  // Salva no banco
  const resultado = db.prepare(`
    INSERT INTO usuarios (nome, email, senha, cargo)
    VALUES (?, ?, ?, ?)
  `).run(nome, email, senhaCriptografada, cargo || 'medico')

  res.status(201).json({
    mensagem: 'Usuário criado com sucesso!',
    id: resultado.lastInsertRowid,
    nome,
    email
  })
})

// ─────────────────────────────────────────
// POST /auth/login
// Verifica email e senha, retorna o token JWT
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, senha } = req.body

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' })
  }

  // Busca o usuário pelo email
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email)
  if (!usuario) {
    return res.status(401).json({ erro: 'Email não encontrado.' })
  }

  // Compara a senha digitada com a senha criptografada no banco
  const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'Senha incorreta.' })
  }

  // Gera o token JWT com 7 dias de validade
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, nome: usuario.nome, cargo: usuario.cargo },
    SEGREDO,
    { expiresIn: '7d' }
  )

  res.json({
    mensagem: 'Login realizado com sucesso!',
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo
    }
  })
})

module.exports = router