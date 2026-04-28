# FinCash - Gestão Financeira Pessoal

**Trabalho de Extensão 1 - IFTO**

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
- Criar e iniciar o banco PostgreSQL
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
node node_modules/prisma/build/index.js generate
node node_modules/prisma/build/index.js migrate deploy
node prisma/seed.js
npm start
```

**🔗 Backend:** http://localhost:5000

#### 3️⃣ Frontend
Em outro terminal:

```bash
cd frontend
npm install
node node_modules/vite/bin/vite.js
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
├── 📖 README.md
└── 🚫 .gitignore
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

- O fluxo de recuperação de senha está funcional em nível local, porém simplificado. Para produção, o ideal é adicionar envio de e-mail com token temporário.
- O projeto foi estruturado para evolução fácil com testes, Docker, refresh token e deploy.

---

<div align="center">

**Desenvolvido com 💚 para gestão financeira eficiente**

</div>
