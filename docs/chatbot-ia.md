# Chatbot de Análise Financeira - Documentação

## Visão Geral

O FinCash possui um assistente financeiro inteligente que fornece análises financeiras detalhadas e estruturadas baseadas nos dados do usuário. O sistema utiliza a API do Gemini (Google) para gerar análises personalizadas com limite diário por usuário para controlar custos e garantir qualidade.

## Arquitetura

### Backend (Node.js + Express)

#### Componentes

1. **Modelo Prisma - ChatMessage**
   - Armazena o histórico de conversas
   - Relacionado ao usuário (onDelete: Cascade)
   - Campos: id, userId, role (user/assistant), content, createdAt

2. **Modelo Prisma - RequestLog**
   - Rastreia requisições diárias por usuário e provedor
   - Campos: id, userId, date, count, provider (gemini/ollama)
   - Unique constraint: [userId, date, provider]

3. **Serviço de IA (aiService.js)**
   - `getFinancialContext()`: Busca dados financeiros do usuário (saldo, receitas, despesas, metas, orçamentos, transações)
   - `getProvider()`: Decide qual provedor usar baseado nos limites
   - `generateWithGemini()`: Gera análise extensa usando Gemini (1000-2000 palavras, 10 seções)
   - `generateWithOllama()`: Gera análise usando Ollama (fallback)
   - `checkAndIncrementRequestCount()`: Rastreia uso diário por usuário
   - `getUserLimits()`: Retorna limites atuais do usuário (usado, remaining, canUseGemini)
   - `generateFinancialAdvice()`: Função principal que orquestra tudo

4. **Controller (chatController.js)**
   - `sendMessage()`: Processa mensagem do usuário e retorna análise da IA
   - `getHistory()`: Retorna histórico de conversas do usuário
   - `getLimits()`: Retorna limites atuais do usuário (usado, remaining, total)

5. **Rotas (chatRoutes.js)**
   - `POST /api/chat/message`: Enviar mensagem e receber análise
   - `GET /api/chat/history`: Buscar histórico de conversas
   - `GET /api/chat/limits`: Buscar limites atuais do usuário

### Frontend (React)

#### Componentes

1. **Página Chat.jsx**
   - Interface de análise financeira estruturada com 5 tipos predefinidos
   - Ícones SVG personalizados com tema verde (#10B981) harmonioso
   - Mostra contador de uso (X/2 hoje)
   - Aviso visual quando limite atingido (caixa amarela)
   - Desabilita opções de análise quando limite atingido
   - Botão para exportar análise em arquivo .txt
   - Carrega histórico ao entrar na página
   - Campo de perguntas aparece quando há histórico
   - Formata respostas a partir de ## (remove texto antes)
   - Indicador de "Analisando suas finanças..." durante processamento

2. **Ícones Personalizados**
   - **AnalysisCompleteIcon**: Estrela com checkmarks (análise completa)
   - **SpendingAnalysisIcon**: Gráfico ascendente (gastos)
   - **BudgetIcon**: Carteira com moeda (orçamento)
   - **GoalsIcon**: Alvo concêntrico (metas)
   - **SavingsIcon**: Porquinho com sorriso (economia)
   - **SparklesIcon**: Estrela brilhante (assistente IA)
   - Todos com tema verde emerald (#10B981) e fundo circular com opacidade

3. **Rota**
   - `/chat`: Página dedicada ao assistente
   - Link no menu sidebar como "Assistente IA"

## Funcionamento do Sistema

### Lógica de Limites

```
┌─────────────────────────────────────┐
│  Usuário solicita análise            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Verificar limites do usuário:       │
│  - Usuário: 2/dia                   │
└──────────────┬──────────────────────┘
               │
               ▼
       ┌───────┴───────┐
       │               │
  Usuário < 2       Usuário >= 2
       │               │
       ▼               ▼
   ┌───────┐      ┌───────┐
   │Gemini │      │Bloqueio│
   └───────┘      └───────┘
                       │
                       ▼
              Aviso visual + histórico
```

### Regras

1. **Gemini configurado E usuário < 2**: Usa Gemini e gera análise
2. **Usuário >= 2**: Bloqueia novas análises, mostra aviso, permite visualizar histórico
3. **Ambos falham**: Retorna dica genérica (fallback)

### Limites Diários

- **Gemini por Usuário**: 2 requisições por dia (por usuário)
- **Bloqueio total**: Após 2 análises, usuário não pode fazer mais análises no dia
- **Histórico**: Usuário pode visualizar análises anteriores mesmo após limite
- **Motivo**: Gemini free tier limita requisições, garantindo qualidade e controle de custos

### Contexto Financeiro

O sistema envia para a IA:
- Saldo atual
- Receitas e despesas dos últimos 30 dias
- Metas financeiras ativas
- Orçamentos do mês atual
- Últimas 20 transações
- Histórico recente da conversa (últimas 10 mensagens)

### Estrutura da Resposta do Gemini

O prompt é configurado para gerar respostas extremamente detalhadas (1000-2000 palavras) em 10 seções:

1. 🔍 **RESUMO EXECUTIVO** (100-150 palavras)
2. 📊 **ANÁLISE DE RECEITAS** (150-200 palavras)
3. 💸 **ANÁLISE DE DESPESAS** (200-250 palavras)
4. 🎯 **ORÇAMENTO** (150-200 palavras)
5. 🏆 **METAS FINANCEIRAS** (200-250 palavras)
6. 📈 **DADOS NÚMERICOS ESSENCIAIS** (150-200 palavras)
7. 💡 **15 RECOMENDAÇÕES PRÁTICAS** (5 imediatas, 5 curto prazo, 5 médio prazo)
8. 📅 **PLANO DE AÇÃO DETALHADO** (200-250 palavras)
9. ⚠️ **RISCOS E ALERTAS** (150-200 palavras)
10. 🔮 **PROJEÇÕES E CENÁRIOS** (200-250 palavras)

## Configuração

### Variáveis de Ambiente (.env)

```bash
# Gemini (obrigatório - 2/dia por usuário)
GEMINI_API_KEY=your_gemini_api_key_here

# Ollama (opcional - fallback, não usado atualmente)
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Obter API Key do Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crie um novo projeto ou selecione existente
3. Gere uma API key
4. Adicione ao `.env`

### Instalação do Ollama (Opcional)

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
docker exec fincash_backend npx prisma db push --accept-data-loss
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

### 5. Iniciar Ollama (se usar)

```bash
ollama serve
```

## Uso

### Acessar o Assistente

1. Faça login no FinCash
2. Clique em "Assistente IA" no menu lateral
3. Escolha um tipo de análise (5 opções disponíveis)
4. Aguarde a análise ser gerada (pode levar alguns segundos)
5. Após atingir limite de 2 análises, você só poderá visualizar o histórico

### Tipos de Análise

| Tipo | Descrição |
|------|-----------|
| Análise Completa | Visão geral de todas as finanças |
| Análise de Gastos | Identifica onde está gastando mais |
| Orçamento Mensal | Verifica se está dentro do orçamento |
| Progresso de Metas | Acompanha metas financeiras |
| Dicas de Economia | 5 dicas práticas para economizar |

### Limites e Bloqueio

- **Limite**: 2 análises por dia por usuário
- **Comportamento ao atingir limite**:
  - Aviso visual amarelo aparece
  - Botões de análise ficam desabilitados
  - Campo de perguntas fica desabilitado
  - Histórico continua acessível
  - Mensagem: "Você já fez 2 análises hoje. Você pode visualizar o histórico, mas não poderá fazer novas análises até amanhã."

### Exportar Análise

Após gerar uma análise, clique no botão "Exportar" para baixar o arquivo `.txt` com o conteúdo completo da análise.

### Perguntas de Follow-up

Quando há histórico de conversas:
- Campo de perguntas aparece automaticamente
- Usuário pode fazer perguntas sobre análises anteriores
- Campo fica desabilitado quando limite atingido

## Monitoramento

### Verificar Logs de Requisições por Usuário

```sql
SELECT * FROM request_logs 
WHERE user_id = 'xxx' 
ORDER BY date DESC;
```

### Verificar Histórico de Conversas

```sql
SELECT * FROM chat_messages WHERE user_id = 'xxx' ORDER BY created_at;
```

### Verificar Uso Total por Dia

```sql
SELECT 
  date,
  provider,
  user_id,
  count as total_requests
FROM request_logs 
ORDER BY date DESC;
```

### Verificar Usuários que Atingiram Limite

```sql
SELECT 
  user_id,
  date,
  count
FROM request_logs 
WHERE provider = 'gemini' 
  AND count >= 2
ORDER BY date DESC;
```

## Custos

### Gemini

- **Modelo**: gemini-flash-latest
- **Custo**: Gratuito até certo limite (consulte [preços do Gemini](https://ai.google.dev/pricing))
- **Limite por usuário**: 2 requisições por dia
- **Limite global**: 20 requisições por dia (compartilhado entre todos os usuários)
- **Motivo**: Limite gratuito do Gemini é de 15 requisições por minuto
- **Uso recomendado**: Para primeiras 2 análises do dia (melhor qualidade e detalhamento)

### Ollama

- **Custo**: Gratuito (roda localmente)
- **Requisitos**: Hardware suficiente para rodar o modelo
- **Modelo padrão**: llama3.2
- **Limite**: Ilimitado
- **Uso atual**: Não utilizado (sistema bloqueia após limite do Gemini)

## Troubleshooting

### Gemini não funciona

- Verifique se `GEMINI_API_KEY` está configurada no `.env`
- Verifique se a chave é válida e completa
- Verifique o modelo: deve ser `gemini-flash-latest`
- Verifique o limite diário por usuário (2 requisições por dia)
- Verifique os logs do backend: `docker logs fincash_backend`

### Respostas curtas ou genéricas

- Verifique se o prompt está configurado corretamente (10 seções)
- Verifique se o modelo é `gemini-flash-latest`
- Verifique se há dados financeiros suficientes no contexto
- Respostas devem ter 1000-2000 palavras

### Limite atingido

- Mensagem: "Você atingiu seu limite diário de 2 análises. Tente novamente amanhã."
- Aviso visual amarelo aparece
- Botões ficam desabilitados
- Histórico continua acessível
- Aguarde até o próximo dia para usar novamente

### Formatação da resposta

- Respostas são formatadas a partir de `##`
- Texto antes de `##` é removido automaticamente
- Isso remove o prompt da resposta final

### Docker

- Ollama deve rodar na máquina host, não dentro do container
- Configure `OLLAMA_API_URL` para `http://host.docker.internal:11434` no Docker
- Ou use `http://172.17.0.1:11434` (IP do host na rede Docker)

## Futuras Melhorias

- [ ] Streaming de respostas para melhor UX
- [ ] Cache de respostas comuns
- [ ] Suporte a múltiplos modelos do Gemini
- [ ] Dashboard de estatísticas de uso global
- [ ] Exportação em PDF
- [ ] Configuração de limites por plano de usuário
- [ ] Notificação de limite próximo de ser atingido
- [ ] Rate limiting por usuário para evitar abuso
- [ ] Análises personalizadas por período (semana, mês, ano)
- [ ] Comparação de análises ao longo do tempo



