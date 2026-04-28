# Chatbot de Dicas Financeiras - Documentação

## Visão Geral

O FinCash possui um assistente financeiro inteligente que fornece dicas personalizadas baseadas nos dados financeiros do usuário. O sistema utiliza Ollama (IA local) para gerar respostas, sem custos de API externa.

## Arquitetura

### Backend (Node.js + Express)

#### Componentes

1. **Modelo Prisma - ChatMessage**
   - Armazena o histórico de conversas
   - Relacionado ao usuário (onDelete: Cascade)
   - Campos: id, userId, role (user/assistant), content, createdAt

2. **Modelo Prisma - RequestLog**
   - Rastreia requisições diárias por provedor
   - Campos: id, date, count, provider (ollama)

3. **Serviço de IA (aiService.js)**
   - `getFinancialContext()`: Busca dados financeiros do usuário
   - `generateFinancialAdvice()`: Gera resposta usando Ollama
   - `checkAndIncrementRequestCount()`: Rastreia uso diário

4. **Controller (chatController.js)**
   - `sendMessage()`: Processa mensagem do usuário
   - `getHistory()`: Retorna histórico de conversas

5. **Rotas (chatRoutes.js)**
   - `POST /api/chat/message`: Enviar mensagem
   - `GET /api/chat/history`: Buscar histórico

### Frontend (React)

#### Componentes

1. **Página Chat.jsx**
   - Interface de chat similar a WhatsApp/ChatGPT
   - Carrega histórico ao entrar
   - Sugestões de perguntas iniciais
   - Indicador de "digitando..." durante processamento

2. **Rota**
   - `/chat`: Página dedicada ao assistente
   - Link no menu sidebar como "Assistente IA"

## Funcionamento

### Contexto Financeiro

O sistema envia para a IA:
- Saldo atual
- Receitas e despesas dos últimos 30 dias
- Metas financeiras ativas
- Orçamentos do mês atual
- Últimas 20 transações
- Histórico recente da conversa (últimas 10 mensagens)

## Configuração

### Variáveis de Ambiente (.env)

```bash
# Ollama (obrigatório)
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Instalação do Ollama

```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Baixar modelo
ollama pull llama3.2

# Iniciar servidor (já inicia automaticamente)
ollama serve
```

## Setup do Projeto

### 1. Rodar Migrations do Prisma

```bash
cd backend
node node_modules/prisma/build/index.js migrate dev --name add_chat_messages
node node_modules/prisma/build/index.js migrate dev --name add_request_logs
```

### 2. Instalar Dependências

```bash
cd backend
npm install
```

### 3. Configurar .env

Copie `.env.example` para `.env` e configure as variáveis.

### 4. Iniciar Backend

```bash
npm start
```

### 5. Iniciar Ollama

```bash
ollama serve
```

## Uso

### Acessar o Chatbot

1. Faça login no FinCash
2. Clique em "Assistente IA" no menu lateral
3. Digite sua pergunta ou clique em uma sugestão

### Exemplos de Perguntas

- "Como economizar mais?"
- "Dicas para reduzir gastos"
- "Análise do meu orçamento"
- "Planejamento de metas"

## Monitoramento

### Verificar Logs de Requisições

```sql
SELECT * FROM request_logs ORDER BY date DESC;
```

### Verificar Histórico de Conversas

```sql
SELECT * FROM chat_messages WHERE user_id = 'xxx' ORDER BY created_at;
```

## Custos

### Ollama

- **Custo**: Gratuito (roda localmente)
- **Requisitos**: Hardware suficiente para rodar o modelo
- **Modelo padrão**: llama3.2

## Troubleshooting

### Ollama não funciona

- Verifique se Ollama está rodando: `ollama list`
- Verifique se o modelo foi baixado: `ollama pull llama3.2`
- Verifique a URL: `http://localhost:11434`
- No Docker, Ollama deve rodar no host, não no container

### Respostas genéricas

- Se Ollama falhar, o sistema retorna dicas genéricas
- Verifique os logs do backend para identificar o erro

### Docker

- Ollama deve rodar na máquina host, não dentro do container
- Configure `OLLAMA_API_URL` para `http://host.docker.internal:11434` no Docker
- Ou use `http://172.17.0.1:11434` (IP do host na rede Docker)

## Futuras Melhorias

- [ ] Streaming de respostas para melhor UX
- [ ] Rate limiting por usuário
- [ ] Cache de respostas comuns
- [ ] Suporte a múltiplos modelos do Ollama
- [ ] Dashboard de estatísticas de uso
- [ ] Exportação de conversas
- [ ] Integração opcional com OpenAI (limite diário)

