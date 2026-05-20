# MedFlow API — Guia de instalação

## Estrutura de arquivos

```
medflow-api/
  ├── server.js               ← ponto de entrada
  ├── database.js             ← banco de dados
  ├── package.json            ← dependências
  ├── middleware/
  │   └── autenticar.js       ← verificação de token
  └── routes/
      ├── auth.js             ← login e registro
      ├── pacientes.js        ← gerenciar pacientes
      └── agenda.js           ← gerenciar consultas
```

---

## Como rodar

### 1. Abra o terminal no VS Code dentro da pasta medflow-api

### 2. Instale as dependências
```
npm install
```

### 3. Inicie o servidor
```
npm start
```

Você verá:
```
✅ Banco de dados MedFlow pronto!
✅ MedFlow API rodando em http://localhost:3000
```

---

## Rotas disponíveis

### Autenticação
| Método | Rota             | O que faz              |
|--------|------------------|------------------------|
| POST   | /auth/registro   | Cria um novo usuário   |
| POST   | /auth/login      | Faz login, retorna token |

### Pacientes (precisam do token)
| Método | Rota              | O que faz               |
|--------|-------------------|-------------------------|
| GET    | /pacientes        | Lista todos os pacientes |
| GET    | /pacientes/:id    | Busca um paciente        |
| POST   | /pacientes        | Cria novo paciente       |
| PUT    | /pacientes/:id    | Atualiza paciente        |
| DELETE | /pacientes/:id    | Remove paciente          |

### Agenda (precisam do token)
| Método | Rota                  | O que faz                |
|--------|-----------------------|--------------------------|
| GET    | /agenda               | Lista todas as consultas |
| GET    | /agenda/hoje          | Consultas de hoje        |
| GET    | /agenda?data=2026-05-19 | Consultas de uma data  |
| GET    | /agenda/:id           | Busca uma consulta       |
| POST   | /agenda               | Cria nova consulta       |
| PUT    | /agenda/:id           | Atualiza consulta        |
| PUT    | /agenda/:id/status    | Atualiza status          |
| DELETE | /agenda/:id           | Cancela consulta         |

---

## Como testar no Insomnia

### 1. Criar usuário
- POST http://localhost:3000/auth/registro
- Body (JSON):
```json
{
  "nome": "Dr. Rafael",
  "email": "rafael@medflow.com",
  "senha": "123456",
  "cargo": "medico"
}
```

### 2. Fazer login e pegar o token
- POST http://localhost:3000/auth/login
- Body (JSON):
```json
{
  "email": "rafael@medflow.com",
  "senha": "123456"
}
```
- Copie o "token" da resposta

### 3. Usar o token nas próximas requisições
- Em cada requisição, adicione o header:
- Authorization: Bearer SEU_TOKEN_AQUI

### 4. Criar um paciente
- POST http://localhost:3000/pacientes
- Header: Authorization: Bearer SEU_TOKEN
- Body (JSON):
```json
{
  "nome": "Maria Souza",
  "email": "maria@email.com",
  "telefone": "(51) 99999-0001",
  "idade": 38,
  "convenio": "Unimed"
}
```

### 5. Agendar uma consulta
- POST http://localhost:3000/agenda
- Header: Authorization: Bearer SEU_TOKEN
- Body (JSON):
```json
{
  "paciente_id": 1,
  "data": "2026-05-20",
  "hora": "09:00",
  "tipo": "Retorno",
  "especialidade": "Cardiologia"
}
```