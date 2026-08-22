<div align="center">

# 🚀 FinCash - Gestão Financeira Pessoal com Inteligência Artificial

**Sistema completo de gestão financeira pessoal com IA integrada**

[![Version](https://img.shields.io/badge/versão-2.0.0-blue)](https://github.com/EdiellyF/FinCash)
[![License](https://img.shields.io/badge/licença-MIT-green)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-20+-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18+-blue)](https://reactjs.org/)

**Trabalho de Extensão Universitária - IFTO**

Desenvolvido por estudantes para estudantes, aplicando conceitos modernos de desenvolvimento web, inteligência artificial e engenharia de software.

[📖 Documentação](docs/README.md) •
[🔌 API Swagger](http://localhost:5000/api-docs) •
[🚀 Como Começar](#-como-começar) •
[🤝 Contribuir](#-contribuir)

</div>

---

## 📋 Sobre o Projeto

O **FinCash** é um sistema completo de gestão financeira pessoal full stack desenvolvido como projeto de extensão universitária. Este projeto foi concebido para aplicar na prática os conceitos aprendidos em sala de aula, incluindo desenvolvimento web moderno, integração com APIs de inteligência artificial, arquitetura de software e boas práticas de desenvolvimento.

### 🎯 Objetivos Educacionais

- **Aplicação prática de conceitos acadêmicos**: Transformar teoria em prática através de um projeto real
- **Integração de múltiplas tecnologias**: Demonstração de competência em diferentes stacks tecnológicas
- **Inteligência Artificial no contexto financeiro**: Exploração de IA para análise de dados pessoais
- **Desenvolvimento full stack**: Experiência completa de frontend a backend
- **Colaboração e versionamento**: Uso de Git e workflows profissionais
- **Qualidade de software**: Testing, logging, error handling e documentação

### 🎓 Contexto Acadêmico

Este projeto integra diversas disciplinas e conceitos:
- **Desenvolvimento Web**: React 18, Vite, Tailwind CSS
- **Backend e APIs**: Node.js 20+, Express, REST APIs
- **Banco de Dados**: PostgreSQL 16+, Prisma ORM
- **Inteligência Artificial**: GROQ, Gemini, Ollama com priorização inteligente
- **Segurança**: JWT, bcrypt, validação Zod
- **DevOps**: Docker, Docker Compose
- **Engenharia de Software**: MVC, padrões de projeto, arquitetura limpa
- **Qualidade**: Winston logging, error handling estruturado, Swagger documentation

---

## ✨ Funcionalidades

### 💰 Gestão Financeira Completa
- 👤 **Sistema de Autenticação**: Cadastro com OTP, login, logout e edição de perfil
- 🔐 **Segurança Avançada**: JWT authentication, bcrypt password hashing, proteção de rotas
- 📊 **Dashboard Interativo**: Visão geral com saldo, receitas, despesas e gráficos dinâmicos
- 💳 **Gestão de Transações**: CRUD completo com filtros e paginação
- 🏷️ **Categorias Personalizáveis**: Sistema de categorias padrão e customizadas
- 🎯 **Metas Financeiras**: Definição e monitoramento com progress bars
- 📅 **Orçamentos Mensais**: Limites por categoria com alertas inteligentes
- 📈 **Relatórios Detalhados**: Análises mensais e por categoria
- 📄 **Exportação Avançada**: CSV customizável e PDF profissional
- 🌙 **Interface Moderna**: Design responsivo com Tailwind CSS

### 🤖 Inteligência Artificial Avançada
- 🧠 **Assistente Financeiro**: Análises personalizadas com múltiplos provedores
- 🔄 **Priorização Inteligente**: GROQ > Gemini > Ollama (otimizado para custo/qualidade)
- 📊 **Contexto Dinâmico**: IA utiliza dados reais para insights relevantes
- 🎯 **Limites Otimizados**: Sistema de limites para estudantes (2-5/dia por usuário)
- 💡 **Respostas Estruturadas**: Análises em seções detalhadas e acionáveis
- 🏷️ **Categorização Automática**: Sugestões de categorias com confidence scores
- 🔄 **Batch Processing**: Categorização em lote de transações existentes
- 💬 **Conversação Contextual**: Histórico de interações e follow-up
- 📊 **Comparativos**: Análise de evolução entre períodos diferentes

### 🔧 Qualidade e Performance (v2.0)
- 📝 **API Documentation**: Swagger UI interativo com OpenAPI 3.0
- 🛡️ **Error Handling Avançado**: Classes customizadas com respostas estruturadas
- 📊 **Structured Logging**: Winston com múltiplos transports e contexto
- ⚡ **Performance**: Indexes otimizados e paginação implementada
- 🔒 **Security Enhanced**: Validação Zod e proteções contra ataques comuns
- 🧪 **Testing Ready**: Estrutura preparada para testes automatizados
- 📈 **Monitoring**: Logs estruturados e health checks

### 🚀 Novidades da Versão 2.0

#### 📝 API Documentation (Swagger)
- Documentação completa da API com OpenAPI 3.0 specification
- Swagger UI interativo em `/api-docs`
- JSDoc comments em todos os endpoints
- Definição de schemas reutilizáveis (User, Transaction, Category, etc.)
- Security scheme para JWT Bearer authentication
- Exemplos de requisições/respostas

#### 🛡️ Error Handling Estruturado
- Sistema de classes de erro customizadas (ValidationError, AuthenticationError, etc.)
- Middleware centralizado de tratamento de erros
- Tratamento específico para erros Prisma, JWT, Zod
- Respostas de erro com códigos e detalhes apropriados
- Stack traces em ambiente de desenvolvimento

#### 📊 Logging Avançado
- Configuração Winston com múltiplos transports
- Console transport com colors e formatação
- File transports (all.log, error.log)
- Logging estruturado com contexto (userId, path, action)
- Logging em controllers, services e middlewares

#### 🤖 AI Categorization
- Serviço de categorização automática de transações
- Múltiplos métodos: keyword matching, frequency analysis, defaults
- Confidence scores para sugestões
- Batch categorization para transações existentes
- Auto-categorização de transações individuais

#### 📤 Advanced Export
- Exportador CSV avançado customizável (campos, separadores, formatação)
- Exportador PDF profissional com gráficos e sínteses
- Múltiplos tipos de exportação (transactions, goals, budgets)
- Novos endpoints para exportação especializada

#### ⚡ Performance
- Índices de banco de dados otimizados
- Paginação em listagens com metadata
- Connection pooling no Prisma
- Otimizações de query com proper includes

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)                │
│              localhost:5173  •  Tailwind CSS           │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API + WebSocket
┌────────────────────┴────────────────────────────────────┐
│              Backend (Node.js + Express)                 │
│              localhost:5000  •  Prisma ORM               │
│  • Controllers  • Services  • Middlewares  • Routes     │
│  • Swagger UI  • Winston  • AI Integration              │
└────────────────────┬────────────────────────────────────┘
                     │ PostgreSQL
┌────────────────────┴────────────────────────────────────┐
│            Database (PostgreSQL + Prisma)                │
│  • Users  • Transactions  • Goals  • Budgets           │
│  • Categories  • ChatMessages  • RequestLogs           │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express 4.21+
- **ORM**: Prisma 6.6+
- **Banco**: PostgreSQL 16+
- **Autenticação**: JWT 9.0+ + bcrypt 6.0+
- **Validação**: Zod 3.24+
- **IA**: GROQ SDK 0.5.0, Google Generative AI 0.21.0, Ollama
- **Logging**: Winston 3.19+
- **API Docs**: Swagger-jsdoc 6.2+, swagger-ui-express 5.0+
- **WebSocket**: Socket.io 4.8+
- **Email**: Nodemailer 8.0+
- **Cache**: ioredis 5.4+ (Redis)
- **PDF**: PDFKit 0.16+
- **CSV**: csv-stringify 6.5+

### Frontend
- **Framework**: React 18.3+
- **Build**: Vite 6.2+
- **Estilos**: Tailwind CSS 3.4+
- **Gráficos**: Recharts 2.15+
- **HTTP**: Axios 1.8+
- **Forms**: React Hook Form 7.54+
- **Validation**: Zod 3.24+
- **Icons**: Lucide React 0.503+
- **Notifications**: Sonner 2.0+
- **Routing**: React Router DOM 6.30+
- **WebSocket**: Socket.io Client 4.8+

### DevOps
- **Container**: Docker
- **Compose**: Docker Compose
- **Version Control**: Git

---

## 🚀 Como Começar

### 🐳 Opção 1: Docker Compose (Recomendado)

**Pré-requisitos:**
- ✅ Docker instalado
- ✅ Docker Compose instalado

```bash
# Clone o repositório
git clone https://github.com/EdiellyF/FinCash.git
cd FinCash

# Inicie tudo com um comando
docker compose up --build
```

**Acesse:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Swagger UI: http://localhost:5000/api-docs

**Parar containers:**
```bash
docker compose down
```

---

### 💻 Opção 2: Desenvolvimento Local

**Pré-requisitos:**
- ✅ Node.js 20+
- ✅ PostgreSQL 16+
- ✅ npm

#### 1️⃣ Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Edite .env com suas configurações

# ATENÇÃO: JWT_SECRET em produção
# - O aplicativo exige que JWT_SECRET esteja definida quando NODE_ENV=production.
# - Em produção, NÃO armazene segredos em arquivos .env; use um gerenciador de segredos (Vault, AWS Secrets Manager, Kubernetes Secrets, etc.) ou variáveis de ambiente da sua plataforma.
# - Para gerar um segredo forte localmente, por exemplo:
#    openssl rand -hex 32
#    ou: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# - Exporte a variável no ambiente de produção (exemplo em Linux):
#    export JWT_SECRET="$(openssl rand -hex 32)"
# - Não copie o valor de desenvolvimento do .env.example para produção.

# Gerar cliente Prisma
npx prisma generate

# Executar migrations
npx prisma migrate deploy

# Popular banco com dados
node prisma/seed.js

# Iniciar servidor
npm run dev
```

**Backend estará em:** http://localhost:5000

#### 2️⃣ Configurar Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

**Frontend estará em:** http://localhost:5173

---

## 📚 Documentação

Documentação completa disponível em [docs/](docs/)

### 📖 Documentação Principal
- [Documentação Oficial](docs/README.md) - Índice completo
- [CHANGELOG](CHANGELOG.md) - Histórico de alterações

### 🏗️ Arquitetura
- [Arquitetura do Sistema](docs/01-arquitetura/README.md)
- [Documentação da API](docs/02-api/README.md)
- [Banco de Dados](docs/05-banco-de-dados/README.md)

### 🤖 Inteligência Artificial
- [Sistema de IA](docs/03-inteligencia-artificial/README.md)
- [Arquitetura do Chatbot](docs/03-inteligencia-artificial/chatbot-ia.md)
- [Categorização Automática](docs/03-inteligencia-artificial/categorizacao.md)

### 🎓 Acadêmico
- [Guia Acadêmico](docs/09-academico/README.md)
- [Trilhas de Aprendizado](docs/09-academico/trilhas.md)
- [Laboratórios Práticos](docs/09-academico/laboratorios.md)

### 🔧 Desenvolvimento
- [Setup e Configuração](docs/04-desenvolvimento/README.md)
- [Guia de Contribuição](docs/04-desenvolvimento/contribuicao.md)
- [Padrões de Código](docs/04-desenvolvimento/padroes.md)

---

## 🌐 API Endpoints

### Autenticação
- `POST /api/auth/register` - Cadastro com OTP
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify-register` - Verificar email

### Transações
- `GET /api/transactions` - Listar com paginação
- `POST /api/transactions` - Criar transação
- `PUT /api/transactions/:id` - Atualizar
- `DELETE /api/transactions/:id` - Remover

### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria
- `PUT /api/categories/:id` - Atualizar
- `DELETE /api/categories/:id` - Remover

### IA e Chatbot
- `POST /api/chat/message` - Enviar mensagem
- `GET /api/chat/history` - Histórico
- `GET /api/chat/limits` - Limites de uso

### Categorização IA
- `POST /api/categorization/suggest` - Sugestão de categoria
- `GET /api/categorization/batch` - Sugestões em lote
- `POST /api/categorization/auto/:id` - Auto-categorizar

### Relatórios
- `GET /api/reports/monthly` - Relatório mensal
- `GET /api/reports/export/csv` - Exportar CSV
- `GET /api/reports/export/pdf` - Exportar PDF

**Documentação completa da API disponível em:**
**http://localhost:5000/api-docs**

---

## 🔐 Configuração

### Variáveis de Ambiente (Backend)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fincash

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# AI Services
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 📊 Modelo de Dados

### Principais Entidades

#### User
- `id`, `name`, `email`, `passwordHash`, `avatarUrl`
- Relacionamentos: categories, transactions, goals, budgets

#### Transaction
- `id`, `userId`, `categoryId`, `type`, `title`, `description`, `amount`, `transactionDate`
- Relacionamentos: user, category

#### Category
- `id`, `userId`, `name`, `type`, `color`, `icon`, `isDefault`
- Relacionamentos: user, transactions, budgets

#### Goal
- `id`, `userId`, `title`, `targetAmount`, `currentAmount`, `deadline`
- Relacionamentos: user

#### Budget
- `id`, `userId`, `categoryId`, `month`, `year`, `limitAmount`
- Relacionamentos: user, category

#### ChatMessage
- `id`, `userId`, `role`, `content`, `createdAt`
- Relacionamentos: user

---

## 🧪 Testando

### Testar API Manualmente

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Testar com Swagger UI

Acesse **http://localhost:5000/api-docs** para:
- Interface interativa da API
- Testar endpoints com cliques
- Verificar schemas e exemplos
- Testar autenticação

---

## 🤝 Contribuir

Contribuições são bem-vindas! Por favor:

1. Leia o [Guia de Contribuição](docs/04-desenvolvimento/contribuicao.md)
2. Consulte os [Padrões de Código](docs/04-desenvolvimento/padroes.md)
3. Siga as [Convenções do Projeto](docs/04-desenvolvimento/convencoes.md)
4. Faça fork do projeto
5. Crie branch para sua feature (`git checkout -b feature/MinhaFeature`)
6. Commit suas mudanças (`git commit -m 'Add: Minha feature'`)
7. Push para o branch (`git push origin feature/MinhaFeature`)
8. Abra um Pull Request

### 🎯 Áreas para Contribuir

- 🐛 Bug fixes
- ✨ Novas funcionalidades
- 📝 Documentação
- 🧪 Testes
- 🎨 UI/UX improvements
- 🌐 Traduções
- ⚡ Performance optimizations

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🙏 Agradecimentos

- **IFTO** - Instituto Federal do Tocantins
- **Professores e orientadores** - Pelo apoio e orientação
- **Comunidade open source** - Pelas ferramentas e bibliotecas incríveis
- **GROQ, Google, Ollama** - Pelas APIs de inteligência artificial

---

## 📞 Suporte

- 📧 Email: support@fincash.com
- 🐛 Issues: [GitHub Issues](https://github.com/EdiellyF/FinCash/issues)
- 📖 Documentação: [docs/](docs/)
- 💬 Discord: [Comunidade FinCash](https://discord.gg/fincash)

---

<div align="center">

**Desenvolvido com ❤️ por estudantes do IFTO**

[⬆ Voltar ao topo](#-fincash---gestão-financeira-pessoal-com-inteligência-artificial)

**⭐ Se este projeto foi útil para você, considere dar uma estrela!**

</div>