const jwt = require('jsonwebtoken')

const SEGREDO = 'medflow-chave-secreta-2026'

function autenticar(req, res, next) {
  // Pega o token do header Authorization
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não enviado. Faça login primeiro.' })
  }

  // O token vem como "Bearer eyJhbGci..."
  // Precisamos pegar só a parte depois de "Bearer "
  const token = authHeader.replace('Bearer ', '')

  try {
    const dados = jwt.verify(token, SEGREDO)
    req.usuario = dados  // passa os dados do usuário para a rota
    next()               // continua para a rota
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado. Faça login novamente.' })
  }
}

module.exports = { autenticar, SEGREDO }