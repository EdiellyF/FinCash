# Arquitetura do Sistema de IA Dual - FinCash

## 📐 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente (Frontend)                        │
│                    POST /api/chat/send                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Chat Controller                                 │
│  - Validação de entrada                                     │
│  - Busca histórico da conversa                              │
│  - Chama aiService.generateFinancialAdvice()               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Service - selectBestProvider()               │
│                                                              │
│  1. isProviderAvailable('groq', userId)?                    │
│     ├─ Verificar se groqClient está configurado             │
│     ├─ Verificar limite global (100/dia)                    │
│     └─ Verificar limite por usuário (20/dia)                │
│                                                              │
│  2. isProviderAvailable('gemini', userId)?                  │
│     ├─ Verificar se genAI está configurado                  │
│     ├─ Verificar limite global (20/dia)                     │
│     └─ Verificar limite por usuário (2/dia)                 │
│                                                              │
│  3. Fallback para Ollama (sempre disponível)                │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐     ┌──────────┐
   │  GROQ   │      │ Gemini  │     │  Ollama  │
   │ (Rápido)│      │(Poderoso)│     │(Fallback)│
   └────┬────┘      └────┬────┘     └────┬─────┘
        │                │               │
        └────────────────┼───────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  Incrementar Contadores        │
        │  - checkAndIncrementRequestCount│
        │  - Atualizar RequestLog        │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  Salvar Mensagens no Banco     │
        │  - ChatMessage (user)          │
        │  - ChatMessage (assistant)     │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  Retornar Resposta ao Cliente  │
        │  - Conteúdo da IA              │
        │  - ID da mensagem              │
        │  - Timestamp                   │
        └────────────────────────────────┘
```

## 🏗️ Estrutura de Classes e Funções

### AI Service (`aiService.js`)

```javascript
// Configuração
const genAI              // GoogleGenerativeAI (Gemini)
const groqClient         // Groq SDK
const OLLAMA_API_URL     // URL do Ollama
const MODELS = {
  gemini: 'gemini-flash-latest',
  groq: 'llama-3.3-70b-versatile',
  ollama: 'llama3.2'
}

// Funções Principais
getFinancialContext(userId)              // Obter contexto financeiro
checkAndIncrementRequestCount(userId, provider)  // Rastrear requisições
checkGlobalLimit(provider)               // Verificar limite global
checkUserLimit(userId, provider)         // Verificar limite por usuário
getProviderLimits(provider)              // Obter limites configurados
isProviderAvailable(provider, userId)    // Verificar disponibilidade
selectBestProvider(userId)               // Selecionar melhor provedor
generateWithGemini(...)                  // Gerar com Gemini
generateWithGroq(...)                    // Gerar com GROQ
generateWithOllama(...)                  // Gerar com Ollama
generateFinancialAdvice(...)             // Função principal (export)
getUserLimits(userId)                    // Retornar limites (export)
```

## 📊 Modelo de Dados

### Tabela: request_logs

```sql
CREATE TABLE request_logs (
  id        UUID PRIMARY KEY,
  user_id   VARCHAR(255),           -- 'global' para limite global
  date      DATE,
  count     INT DEFAULT 0,
  provider  VARCHAR(50),            -- 'gemini', 'groq', 'ollama'
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, date, provider)
);
```

### Tabela: chat_messages

```sql
CREATE TABLE chat_messages (
  id        UUID PRIMARY KEY,
  user_id   VARCHAR(255),
  role      VARCHAR(50),            -- 'user' ou 'assistant'
  content   TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔄 Fluxo de Seleção de Provedor

### Algoritmo de Decisão

```
function selectBestProvider(userId):
  
  // Passo 1: Verificar GROQ
  if isProviderAvailable('groq', userId):
    return 'groq'
  
  // Passo 2: Verificar Gemini
  if isProviderAvailable('gemini', userId):
    return 'gemini'
  
  // Passo 3: Fallback para Ollama
  return 'ollama'

function isProviderAvailable(provider, userId):
  
  // Verificar se cliente está configurado
  if provider == 'gemini' and not genAI:
    return false
  if provider == 'groq' and not groqClient:
    return false
  
  // Verificar limites
  limits = getProviderLimits(provider)
  globalCount = checkGlobalLimit(provider)
  userCount = checkUserLimit(userId, provider)
  
  return (globalCount < limits.global and 
          userCount < limits.perUser)
```

## 🎯 Limites de Requisições

### GROQ

| Tipo | Limite | Período | Notas |
|------|--------|---------|-------|
| Global | 100 | Por dia | Compartilhado entre todos os usuários |
| Por usuário | 20 | Por dia | Limite individual |
| Prioridade | 1ª | - | Escolhido primeiro se disponível |

### Gemini

| Tipo | Limite | Período | Notas |
|------|--------|---------|-------|
| Global | 20 | Por dia | Compartilhado entre todos os usuários |
| Por usuário | 2 | Por dia | Limite individual |
| Prioridade | 2ª | - | Escolhido se GROQ indisponível |

### Ollama

| Tipo | Limite | Período | Notas |
|------|--------|---------|-------|
| Global | Ilimitado | - | Sem limite |
| Por usuário | Ilimitado | - | Sem limite |
| Prioridade | 3ª | - | Fallback sempre disponível |

## 🔐 Segurança

### Proteção de Chaves de API

```javascript
// ✅ Correto - Variáveis de ambiente
const groqClient = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;

// ❌ Errado - Hardcoded
const groqClient = new Groq({ apiKey: 'gsk_...' });
```

### Validação de Entrada

```javascript
// Validação no controller
if (!message || message.trim().length === 0) {
  return res.status(400).json({ message: 'Mensagem é obrigatória.' });
}
```

### Rastreamento de Uso

```javascript
// Todas as requisições são registradas
await checkAndIncrementRequestCount(userId, provider);
await checkAndIncrementRequestCount('global', provider);
```

## 📈 Monitoramento e Observabilidade

### Logs Importantes

```
[FinCash AI] Provedor selecionado: groq
[FinCash AI] Provedor selecionado: gemini
[FinCash AI] Provedor selecionado: ollama
```

### Queries de Monitoramento

```sql
-- Ver distribuição de uso por provedor
SELECT provider, COUNT(*) as total
FROM request_logs
WHERE DATE(date) = CURRENT_DATE
GROUP BY provider;

-- Ver usuários que atingiram limite
SELECT user_id, provider, count
FROM request_logs
WHERE DATE(date) = CURRENT_DATE
  AND (
    (provider = 'groq' AND count >= 20) OR
    (provider = 'gemini' AND count >= 2)
  );

-- Ver histórico de uso por usuário
SELECT user_id, provider, count, date
FROM request_logs
WHERE user_id = 'seu_user_id'
ORDER BY date DESC;
```

## 🚀 Performance

### Tempos de Resposta Esperados

| Provedor | Tempo Médio | Variação | Notas |
|----------|------------|----------|-------|
| GROQ | 1-2s | Muito baixa | Mais rápido |
| Gemini | 2-4s | Média | Resposta mais detalhada |
| Ollama | 5-30s | Alta | Depende do hardware |

### Otimizações Implementadas

1. **Seleção Inteligente**: Escolhe o provedor mais rápido disponível
2. **Fallback Automático**: Nunca falha, sempre tem alternativa
3. **Rastreamento Eficiente**: Usa índices no banco de dados
4. **Histórico Limitado**: Busca apenas últimas 10 mensagens

## 🔧 Configuração Avançada

### Ajustar Limites

```javascript
// Em aiService.js
const GEMINI_DAILY_LIMIT_GLOBAL = 20;    // Alterar aqui
const GEMINI_DAILY_LIMIT_PER_USER = 2;   // Alterar aqui
const GROQ_DAILY_LIMIT_GLOBAL = 100;     // Alterar aqui
const GROQ_DAILY_LIMIT_PER_USER = 20;    // Alterar aqui
```

### Alterar Modelos

```javascript
// Em aiService.js
const MODELS = {
  gemini: 'gemini-1.5-pro',              // Alterar modelo
  groq: 'mixtral-8x7b-32768',            // Alterar modelo
  ollama: 'neural-chat'                  // Alterar modelo
}
```

## 🐛 Troubleshooting

### Problema: Sempre usa Ollama

**Verificação:**
```javascript
// Adicionar logs de debug
console.log('GROQ disponível:', await isProviderAvailable('groq', userId));
console.log('Gemini disponível:', await isProviderAvailable('gemini', userId));
```

### Problema: Erro ao conectar com GROQ

**Verificação:**
```javascript
// Testar conexão
const test = await groqClient.chat.completions.create({
  messages: [{ role: 'user', content: 'Teste' }],
  model: 'llama-3.3-70b-versatile',
});
```

### Problema: Limite atingido

**Solução:**
```sql
-- Resetar contadores (cuidado!)
DELETE FROM request_logs 
WHERE DATE(date) < CURRENT_DATE;
```

## 📚 Referências Técnicas

- [GROQ SDK Documentation](https://github.com/groq/groq-typescript)
- [Google Generative AI SDK](https://github.com/google/generative-ai-js)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)

---

**Última atualização:** 07 de Maio de 2026
**Versão:** 2.0 
