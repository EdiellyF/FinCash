# 🤖 Sistema de Inteligência Artificial FinCash

<div align="center">

![AI](https://img.shields.io/badge/IA-múltiplos%20provedores-brightgreen)
![GROQ](https://img.shields.io/badge/GROQ-principal-blue)
![Gemini](https://img.shields.io/badge/Gemini-secundário-green)
![Ollama](https://img.shields.io/badge/Ollama-backup-orange)

**Sistema de IA dual com priorização inteligente e fallback**

</div>

---

## 🎯 Visão Geral

O sistema de IA do FinCash utiliza múltiplos provedores de inteligência artificial para fornecer insights financeiros personalizados, com um sistema inteligente de priorização e fallback para garantir disponibilidade e otimizar custos.

### 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                  Camada de Aplicação                     │
│              (Controllers e Services)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ Seleção Inteligente
┌────────────────────┴────────────────────────────────────┐
│              Sistema de Priorização de IA                  │
│  Prioridade: GROQ > Gemini > Ollama                   │
│  Cache: Redis para contextos frequentes                │
│  Limites: Global + por usuário                         │
└────────────────────┬────────────────────────────────────┘
                     ↓
        ┌────────────┼────────────┐
        ↓            ↓            ↓
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │  GROQ   │  │ GEMINI  │  │ OLLAMA  │
   │ (Main)   │  │ (Backup) │  │ (Local) │
   └─────────┘  └─────────┘  └─────────┘
        │            │            │
        └────────────┴────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Contexto Financeiro Dinâmico               │
│  • Transações recentes (últimos 30 dias)               │
│  • Metas financeiras ativas                            │
│  • Orçamentos mensais                                  │
│  • Histórico de categorias                             │
│  • Comparativos de períodos                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🧠 Componentes do Sistema de IA

### 1. Chatbot Financeiro Inteligente

#### Funcionalidades
- 📊 **Análises Financeiras Detalhadas**: Relatórios estruturados em múltiplas seções
- 🎯 **Contexto Personalizado**: Utiliza dados reais do usuário
- 💡 **Recomendações Práticas**: Dicas específicas para estudantes de Palmas/TO
- 📈 **Comparativos de Períodos**: Análise de evolução financeira
- 🔄 **Conversação Contextual**: Mantém histórico de interações

#### Estrutura da Resposta
```
1. 🔍 RESUMO EXECUTIVO
   - Situação financeira atual
   - Principais problemas e oportunidades

2. 📊 ANÁLISE DE RECEITAS
   - Total e comparação com média
   - Fontes de renda e tendências
   - Recomendações de aumento

3. 💸 ANÁLISE DE DESPESAS
   - Despesas por categoria
   - Identificação de gastos excessivos
   - Oportunidades de economia

4. 🎯 ANÁLISE DE METAS
   - Progresso de cada meta
   - Estratégias para atingir objetivos
   - Ajustes recomendados

5. 📊 ANÁLISE DE ORÇAMENTOS
   - Status de cada orçamento
   - Alertas de ultrapassagem
   - Recomendações de ajuste

6. 💡 RECOMENDAÇÕES PRÁTICAS
   - Ações imediatas (hoje/esta semana)
   - Ações de curto prazo (este mês)
   - Ações de médio prazo (próximos 3 meses)
   - Hábitos financeiros saudáveis

7. 📚 RECURSOS ADICIONAIS
   - Ferramentas e apps úteis
   - Conteúdos educacionais
   - Comunidades e grupos
```

---

### 2. Categorização Automática de Transações

#### Funcionalidades
- 🏷️ **Sugestão de Categorias**: Analisa título e descrição
- 🔍 **Múltiplos Métodos**:
  - Matching de palavras-chave
  - Análise de frequência
  - Fallback inteligente
- 📊 **Confidence Scores**: Indica quão confiável é a sugestão
- 🔄 **Batch Processing**: Categorização em lote de transações
- ⚡ **Auto-Categorização**: Aplicação automática de sugestões

#### Métodos de Categorização

**1. Keyword Matching (Método Principal)**
```javascript
// Mapeamento de palavras-chave por categoria
const keywords = {
  expense: {
    'Alimentação': ['mercado', 'supermercado', 'restaurante', 'lanche'],
    'Transporte': ['uber', 'taxi', 'combustível', 'ônibus'],
    'Moradia': ['aluguel', 'luz', 'água', 'internet'],
    // ...
  },
  income: {
    'Salário': ['salário', 'pagamento', 'holerite'],
    'Freelance': ['freelance', 'projeto', 'consultoria'],
    // ...
  }
};
```

**2. Frequency Analysis (Fallback)**
```javascript
// Analisa categorias mais usadas pelo usuário
const mostUsedCategory = await getMostUsedCategory(userId, type);
// Usa como sugestão se keyword matching falhar
```

**3. Default Fallback**
```javascript
// Último recurso: categoria padrão do tipo
const defaultCategory = categories.find(cat => cat.isDefault);
```

#### API de Categorização

**Sugerir Categoria**
```http
POST /api/categorization/suggest
Content-Type: application/json

{
  "title": "Supermercado Extra",
  "description": "Compras semanais do mês",
  "type": "expense"
}
```

**Response**
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

**Batch Categorization**
```http
GET /api/categorization/batch?limit=50&type=expense
```

**Auto-Categorizar Transação**
```http
POST /api/categorization/auto/:transactionId
```

---

### 3. Sistema de Limites e Gestão de Recursos

#### Estrutura de Limites (atual)

```javascript
// Limite Total por Usuário (somando TODOS os provedores)
const TOTAL_DAILY_LIMIT_PER_USER = 2; // 2 requisições totais por dia para estudantes
```

Observação importante: o FinCash registra o uso global por provedor (RequestLog) para observabilidade e auditoria, mas não aplica mais um bloqueio automático baseado em contadores globais (por exemplo, um contador "global" para Gemini ou Groq). A aplicação continua a:
- Enforcear o limite TOTAL por usuário (TOTAL_DAILY_LIMIT_PER_USER)
- Registrar todas as requisições em `request_logs` (incluindo linhas com userId = 'global') para monitoramento
- Tentar provedores em ordem de prioridade e fazer fallback quando um provedor falhar (incluindo erros 429 de rate-limit)

#### 🎓 Otimizado para Estudantes (relembrando)

- **2 requisições totais por usuário por dia** (somando todos os provedores: GROQ, Gemini, Ollama)
- Objetivo: garantir acesso equitativo e sustentável para toda a comunidade universitária

#### Fluxo de Controle (atual)

```
Requisição do Usuário
         ↓
Verificar Limite Total por Usuário (2/dia)
         ↓
Selecionar Provedor conforme prioridade configurada
         ↓
Executar Requisição no provedor escolhido
         ↓
Se provedor falhar (incluindo 429), tentar próximo provedor
         ↓
Incrementar contador de uso para o provedor efetivamente usado
         ↓
Retornar resposta ao usuário (ou fallback genérico se todos falharem)
```

#### Configuração da prioridade de provedores

A prioridade (ordem) dos provedores AI pode ser configurada via variável de ambiente `AI_PROVIDER_PRIORITY`. Valor padrão: `groq,gemini,ollama`.

Exemplos:

```bash
# Priorizar Gemini sobre Groq
AI_PROVIDER_PRIORITY='gemini,groq,ollama'

# Somente usar Gemini e Ollama (ignorar Groq)
AI_PROVIDER_PRIORITY='gemini,ollama'
```

No código, essa variável é lida em `src/config/env.js` como `aiProviderPriority` e aplicada ao serviço de AI para definir a ordem de tentativa.

#### Tratamento de rate-limits (429) e fallback

- Se um provedor retornar um erro de rate-limit (HTTP 429) ou outros erros transitórios, o serviço registrará o erro e tentará o próximo provedor na lista de prioridade.
- Se todos os provedores falharem (incluindo retorno de 429), o sistema oferece um fallback genérico (`getGenericAdvice()`) para não quebrar a experiência do usuário.
- Mensagens ao usuário: quando o provedor recusa por excesso de requisições, o backend tenta um fallback — se houver erro fatal (ex.: autenticação inválida) o erro é retornado ao cliente com mensagem legível.

#### Endpoints de Gestão de Limites

```http
GET /api/chat/limits
```

**Response (exemplo atual, sem exposição de limites globais)**
```json
{
  "success": true,
  "data": {
    "combined": {
      "userLimit": 2,
      "userUsed": 1,
      "userRemaining": 1,
      "userPercentage": 50,
      "nearLimit": false,
      "limitExceeded": false
    },
    "gemini": {
      "userUsed": 0,
      "userPercentage": 0,
      "available": true
    },
    "groq": {
      "userUsed": 1,
      "userPercentage": 100,
      "available": true
    }
  }
}
```

---

#### Observability: consultas SQL úteis e alerta de exemplo

A tabela Prisma `RequestLog` (mapeada para `request_logs`) registra o uso por `user_id`, `date`, `provider` e `count`. Seguem consultas úteis para monitoramento e um exemplo de alerta.

1) Total diário por provedor (hoje):

```sql
SELECT provider, SUM(count) AS total_today
FROM request_logs
WHERE date = CURRENT_DATE
GROUP BY provider
ORDER BY total_today DESC;
```

2) Percentual do limite (exemplo: se a cota do provedor for 1500/dia — ajuste conforme o provedor):

```sql
-- Substitua 1500 pelo quota real do provedor
SELECT provider,
       SUM(count) AS total_today,
       (SUM(count)::float / 1500.0) * 100.0 AS percent_of_quota
FROM request_logs
WHERE date = CURRENT_DATE
GROUP BY provider;
```

3) Alerta SQL/Grafana (regra exemplo)

- Objetivo: alertar quando o uso diário de um provedor ultrapassar 80% da cota conhecida.
- Substitua `<PROVIDER_QUOTA>` pelo número real (ex.: 1500 para Gemini Flash 2026).

```sql
-- Regra exemplo que pode ser usada em Grafana/SQL alerting
SELECT provider, SUM(count) AS total_today
FROM request_logs
WHERE date = CURRENT_DATE
GROUP BY provider
HAVING SUM(count) > 0.8 * <PROVIDER_QUOTA>;
```

Se essa consulta retornar linhas, significa que o provedor atingiu mais de 80% da cota naquele dia e deve disparar um alerta para a equipe.

4) Exemplo Prometheus alert (se exportar métricas do request log):

```yaml
# alert: HighAIProviderUsage
expr: fincash_requestlog_total{provider="gemini",job="requestlog_exporter"} > 0.8 * 1500
for: 5m
labels:
  severity: warning
annotations:
  summary: "Uso alto do provedor Gemini ({{ $labels.provider }})"
  description: "Uso diário atual supera 80% da cota conhecida. Verifique chaves, erros e aumente cota se necessário."
```

---

#### Recomendações operacionais

- Configure `AI_PROVIDER_PRIORITY` no ambiente de produção conforme SLA/custos e disponibilidade de cada provedor.
- Não usar mais blocos automáticos baseados em contadores globais — use monitoramento e alertas para agir manualmente ou ajustar quotas.
- Configure alertas (Grafana/Prometheus) com thresholds baseados nas cotas reais de cada provedor (ex.: 80%/90%).
- Considere adicionar um painel de observabilidade no Grafana com métricas diárias por `provider`, `user` e histórico das últimas 7/30 dias.


---

## 🔧 Configuração e Setup

### Variáveis de Ambiente

```env
# Provedores de IA
GROQ_API_KEY=groq_api_key_here
GEMINI_API_KEY=gemini_api_key_here
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Redis (opcional, para cache)
REDIS_URL=redis://localhost:6379
```

### Modelos Utilizados

```javascript
const MODELS = {
  gemini: 'gemini-1.5-pro',
  groq: 'llama-3.3-70b-versatile',
  ollama: 'llama3.2'
};
```

### Setup dos Provedores

#### GROQ (Principal)
```bash
# 1. Obtenha API key em https://console.groq.com/
# 2. Adicione ao .env
GROQ_API_KEY=gsk_xxx
```

#### Gemini (Backup)
```bash
# 1. Crie projeto em https://aistudio.google.com/
# 2. Obtenha API key
# 3. Adicione ao .env
GEMINI_API_KEY=AIzaSyxxx
```

#### Ollama (Local)
```bash
# 1. Instale Ollama
curl https://ollama.ai/install.sh | sh

# 2. Baixe modelo
ollama pull llama3.2

# 3. Configure no .env
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

---

## 📊 Contexto Financeiro Dinâmico

### Dados Coletados

```javascript
async function getFinancialContext(userId, period = '30d') {
  return {
    // Dados gerais
    balance: number,
    totalIncome: number,
    totalExpense: number,

    // Transações recentes
    recentTransactions: Transaction[],

    // Metas financeiras
    goals: Goal[],

    // Orçamentos do mês atual
    budgets: Budget[],

    // Metadados
    currentMonth: number,
    currentYear: number,
    period: string,
    periodDays: number
  };
}
```

### Comparativos de Períodos

```javascript
async function getComparativeContext(userId, periods = ['7d', '30d', '365d']) {
  return {
    periods: [
      {
        period: '7d',
        periodDays: 7,
        balance: number,
        totalIncome: number,
        totalExpense: number
      },
      // ... outros períodos
    ],
    currentGoals: Goal[],
    currentBudgets: Budget[]
  };
}
```

---

## 🔄 Fluxo de Seleção de Provedor

### Algoritmo de Priorização

```javascript
async function selectBestProvider(userId) {
  // 1. Tentar GROQ (mais rápido e maior limite)
  if (await isProviderAvailable('groq', userId)) {
    return 'groq';
  }

  // 2. Tentar Gemini (backup primário)
  if (await isProviderAvailable('gemini', userId)) {
    return 'gemini';
  }

  // 3. Fallback para Ollama (sempre disponível)
  return 'ollama';
}

async function isProviderAvailable(provider, userId) {
  // Verificar se está configurado
  // Verificar limites globais
  // Verificar limites por usuário
  return availability;
}
```

### Criterios de Disponibilidade

```javascript
const providerStatus = {
  configured: boolean,        // API key presente
  globalLimit: boolean,       // Limite global não atingido
  userLimit: boolean,          // Limite por usuário não atingido
  operational: boolean         // Serviço respondendo
};
```

---

## ⚠️ Tratamento de Erros e Fallback

### Hierarquia de Fallback

```
GROQ (Primary)
    ↓ Erro/Limites
Gemini (Secondary)
    ↓ Erro/Limites
Ollama (Local)
    ↓ Erro
Fallback Genérico (Respostas pré-definidas)
```

### Tratamento de Erros

```javascript
try {
  const response = await groqClient.chat.completions.create({
    messages: messages,
    model: 'llama-3.3-70b-versatile'
  });
  return response;
} catch (error) {
  logger.error('GROQ error', { error: error.message });
  // Fallback para próximo provedor
  return await tryNextProvider(context, ['gemini', 'ollama']);
}
```

### Fallback Genérico

Quando todos os provedores falham, o sistema retorna mensagens pré-definidas baseadas no contexto:

```javascript
const genericFallbacks = {
  noBalanceAvailable: "Sua análise não pôde ser gerada, mas aqui estão algumas dicas...",
  generalError: "Desculpe, estamos com dificuldades técnicas. Tente novamente em alguns minutos.",
  rateLimitExceeded: "Você atingiu seu limite diário de consultas à IA. Tente novamente amanhã."
};
```

---

## 📈 Performance e Otimizações

### Cache Redis

```javascript
// Cache de contextos frequentes
const cacheKey = generateCacheKey(userId, period, provider);
const cached = await getCachedResponse(cacheKey);

if (cached) {
  return cached; // Retorna resposta cacheada
}

// Processa e armazena no cache
const response = await generateResponse(context);
await setCachedResponse(cacheKey, response, ttl: 3600);
```

### Cache Strategies

- **Contexto Financeiro**: Cache 1 hora
- **Sugestões de Categorização**: Cache 30 minutos
- **Análises Recentes**: Cache 15 minutos

---

## 🧪 Testando o Sistema de IA

### Testar Chatbot

```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Como posso economizar mais dinheiro?"}'
```

### Testar Categorização

```bash
curl -X POST http://localhost:5000/api/categorization/suggest \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Supermercado Extra",
    "description": "Compras semanais",
    "type": "expense"
  }'
```

### Verificar Limites

```bash
curl -X GET http://localhost:5000/api/chat/limits \
  -H "Authorization: Bearer <token>"
```

---

## 📚 Prompt Engineering

### Prompt Principal (Simplificado)

```
Você é um CONSULTOR FINANCEIRO ESPECIALIZADO em ajudar ESTUDANTES UNIVERSITÁRIOS de Palmas, Tocantins, com mais de 20 anos de experiência em finanças pessoais.

CONTEXTO DO PÚBLICO:
- Estudantes universitários de Palmas/TO (IFTO, UFT, faculdades privadas)
- Renda típica: bolsa-auxílio (R$ 400-600/mês) ou trabalho informal
- Gastos principais: alimentação no campus, transporte coletivo, moradia
- Metas comuns: notebook, viagem de formatura, reserva para emergências

Sua MISSÃO é fornecer uma análise financeira EXTREMAMENTE DETALHADA, PROFUNDAMENTE PERSONALIZADA e PRATICAMENTE APLICÁVEL.

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:
1. RESUMO EXECUTIVO
2. ANÁLISE DE RECEITAS
3. ANÁLISE DE DESPESAS
4. ANÁLISE DE METAS
5. ANÁLISE DE ORÇAMENTOS
6. RECOMENDAÇÕES PRÁTICAS
7. RECURSOS ADICIONAIS

IMPORTANTE: Seja muito específico com números e porcentagens. Use exemplos práticos e cenários reais de estudantes.
```

---

## 🔒 Segurança do Sistema de IA

### Proteções Implementadas

1. **Rate Limiting**: Limites rigorosos por usuário e global
2. **Content Filtering**: Filtragem de conteúdo inapropriado
3. **Data Privacy**: Contexto enviado é anônimo e temporário
4. **API Keys**: Armazenadas em environment variables
5. **Input Validation**: Validação rigorosa de inputs do usuário

### Privacidade de Dados

- Contexto financeiro enviado é temporário
- Não armazenamos conversações completas
- Logs são anonimizados
- Compliance com LGPD (Lei Geral de Proteção de Dados)

---

## 📊 Monitoramento e Logs

### Logging Específico de IA

```javascript
logger.info('AI request initiated', {
  userId,
  provider,
  requestType,
  period,
  remainingRequests: limits.remaining
});

logger.error('AI provider failed', {
  provider,
  error: error.message,
  fallbackTriggered: true
});
```

### Métricas Coletadas

- Requisições por provedor
- Tempo de resposta por provedor
- Taxa de sucesso/falha
- Usuários ativos com IA
- Contextos mais solicitados

---

## 🚀 Próximas Melhorias

### Planejado
- [ ] Fine-tuning de modelo para finanças brasileiras
- [ ] Integração com mais provedores de IA
- [ ] Análise preditiva de gastos futuros
- [ ] Detecção de anomalias em transações
- [ ] Recomendações automáticas de investimentos

### Roadmap
- [ ] Sistema de aprendizado contínuo
- [ ] Análise de sentimento financeiro
- [ ] Integração com bancos para dados automáticos
- [ ] Alertas inteligentes de gastos

---

## 📞 Suporte e Troubleshooting

### Problemas Comuns

**Provedor não responde**
```bash
# Verifique se a API key está correta
# Verifique se o serviço está operacional
# Verifique limites de requisição
```

**Contexto vazio**
```bash
# Verifique se o usuário tem transações
# Verifique período selecionado
# Verifique conexão com banco de dados
```

**Rate limit atingido**
```bash
# Aguarde até o próximo dia
# Considere aumentar limites (custo adicional)
# Verifique se há requisições em loop
```

---

<div align="center">

**Desenvolvido com 🧠 pela equipe FinCash**

[⬆ Voltar à Documentação Principal](../README.md)

</div>