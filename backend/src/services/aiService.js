import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { env } from '../config/env.js';

const prisma = new PrismaClient();

// Configuração Gemini
const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

// Configuração GROQ
const groqClient = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;

// Configuração Ollama (local)
const OLLAMA_API_URL = env.ollamaApiUrl || 'http://localhost:11434';
const OLLAMA_MODEL = env.ollamaModel || 'llama3.2';

// Limites de requisições
const GEMINI_DAILY_LIMIT_GLOBAL = 20;
const GEMINI_DAILY_LIMIT_PER_USER = 2;
const GROQ_DAILY_LIMIT_GLOBAL = 100;
const GROQ_DAILY_LIMIT_PER_USER = 20;

// Modelos disponíveis
const MODELS = {
  gemini: 'gemini-flash-latest',
  groq: 'llama-3.3-70b-versatile',
  ollama: env.ollamaModel || 'llama3.2',
};

/**
 * Obter contexto financeiro do usuário
 */
async function getFinancialContext(userId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      transactionDate: 'desc',
    },
    take: 20,
  });

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { deadline: 'asc' },
  });

  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      month: currentMonth,
      year: currentYear,
    },
    include: {
      category: true,
    },
  });

  const totalIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  return {
    balance,
    totalIncome,
    totalExpense,
    recentTransactions,
    goals,
    budgets,
    currentMonth,
    currentYear,
  };
}

/**
 * Verifica e incrementa contador de requisições diárias por usuário
 */
async function checkAndIncrementRequestCount(userId, provider) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.requestLog.findUnique({
    where: {
      userId_date_provider: {
        userId,
        date: today,
        provider,
      },
    },
  });

  if (!log) {
    await prisma.requestLog.create({
      data: {
        userId,
        date: today,
        count: 1,
        provider,
      },
    });
    return 1;
  }

  await prisma.requestLog.update({
    where: { id: log.id },
    data: { count: log.count + 1 },
  });

  return log.count + 1;
}

/**
 * Verifica limite global de um provedor
 */
async function checkGlobalLimit(provider) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.requestLog.findUnique({
    where: {
      userId_date_provider: {
        userId: 'global',
        date: today,
        provider,
      },
    },
  });

  return log ? log.count : 0;
}

/**
 * Verifica limite por usuário de um provedor
 */
async function checkUserLimit(userId, provider) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.requestLog.findUnique({
    where: {
      userId_date_provider: {
        userId,
        date: today,
        provider,
      },
    },
  });

  return log ? log.count : 0;
}

/**
 * Obtém os limites configurados para cada provedor
 */
function getProviderLimits(provider) {
  const limits = {
    gemini: {
      global: GEMINI_DAILY_LIMIT_GLOBAL,
      perUser: GEMINI_DAILY_LIMIT_PER_USER,
    },
    groq: {
      global: GROQ_DAILY_LIMIT_GLOBAL,
      perUser: GROQ_DAILY_LIMIT_PER_USER,
    },
  };
  return limits[provider] || { global: Infinity, perUser: Infinity };
}

/**
 * Verifica se um provedor está disponível e dentro dos limites
 */
async function isProviderAvailable(provider, userId) {
  // Verificar se o cliente está configurado
  if (provider === 'gemini' && !genAI) return false;
  if (provider === 'groq' && !groqClient) return false;

  const limits = getProviderLimits(provider);
  const globalCount = await checkGlobalLimit(provider);
  const userCount = await checkUserLimit(userId, provider);

  return (
    globalCount < limits.global &&
    userCount < limits.perUser
  );
}

/**
 * Seleciona o melhor provedor disponível
 * Prioridade: GROQ > Gemini > Ollama
 */
async function selectBestProvider(userId) {
  // Tentar GROQ primeiro (mais rápido e com mais limites)
  if (await isProviderAvailable('groq', userId)) {
    return 'groq';
  }

  // Tentar Gemini
  if (await isProviderAvailable('gemini', userId)) {
    return 'gemini';
  }

  // Fallback para Ollama (sempre disponível)
  return 'ollama';
}

/**
 * Gera dica financeira usando Gemini
 */
async function generateWithGemini(contextText, historyText, userMessage) {
  const model = genAI.getGenerativeModel({ model: MODELS.gemini });

  const systemPrompt = `Você é um CONSULTOR FINANCEIRO ESPECIALIZADO com mais de 20 anos de experiência em finanças pessoais e investimentos.

Sua MISSÃO é fornecer uma análise financeira EXTREMAMENTE DETALHADA, PROFUNDAMENTE PERSONALIZADA e PRATICAMENTE APLICÁVEL.

IMPORTANTE - SUA RESPOSTA DEVE SER:
- MUITO LONGA (mínimo 1000 palavras, idealmente 1500-2000)
- ALTAMENTE ESTRUTURADA em seções claras
- RICA EM DADOS NÚMERICOS E PORCENTAGENS
- COM EXEMPLOS PRÁTICOS E CENÁRIOS REAIS
- COM AÇÕES ESPECÍFICAS E IMEDIATAS

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

1. 🔍 RESUMO EXECUTIVO (100-150 palavras)
   - Situação financeira atual em 3 frases
   - Principal problema identificado
   - Principal oportunidade

2. 📊 ANÁLISE DE RECEITAS (150-200 palavras)
   - Total de receitas e comparação com média brasileira
   - Fontes de renda e diversificação
   - Tendência de receitas nos últimos 30 dias
   - Recomendações para aumentar receitas

3. 💸 ANÁLISE DE DESPESAS (200-250 palavras)
   - Total de despesas e percentual por categoria
   - Top 3 categorias de gastos com valores absolutos e relativos
   - Identificação de gastos desnecessários ou excessivos
   - Comparação mês atual vs mês anterior
   - Onde é possível economizar imediatamente

4. 🎯 ORÇAMENTO (150-200 palavras)
   - Status de cada orçamento definido
   - Categorias estouradas com valores excedentes
   - Categorias dentro do limite com margem
   - Ajustes necessários no orçamento

5. 🏆 METAS FINANCEIRAS (200-250 palavras)
   - Progresso de cada meta em % e valor
   - Tempo restante para cada meta
   - Se está no caminho certo (sim/não e por quê)
   - Ajustes necessários para atingir metas no prazo
   - Sugestão de reorganização de prioridades

6. 📈 DADOS NÚMERICOS ESSENCIAIS (150-200 palavras)
   - Saldo atual e sua evolução
   - Margem de poupança atual (%)
   - Índice de endividamento (se aplicável)
   - Taxa de poupança mensal
   - Score financeiro (0-100) com justificativa

7. 💡 15 RECOMENDAÇÕES PRÁTICAS (cada uma com 2-3 frases)
   - 5 ações para IMEDIATO (hoje/esta semana)
   - 5 ações para CURTO PRAZO (este mês)
   - 5 ações para MÉDIO PRAZO (próximos 3 meses)
   - Cada recomendação deve ter valor estimado de economia

8. 📅 PLANO DE AÇÃO DETALHADO (200-250 palavras)
   - Semana 1: 3 tarefas específicas
   - Semana 2: 3 tarefas específicas
   - Semana 3: 3 tarefas específicas
   - Semana 4: 3 tarefas específicas
   - Cada tarefa com responsável e prazo

9. ⚠️ RISCOS E ALERTAS (150-200 palavras)
   - 5 riscos financeiros atuais
   - 5 sinais de alerta a monitorar
   - 5 armadilhas comuns a evitar
   - Plano de contingência

10. 🔮 PROJEÇÕES E CENÁRIOS (200-250 palavras)
    - Cenário otimista (se continuar assim)
    - Cenário realista (com ajustes sugeridos)
    - Cenário pessimista (se nada mudar)
    - Projeção de saldo em 6 meses e 1 ano

ESTILO DE COMUNICAÇÃO:
- Seja DIRETO e OBJETIVO
- Use LINGUAGEM SIMPLES mas profissional
- Use EMOJIS para destacar pontos importantes
- Seja EMPÁTICO mas FIRME nas recomendações
- Use NUMEROS E PORCENTAGENS sempre que possível

Exemplo de formato:
"💡 Ação Imediata: Reduzir gastos com alimentação em R$ 200/mês
   Valor estimado: R$ 2.400/ano
   Como: Cozinhar mais em casa, reduzir entregas"

Use TODOS os dados financeiros fornecidos no contexto.
Seja extremamente específico em cada recomendação.
Responda em PORTUGUÊS BRASILEIRO.`;

  const fullPrompt = `${systemPrompt}\n\nContexto:\n${contextText}\n\nHistórico da conversa:\n${historyText}\n\nPergunta atual: ${userMessage}`;

  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

/**
 * Gera dica financeira usando GROQ
 */
async function generateWithGroq(contextText, historyText, userMessage) {
  const systemPrompt = `Você é um CONSULTOR FINANCEIRO ESPECIALIZADO com mais de 20 anos de experiência em finanças pessoais e investimentos.

Sua MISSÃO é fornecer uma análise financeira EXTREMAMENTE DETALHADA, PROFUNDAMENTE PERSONALIZADA e PRATICAMENTE APLICÁVEL.

IMPORTANTE - SUA RESPOSTA DEVE SER:
- MUITO LONGA (mínimo 1000 palavras, idealmente 1500-2000)
- ALTAMENTE ESTRUTURADA em seções claras
- RICA EM DADOS NÚMERICOS E PORCENTAGENS
- COM EXEMPLOS PRÁTICOS E CENÁRIOS REAIS
- COM AÇÕES ESPECÍFICAS E IMEDIATAS

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

1. 🔍 RESUMO EXECUTIVO (100-150 palavras)
   - Situação financeira atual em 3 frases
   - Principal problema identificado
   - Principal oportunidade

2. 📊 ANÁLISE DE RECEITAS (150-200 palavras)
   - Total de receitas e comparação com média brasileira
   - Fontes de renda e diversificação
   - Tendência de receitas nos últimos 30 dias
   - Recomendações para aumentar receitas

3. 💸 ANÁLISE DE DESPESAS (200-250 palavras)
   - Total de despesas e percentual por categoria
   - Top 3 categorias de gastos com valores absolutos e relativos
   - Identificação de gastos desnecessários ou excessivos
   - Comparação mês atual vs mês anterior
   - Onde é possível economizar imediatamente

4. 🎯 ORÇAMENTO (150-200 palavras)
   - Status de cada orçamento definido
   - Categorias estouradas com valores excedentes
   - Categorias dentro do limite com margem
   - Ajustes necessários no orçamento

5. 🏆 METAS FINANCEIRAS (200-250 palavras)
   - Progresso de cada meta em % e valor
   - Tempo restante para cada meta
   - Se está no caminho certo (sim/não e por quê)
   - Ajustes necessários para atingir metas no prazo
   - Sugestão de reorganização de prioridades

6. 📈 DADOS NÚMERICOS ESSENCIAIS (150-200 palavras)
   - Saldo atual e sua evolução
   - Margem de poupança atual (%)
   - Índice de endividamento (se aplicável)
   - Taxa de poupança mensal
   - Score financeiro (0-100) com justificativa

7. 💡 15 RECOMENDAÇÕES PRÁTICAS (cada uma com 2-3 frases)
   - 5 ações para IMEDIATO (hoje/esta semana)
   - 5 ações para CURTO PRAZO (este mês)
   - 5 ações para MÉDIO PRAZO (próximos 3 meses)
   - Cada recomendação deve ter valor estimado de economia

8. 📅 PLANO DE AÇÃO DETALHADO (200-250 palavras)
   - Semana 1: 3 tarefas específicas
   - Semana 2: 3 tarefas específicas
   - Semana 3: 3 tarefas específicas
   - Semana 4: 3 tarefas específicas
   - Cada tarefa com responsável e prazo

9. ⚠️ RISCOS E ALERTAS (150-200 palavras)
   - 5 riscos financeiros atuais
   - 5 sinais de alerta a monitorar
   - 5 armadilhas comuns a evitar
   - Plano de contingência

10. 🔮 PROJEÇÕES E CENÁRIOS (200-250 palavras)
    - Cenário otimista (se continuar assim)
    - Cenário realista (com ajustes sugeridos)
    - Cenário pessimista (se nada mudar)
    - Projeção de saldo em 6 meses e 1 ano

ESTILO DE COMUNICAÇÃO:
- Seja DIRETO e OBJETIVO
- Use LINGUAGEM SIMPLES mas profissional
- Use EMOJIS para destacar pontos importantes
- Seja EMPÁTICO mas FIRME nas recomendações
- Use NUMEROS E PORCENTAGENS sempre que possível

Exemplo de formato:
"💡 Ação Imediata: Reduzir gastos com alimentação em R$ 200/mês
   Valor estimado: R$ 2.400/ano
   Como: Cozinhar mais em casa, reduzir entregas"

Use TODOS os dados financeiros fornecidos no contexto.
Seja extremamente específico em cada recomendação.
Responda em PORTUGUÊS BRASILEIRO.`;

  const messages = [
    {
      role: 'user',
      content: `${systemPrompt}\n\nContexto:\n${contextText}\n\nHistórico da conversa:\n${historyText}\n\nPergunta atual: ${userMessage}`,
    },
  ];

  const chatCompletion = await groqClient.chat.completions.create({
    messages,
    model: MODELS.groq,
  });

  return chatCompletion.choices[0]?.message?.content || '';
}

/**
 * Gera dica financeira usando Ollama
 */
async function generateWithOllama(contextText, historyText, userMessage) {
  const systemPrompt = `Você é um assistente financeiro especializado em ajudar pessoas a gerenciar suas finanças pessoais.
Forneça dicas práticas, personalizadas e baseadas nos dados financeiros do usuário.
Seja amigável, educativo e construtivo.
Responda em português brasileiro.
Considere o contexto financeiro fornecido para dar dicas específicas.`;

  const fullPrompt = `${systemPrompt}\n\nContexto:\n${contextText}\n\nHistórico da conversa:\n${historyText}\n\nPergunta atual: ${userMessage}`;

  const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELS.ollama,
      prompt: fullPrompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na API do Ollama: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Retorna os limites atuais do usuário para todos os provedores
 */
export async function getUserLimits(userId) {
  const geminiGlobalCount = await checkGlobalLimit('gemini');
  const geminiUserCount = await checkUserLimit(userId, 'gemini');
  const groqGlobalCount = await checkGlobalLimit('groq');
  const groqUserCount = await checkUserLimit(userId, 'groq');

  return {
    gemini: {
      globalLimit: GEMINI_DAILY_LIMIT_GLOBAL,
      globalUsed: geminiGlobalCount,
      globalRemaining: Math.max(0, GEMINI_DAILY_LIMIT_GLOBAL - geminiGlobalCount),
      userLimit: GEMINI_DAILY_LIMIT_PER_USER,
      userUsed: geminiUserCount,
      userRemaining: Math.max(0, GEMINI_DAILY_LIMIT_PER_USER - geminiUserCount),
      available: genAI && geminiGlobalCount < GEMINI_DAILY_LIMIT_GLOBAL && geminiUserCount < GEMINI_DAILY_LIMIT_PER_USER,
    },
    groq: {
      globalLimit: GROQ_DAILY_LIMIT_GLOBAL,
      globalUsed: groqGlobalCount,
      globalRemaining: Math.max(0, GROQ_DAILY_LIMIT_GLOBAL - groqGlobalCount),
      userLimit: GROQ_DAILY_LIMIT_PER_USER,
      userUsed: groqUserCount,
      userRemaining: Math.max(0, GROQ_DAILY_LIMIT_PER_USER - groqUserCount),
      available: groqClient && groqGlobalCount < GROQ_DAILY_LIMIT_GLOBAL && groqUserCount < GROQ_DAILY_LIMIT_PER_USER,
    },
  };
}

/**
 * Gera dica financeira usando o melhor provedor disponível
 */
export async function generateFinancialAdvice(userId, userMessage, conversationHistory = []) {
  try {
    const context = await getFinancialContext(userId);

    const contextText = `
Contexto Financeiro do Usuário:
- Saldo atual: R$ ${context.balance.toFixed(2)}
- Receitas últimos 30 dias: R$ ${context.totalIncome.toFixed(2)}
- Despesas últimos 30 dias: R$ ${context.totalExpense.toFixed(2)}
- Mês atual: ${context.currentMonth}/${context.currentYear}

Metas Financeiras:
${context.goals.map(g => `- ${g.title}: R$ ${Number(g.currentAmount).toFixed(2)} / R$ ${Number(g.targetAmount).toFixed(2)}${g.deadline ? ` (Prazo: ${g.deadline.toLocaleDateString('pt-BR')})` : ''}`).join('\n')}

Orçamentos do Mês:
${context.budgets.map(b => `- ${b.category.name}: Limite R$ ${Number(b.limitAmount).toFixed(2)}`).join('\n') || 'Nenhum orçamento definido'}

Últimas Transações:
${context.recentTransactions.map(t => `- ${t.type === 'income' ? 'Receita' : 'Despesa'}: ${t.title} - R$ ${Number(t.amount).toFixed(2)} (${t.category.name})`).join('\n')}
`;

    const historyText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
      .join('\n');

    // Selecionar o melhor provedor disponível
    const provider = await selectBestProvider(userId);
    console.log(`[FinCash AI] Provedor selecionado: ${provider}`);

    let response;
    switch (provider) {
      case 'groq':
        response = await generateWithGroq(contextText, historyText, userMessage);
        break;
      case 'gemini':
        response = await generateWithGemini(contextText, historyText, userMessage);
        break;
      case 'ollama':
      default:
        response = await generateWithOllama(contextText, historyText, userMessage);
        break;
    }

    // Incrementar contador por usuário
    await checkAndIncrementRequestCount(userId, provider);

    // Incrementar contador global para provedores pagos
    if (provider !== 'ollama') {
      await checkAndIncrementRequestCount('global', provider);
    }

    return response;
  } catch (error) {
    console.error('Erro ao gerar dica financeira:', error);

    // Fallback: dicas genéricas baseadas em regras
    return getGenericAdvice();
  }
}

function getGenericAdvice() {
  const genericTips = [
    "Uma dica importante: tente poupar pelo menos 20% da sua renda mensal.",
    "Considere criar um fundo de emergência equivalente a 3-6 meses de despesas.",
    "Revise suas assinaturas e serviços recorrentes regularmente para cortar gastos desnecessários.",
    "Antes de fazer uma compra impulsiva, espere 24 horas e reavalie se realmente precisa.",
    "Use a regra 50/30/20: 50% para necessidades, 30% para desejos, 20% para poupança.",
  ];

  return genericTips[Math.floor(Math.random() * genericTips.length)];
}
