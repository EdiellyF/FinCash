# 💰 FinCash - Gestão Financeira Pessoal

<div align="center">

![FinCash](https://img.shields.io/badge/FinCash-Financeiro-green?style=for-the-badge)

![Node](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## 📋 Sobre o Projeto

Sistema completo de gestão financeira pessoal full stack desenvolvido para controle de receitas, despesas, metas e orçamentos.

## ✨ Funcionalidades

- 👤 **Autenticação**: Cadastro, login, logout e edição de perfil
- 🔐 **Segurança**: JWT + bcryptjs para criptografia de senhas
- 📊 **Dashboard**: Visão geral com saldo, receitas, despesas e gráficos
- 💳 **Transações**: Gestão completa com filtros avançados
- 🏷️ **Categorias**: Padrão e personalizadas
- 🎯 **Metas**: Acompanhamento de objetivos financeiros
- 📅 **Orçamentos**: Limites mensais por categoria com alertas
- 📈 **Relatórios**: Análises mensais e por categoria
- 📄 **Exportação**: PDF e CSV
- 🌙 **Tema**: Modo escuro
- 📱 **Responsivo**: Funciona em qualquer dispositivo

## 🚀 Como rodar

### 🐳 Opção 1 - Docker Compose (Recomendado)

**Pré-requisitos:**
- ✅ Docker instalado
- ✅ Docker Compose instalado

```bash
docker compose up --build
```

✨ Isso irá:
- Criar e iniciar o banco PostgreSQL (porta 5433)
- Executar migrations e seeds do Prisma
- Iniciar o backend na porta 5000
- Iniciar o frontend na porta 5173

**🌐 Acessar:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

**🛑 Parar containers:**
```bash
docker compose down
```

### 💻 Opção 2 - Manual (Desenvolvimento Local)

**Pré-requisitos:**
- ✅ Node.js 20+
- ✅ PostgreSQL instalado e rodando

#### 1️⃣ Banco de dados
Crie um banco PostgreSQL chamado `fincash`:
```bash
sudo -u postgres psql -c "CREATE DATABASE fincash;"
```

#### 2️⃣ Backend
```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

**🔗 Backend:** http://localhost:5000

#### 3️⃣ Frontend
Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

**🔗 Frontend:** http://localhost:5173

## 📁 Estrutura do Projeto

```
fincash/
├── 📂 backend/           # API Node.js + Express
│   ├── 📂 prisma/        # Schema e migrations
│   ├── 📂 src/           # Código fonte
│   └── 🐳 Dockerfile
├── 📂 frontend/          # React + Vite
│   ├── 📂 src/           # Código fonte
│   └── 🐳 Dockerfile
├── 🐳 docker-compose.yml # Orquestração Docker
└── 📖 README.md
```

## 🛠️ Tecnologias

### Backend
![Node](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.6-0C344B?style=flat-square&logo=prisma&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-9.0.2-000000?style=flat-square&logo=JSON%20web%20tokens&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6.30-CA4245?style=flat-square&logo=react-router&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2.15-00C853?style=flat-square&logo=recharts&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.8-5A29E4?style=flat-square&logo=axios&logoColor=white)

## 📝 Observações

- Por padrão, o Docker Compose usa a porta 5433 para PostgreSQL para evitar conflitos com instalações locais.
- O projeto foi estruturado para evolução fácil com testes, Docker, refresh token e deploy.

---

<div align="center">

**Desenvolvido com 💚 para gestão financeira eficiente**

</div>
