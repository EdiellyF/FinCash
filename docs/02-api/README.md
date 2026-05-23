# 🔌 Documentação da API FinCash

<div align="center">

![Swagger](https://img.shields.io/badge/swagger-openapi%203.0-green)
![REST](https://img.shields.io/badge/api-rest-blue)
![JWT](https://img.shields.io/badge/auth-jwt-brightgreen)
![WebSocket](https://img.shields.io/badge/websocket-socket.io-orange)

**API RESTful completa com documentação interativa Swagger**

[Swagger UI Interativo](http://localhost:5000/api-docs) •
[Base URL](http://localhost:5000/api) •
[Versão](https://img.shields.io/badge/versão-2.0-blue)

</div>

---

## 🎯 Visão Geral

A API FinCash fornece endpoints completos para gestão financeira pessoal, integrando-se com inteligência artificial para fornecer insights personalizados.

### 🌐 Base URL
```
Development: http://localhost:5000/api
Production:  https://api.fincash.com/api
```

### 🔑 Autenticação
A maioria dos endpoints requer autenticação via JWT Bearer Token:

```bash
Authorization: Bearer <your-jwt-token>
```

### 📊 Rate Limiting
- Padrão: 100 requisições/minuto por usuário
- Chatbot: 5 requisições/minuto (IA intensive)
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 📖 Endpoints da API

### 🔐 Autenticação (`/api/auth`)

#### `POST /api/auth/register`
Cadastro de novo usuário com validação de email.

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### `POST /api/auth/login`
Login do usuário e geração de token JWT.

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### `POST /api/auth/logout`
Logout do usuário (invalida token no client).

#### `POST /api/auth/request-register`
Solicita cadastro com envio de OTP por email.

#### `POST /api/auth/verify-register`
Verifica email com código OTP.

#### `POST /api/auth/resend-otp`
Reenvia código OTP para email.

#### `POST /api/auth/forgot-password`
Solicita recuperação de senha.

#### `POST /api/auth/reset-password`
Redefine senha com token.

---

### 👤 Usuários (`/api/users`)

#### `GET /api/users/me`
Obtém perfil do usuário autenticado.

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### `PUT /api/users/me`
Atualiza perfil do usuário.

```json
{
  "name": "John Updated",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

---

### 🏷️ Categorias (`/api/categories`)

#### `GET /api/categories`
Lista todas as categorias do usuário (padrão + personalizadas).

**Query Parameters**:
- Nenhum obrigatório

**Response**:
```json
{
  "success": true,
  "message": "Categorias listadas com sucesso",
  "data": [
    {
      "id": "uuid",
      "name": "Alimentação",
      "type": "expense",
      "color": "#FF5733",
      "icon": "utensils",
      "isDefault": true
    }
  ]
}
```

#### `POST /api/categories`
Cria nova categoria personalizada.

```json
{
  "name": "Lazer",
  "type": "expense",
  "color": "#9B59B6",
  "icon": "gamepad"
}
```

#### `PUT /api/categories/:id`
Atualiza categoria existente.

#### `DELETE /api/categories/:id`
Remove categoria (se não tiver transações vinculadas).

---

### 💳 Transações (`/api/transactions`)

#### `GET /api/transactions`
Lista transações com paginação e filtros.

**Query Parameters**:
- `page` (default: 1) - Número da página
- `limit` (default: 50) - Itens por página
- `type` (optional) - "income" ou "expense"
- `categoryId` (optional) - Filtrar por categoria
- `startDate` (optional) - Data inicial (YYYY-MM-DD)
- `endDate` (optional) - Data final (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "message": "Transações listadas com sucesso",
  "data": [
    {
      "id": "uuid",
      "title": "Supermercado",
      "description": "Compras semanais",
      "amount": 250.50,
      "type": "expense",
      "transactionDate": "2024-01-15",
      "category": {
        "id": "uuid",
        "name": "Alimentação",
        "type": "expense"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### `POST /api/transactions`
Cria nova transação.

```json
{
  "categoryId": "uuid",
  "type": "expense",
  "title": "Supermercado Extra",
  "description": "Compras do mês",
  "amount": 250.50,
  "transactionDate": "2024-01-15"
}
```

**Response com Alerta de Orçamento**:
```json
{
  "success": true,
  "message": "Transação criada com sucesso",
  "data": {
    "transaction": { /* transaction data */ },
    "budgetAlert": {
      "category": "Alimentação",
      "month": 1,
      "year": 2024,
      "limit": 500.00,
      "projected": 550.00,
      "exceededBy": 50.00
    }
  }
}
```

#### `PUT /api/transactions/:id`
Atualiza transação existente.

#### `DELETE /api/transactions/:id`
Remove transação.

---

### 🎯 Metas (`/api/goals`)

#### `GET /api/goals`
Lista todas as metas financeiras.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Comprar Notebook",
      "targetAmount": 5000.00,
      "currentAmount": 2500.00,
      "progress": 50.0,
      "deadline": "2024-12-31",
      "createdAt": "2024-01-01"
    }
  ]
}
```

#### `POST /api/goals`
Cria nova meta financeira.

```json
{
  "title": "Viagem de Férias",
  "targetAmount": 3000.00,
  "deadline": "2024-07-01"
}
```

#### `PUT /api/goals/:id`
Atualiza meta existente.

#### `DELETE /api/goals/:id`
Remove meta.

---

### 📊 Orçamentos (`/api/budgets`)

#### `GET /api/budgets`
Lista orçamentos mensais.

**Query Parameters**:
- `month` (optional) - Filtrar por mês
- `year` (optional) - Filtrar por ano

#### `POST /api/budgets`
Cria ou atualiza orçamento mensal.

```json
{
  "categoryId": "uuid",
  "month": 1,
  "year": 2024,
  "limitAmount": 500.00
}
```

#### `PUT /api/budgets/:id`
Atualiza orçamento existente.

#### `DELETE /api/budgets/:id`
Remove orçamento.

---

### 📈 Dashboard (`/api/dashboard`)

#### `GET /api/dashboard`
Obtém visão geral financeira.

**Response**:
```json
{
  "success": true,
  "data": {
    "balance": 1500.00,
    "totalIncome": 5000.00,
    "totalExpense": 3500.00,
    "recentTransactions": [/* last 10 transactions */],
    "goalsProgress": [/* goals with progress */],
    "budgetsStatus": [/* budgets with spending */]
  }
}
```

---

### 📄 Relatórios (`/api/reports`)

#### `GET /api/reports/monthly`
Relatório mensal detalhado.

**Query Parameters**:
- `month` (required) - Mês (1-12)
- `year` (required) - Ano

#### `GET /api/reports/category`
Resumo por categoria.

**Query Parameters**:
- `startDate` (optional) - Data inicial
- `endDate` (optional) - Data final

#### `GET /api/reports/export/csv`
Exporta transações para CSV.

**Query Parameters**:
- `month` (required) - Mês
- `year` (required) - Ano
- `advanced` (optional) - Usar exportador avançado
- `fields` (optional) - Campos específicos (ex: "title,amount,date")
- `separator` (optional) - Separador (default: ",")

#### `GET /api/reports/export/pdf`
Exporta para PDF.

**Query Parameters**:
- `month` (optional) - Mês (para transactions/budgets)
- `year` (optional) - Ano
- `type` (optional) - "transactions", "goals", "budgets"
- `advanced` (optional) - Usar exportador avançado

#### `GET /api/reports/export/goals-csv`
Exporta metas para CSV.

#### `GET /api/reports/export/budgets-csv`
Exporta orçamentos para CSV.

---

### 🤖 Chatbot IA (`/api/chat`)

#### `POST /api/chat/message`
Envia mensagem para o assistente financeiro IA.

```json
{
  "message": "Como posso economizar mais dinheiro este mês?"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Análise gerada com sucesso",
  "data": {
    "response": "Baseado no seu histórico...",
    "provider": "groq",
    "remainingRequests": 4,
    "analysis": {
      /* structured analysis sections */
    }
  }
}
```

#### `POST /api/chat/message-stream`
Envia mensagem com resposta em streaming.

#### `GET /api/chat/history`
Obtém histórico de conversas do usuário.

#### `GET /api/chat/limits`
Obtém limites de uso da IA.

**Response**:
```json
{
  "success": true,
  "data": {
    "gemini": { "used": 2, "limit": 5 },
    "groq": { "used": 10, "limit": 25 }
  }
}
```

#### `GET /api/chat/export-pdf`
Exporta histórico de chat para PDF.

#### `POST /api/chat/compare`
Compara períodos financeiros.

```json
{
  "periods": ["7d", "30d", "365d"]
}
```

---

### 🧠 Categorização IA (`/api/categorization`)

#### `POST /api/categorization/suggest`
Sugere categoria para uma transação.

```json
{
  "title": "Supermercado Extra",
  "description": "Compras semanais",
  "type": "expense"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "categoryId": "uuid",
    "categoryName": "Alimentação",
    "confidence": 0.95,
    "method": "keyword_matching"
  }
}
```

#### `GET /api/categorization/batch`
Obtém sugestões de categorização em lote.

**Query Parameters**:
- `limit` (optional) - Número de transações (default: 50)
- `type` (optional) - "income" ou "expense"

#### `POST /api/categorization/auto/:transactionId`
Auto-categoriza uma transação específica.

---

### 📊 Estatísticas (`/api/stats`)

#### `GET /api/stats/user`
Obtém estatísticas do usuário.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalTransactions": 150,
    "totalGoals": 5,
    "totalBudgets": 12,
    "accountCreated": "2024-01-01"
  }
}
```

#### `GET /api/stats/history`
Obtém histórico de uso da IA.

---

## 🔒 Códigos de Erro

### Códigos HTTP
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Invalid/missing token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `409` - Conflict (Duplicate entry)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

### Códigos de Erro Personalizados
```json
{
  "success": false,
  "message": "Descrição do erro",
  "code": "ERROR_CODE",
  "details": { /* additional error context */ }
}
```

**Códigos Comuns**:
- `VALIDATION_ERROR` - Dados inválidos
- `AUTHENTICATION_ERROR` - Token inválido/expirado
- `AUTHORIZATION_ERROR` - Permissões insuficientes
- `NOT_FOUND` - Recurso não encontrado
- `CONFLICT_ERROR` - Entrada duplicada
- `RATE_LIMIT_EXCEEDED` - Muitas requisições
- `DUPLICATE_ENTRY` - Registro duplicado (DB)
- `FOREIGN_KEY_ERROR` - Violação de chave estrangeira
- `DATABASE_ERROR` - Erro de banco de dados

---

## 🧪 Exemplos de Uso

### Autenticação Completa

```javascript
// 1. Login
const login = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const { token } = await login.json();

// 2. Usar token em requisições subsequentes
const transactions = await fetch('http://localhost:5000/api/transactions', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Criar Transação com Tratamento de Erros

```javascript
try {
  const response = await fetch('http://localhost:5000/api/transactions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      categoryId: 'uuid',
      type: 'expense',
      title: 'Supermercado',
      amount: 150.50,
      transactionDate: '2024-01-15'
    })
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('Transação criada:', data.data);
    if (data.data.budgetAlert) {
      console.warn('Alerta de orçamento:', data.data.budgetAlert);
    }
  } else {
    console.error('Erro:', data.message, data.code);
  }
} catch (error) {
  console.error('Erro de requisição:', error);
}
```

### Usar Chatbot IA

```javascript
const response = await fetch('http://localhost:5000/api/chat/message', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Como posso economizar mais dinheiro?'
  })
});

const data = await response.json();
console.log('Resposta da IA:', data.data.response);
console.log('Provedor usado:', data.data.provider);
console.log('Requisições restantes:', data.data.remainingRequests);
```

### Exportação Avançada

```javascript
// Exportar CSV com campos específicos
const csv = await fetch(
  'http://localhost:5000/api/reports/export/csv?' +
  'month=1&year=2024&advanced=true&fields=title,amount,category'
, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Exportar PDF de metas
const pdf = await fetch(
  'http://localhost:5000/api/reports/export/pdf?type=goals'
, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📚 Swagger Interativo

A documentação Swagger está disponível em:

**http://localhost:5000/api-docs**

### Recursos do Swagger
- 📖 Interface interativa para testar endpoints
- 🔄 Exemplos de requisições/respostas
- 🔒 Teste de autenticação
- 📊 Modelos de dados documentados
- 🎨 Interface moderna e responsiva

### Como Usar o Swagger
1. Acesse `http://localhost:5000/api-docs`
2. Clique em "Authorize" e insira seu token JWT
3. Selecione o endpoint que deseja testar
4. Clique em "Try it out"
5. Preencha os parâmetros e clique em "Execute"

---

## 🔄 WebSocket

### Conexão
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Conectado ao WebSocket');
});

socket.on('disconnect', () => {
  console.log('Desconectado do WebSocket');
});
```

### Eventos
- `connect` - Conexão estabelecida
- `disconnect` - Conexão encerrada
- `transaction:created` - Nova transação criada
- `budget:alert` - Alerta de orçamento
- `goal:reached` - Meta alcançada

---

## 📊 Rate Limiting Detalhado

### Limites por Endpoint

| Endpoint | Limite | Período |
|----------|--------|---------|
| `/api/auth/*` | 10/min | IP |
| `/api/transactions` | 100/min | Usuário |
| `/api/chat/*` | 5/min | Usuário |
| `/api/reports/*` | 20/min | Usuário |
| Outros endpoints | 50/min | Usuário |

### Headers de Resposta
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
Retry-After: 60 (quando limitado)
```

---

## 🧪 Testando a API

### com cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Listar transações (substitua <token>)
curl -X GET http://localhost:5000/api/transactions \
  -H "Authorization: Bearer <token>"

# Criar transação
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "uuid",
    "type": "expense",
    "title": "Supermercado",
    "amount": 150.50,
    "transactionDate": "2024-01-15"
  }'
```

### com Insomnia/Postman
1. Importe o Swagger spec em Insomnia
2. Configure as variáveis de ambiente
3. Adicione scripts de autenticação
4. Organize endpoints em collections

---

## 📈 Próximas Versões da API

### Planejado para v2.1
- [ ] GraphQL API (opcional)
- [ ] Webhooks para eventos
- [ ] Batch operations
- [ ] Advanced filtering

### Roadmap
- [ ] API v3.0 (breaking changes)
- [ ] Real-time notifications via WebSocket
- [ ] Advanced analytics endpoints
- [ ] Machine learning predictions

---

<div align="center">

**Documentação mantida atualizada pela equipe FinCash**

[⬆ Voltar à Documentação Principal](../README.md) •
[Swagger UI](http://localhost:5000/api-docs)

</div>