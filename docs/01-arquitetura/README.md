# 🏗️ Arquitetura do Sistema FinCash

<div align="center">

![Arquitetura](https://img.shields.io/badge/arquitetura-three--tier-blue)
![Backend](https://img.shields.io/badge/backend-node.js-green)
![Frontend](https://img.shields.io/badge/frontend-react-blue)
![Database](https://img.shields.io/badge/database-postgresql-blue)

</div>

---

## 📐 Visão Geral da Arquitetura

O FinCash segue uma arquitetura **three-tier** clássica, separando claramente a apresentação, lógica de negócios e persistência de dados.

```
┌─────────────────────────────────────────────────────────┐
│                  Camada de Apresentação                  │
│                 (Frontend - React + Vite)                │
│                  localhost:5173                          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API + WebSocket
┌────────────────────┴────────────────────────────────────┐
│                 Camada de Aplicação                     │
│              (Backend - Node.js + Express)               │
│                  localhost:5000                          │
│  • Controllers  • Services  • Middlewares  • Routes     │
│  • Swagger UI  • Winston  • AI Integration              │
└────────────────────┬────────────────────────────────────┘
                     │ PostgreSQL + Prisma ORM
┌────────────────────┴────────────────────────────────────┐
│                 Camada de Dados                          │
│            (PostgreSQL + Prisma ORM)                     │
│  • Users  • Transactions  • Goals  • Budgets            │
│  • Categories  • ChatMessages  • RequestLogs            │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Camadas da Arquitetura

### 1. Camada de Apresentação (Frontend)

**Responsabilidade**: Interface do usuário e interação

**Tecnologias**:
- React 18.3+ (UI Framework)
- Vite 6.2+ (Build Tool)
- Tailwind CSS 3.4+ (Estilização)
- Recharts 2.15+ (Gráficos)
- React Router DOM 6.30+ (Navegação)
- Axios 1.8+ (Client HTTP)
- Socket.io Client 4.8+ (WebSocket)
- React Hook Form 7.54+ (Formulários)
- Zod 3.24+ (Validação)
- Sonner 2.0+ (Notificações)
- Lucide React 0.503+ (Ícones)

**Padrões**:
- Component-based architecture
- Custom Hooks (useState, useEffect, useContext)
- Context API para estado global
- React Router para navegação
- Responsive Design

**Estrutura**:
```
frontend/src/
├── components/        # Componentes reutilizáveis
├── pages/           # Páginas principais
├── services/        # Client API
├── hooks/           # Custom hooks
├── contexts/        # Context providers
├── utils/           # Utilitários
└── styles/          # Estilos globais
```

---

### 2. Camada de Aplicação (Backend)

**Responsabilidade**: Lógica de negócio, orquestração e APIs

**Tecnologias**:
- Node.js 20+ (Runtime)
- Express 4.21+ (Web Framework)
- Prisma 6.6+ (ORM)
- PostgreSQL (Banco de Dados)
- JWT 9.0+ (Autenticação)
- bcrypt 6.0+ (Criptografia)
- Winston 3.19+ (Logging)
- Swagger-jsdoc 6.2+ (API Documentation)
- Socket.io 4.8+ (WebSocket)

**Integrações de IA**:
- GROQ SDK 0.5.0 (IA Principal)
- Google Generative AI 0.21.0 (IA Secundária)
- Ollama (IA Local/Backup)
- Redis 5.4+ (Cache e Rate Limiting)

**Padrões**:
- MVC (Model-View-Controller)
- Middleware Pattern
- Service Layer Pattern
- Repository Pattern (via Prisma)
- Dependency Injection

**Estrutura**:
```
backend/src/
├── config/           # Configurações (env, logger, swagger)
├── controllers/      # Controladores de requisições
├── services/         # Lógica de negócio
├── middlewares/      # Middlewares (auth, errors, logging)
├── routes/           # Rotas da API
├── utils/            # Utilitários (export, errors, response)
├── validations/      # Validações (Zod schemas)
└── server.js         # Entry point do servidor
```

---

### 3. Camada de Dados (Banco de Dados)

**Responsabilidade**: Persistência e consulta de dados

**Tecnologias**:
- PostgreSQL 16+ (SGBD)
- Prisma ORM 6.6+ (Mapeamento Objeto-Relacional)

**Modelos de Dados**:
- **User**: Usuários do sistema
- **Category**: Categorias de transações
- **Transaction**: Transações financeiras
- **Goal**: Metas financeiras
- **Budget**: Orçamentos mensais
- **ChatMessage**: Mensagens do chatbot
- **RequestLog**: Logs de requisições à IA

**Índices e Otimizações**:
- Índices compostos para queries frequentes
- Foreign keys com cascade delete
- Unique constraints para integridade

---

## 🔌 Comunicação Entre Camadas

### Frontend ↔ Backend
- **Protocolo**: HTTP/REST API
- **Formato**: JSON
- **Autenticação**: JWT Bearer Token
- **WebSocket**: Socket.io (tempo real)

### Backend ↔ Database
- **ORM**: Prisma
- **Connection Pooling**: Configurado
- **Migrations**: Prisma Migrate
- **Seeding**: Prisma Seed

### Backend ↔ IA Services
- **APIs REST**: GROQ, Gemini
- **Local API**: Ollama
- **Priorização**: GROQ > Gemini > Ollama
- **Fallback**: Sistema inteligente de fallback

---

## 🔄 Fluxo de Dados

### 1. Fluxo de Autenticação
```
Frontend → POST /api/auth/login
         ↓
Backend: authController → authService
         ↓
Banco: User.findUnique()
         ↓
JWT Token Generation
         ↓
Frontend: Armazena token
         ↓
Requisições subsequentes com Authorization: Bearer <token>
```

### 2. Fluxo de Transação
```
Frontend → POST /api/transactions
         ↓
Backend: authMiddleware → validateMiddleware
         ↓
transactionController → transactionService
         ↓
Banco: Transaction.create() + Budget check
         ↓
Frontend: Recebe confirmação + alertas de orçamento
```

### 3. Fluxo de Chatbot IA
```
Frontend → POST /api/chat/message
         ↓
Backend: authMiddleware → rateLimiter
         ↓
chatController → aiService
         ↓
Contexto Financeiro (transactions, goals, budgets)
         ↓
IA Provider (GROQ/Gemini/Ollama)
         ↓
Response + Rate Limit Check
         ↓
Frontend: Exibe resposta formatada
```

---

## 🧠 Componentes Chave

### Sistema de Autenticação
- JWT tokens com expiração
- Bcrypt para hash de senhas
- Middleware de autenticação global
- OTP para validação de email

### Sistema de IA
- Múltiplos provedores com priorização
- Sistema de limites (global + por usuário)
- Contexto financeiro dinâmico
- Cache Redis para performance
- Fallback inteligente

### Sistema de Logging
- Winston com múltiplos transports
- Console com cores
- Arquivos (all.log, error.log)
- Contexto (userId, path, action)
- Níveis (error, warn, info, debug)

### Error Handling
- Classes customizadas de erro
- Middleware centralizado
- Tratamento específico (Prisma, JWT, Zod)
- Respostas estruturadas com códigos
- Stack traces em desenvolvimento

### Exportação de Dados
- CSV avançado customizável
- PDF profissional com gráficos
- Múltiplos formatos (transactions, goals, budgets)
- Paginação para grandes datasets
- Performance com streaming

---

## 🚀 Performance e Escalabilidade

### Otimizações Implementadas
- ✅ Índices de banco de dados
- ✅ Paginação em listagens
- ✅ Cache Redis (configurado)
- ✅ Connection pooling
- ✅ Lazy loading de relações
- ✅ Compressão de respostas

### Escalabilidade
- Stateless API (pronta para horizontal scaling)
- Separação clara de responsabilidades
- Cache para operações frequentes
- Rate limiting para proteção
- Load balancing pronto (via Docker/K8s)

---

## 🔒 Segurança na Arquitetura

### Camada de Rede
- CORS configurado
- HTTPS recomendado
- Rate limiting por usuário
- Proteção contra ataques comuns

### Camada de Aplicação
- JWT authentication
- Input validation (Zod)
- SQL injection prevention (Prisma)
- XSS protection
- Error sem泄露 de informações sensíveis

### Camada de Dados
- Senhas com bcrypt
- Environment variables
- Princípio do menor privilégio
- Backup automático recomendado

---

## 📊 Monitoramento e Debugging

### Logging Estruturado
- Níveis de log apropriados
- Contexto em cada log
- Arquivos separados por tipo
- Facilita debugging e análise

### API Documentation
- Swagger UI interativo
- OpenAPI 3.0 specification
- Exemplos de requisições/respostas
- Atualizado automaticamente

### Health Checks
- Endpoint `/api/health`
- Monitoramento de status
- Verificação de dependências

---

## 🎨 Diagramas de Sequência

### Autenticação
```
User → Frontend → Backend → Database
     ↑           ↓           ↓           ↓
     └───────────┴───────────┴───────────┘
Token Validation → User Data → JWT Generation
```

### Chatbot IA
```
User → Frontend → Backend → AI Service → External AI
     ↑           ↓           ↓            ↓           ↓
     └───────────┴───────────┴────────────┴───────────┘
Financial Context → Provider Selection → Analysis → Response
```

---

## 🔧 Configuração e Setup

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fincash

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI Services
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
OLLAMA_API_URL=http://localhost:11434

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

---

## 📈 Próximas Melhorias Planejadas

### Arquitetura
- [ ] GraphQL API (opcional)
- [ ] Event-driven architecture
- [ ] Microservices (se necessário)
- [ ] Message queue (RabbitMQ/Kafka)

### Performance
- [ ] Redis caching completo
- [ ] CDN para assets
- [ ] Database read replicas
- [ ] Advanced caching strategies

### Observabilidade
- [ ] APM (Application Performance Monitoring)
- [ ] Distributed tracing
- [ ] Metrics collection (Prometheus)
- [ ] Alerting system

---

<div align="center">

**Documentação mantida pela equipe FinCash**

[⬆ Voltar à Documentação Principal](../README.md)

</div>