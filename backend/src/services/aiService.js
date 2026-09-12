import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import crypto from 'crypto';



const prisma = new PrismaClient();

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

const groqClient = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;

const TOTAL_DAILY_LIMIT_PER_USER = 2;


const MODELS = {
  gemini: env.geminiModel || 'gemini-2.5-pro',
  groq: 'llama-3.3-70b-versatile',
};


async function getFinancialContext(userId, period = '30d') {
  const now = new Date();
  const periodDays = {
    '7d': 7,
    '30d': 30,
    '365d': 365,
  }[period] || 30;

  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: {
        gte: startDate,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      transactionDate: 'desc',
    },
    take: 50,
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
    period,
    periodDays,
  };
}


export async function getComparativeContext(userId, periods = ['7d', '30d', '365d']) {
  const contexts = await Promise.all(
    periods.map(period => getFinancialContext(userId, period))
  );

  return {
    periods: contexts.map(ctx => ({
      period: ctx.period,
      periodDays: ctx.periodDays,
      balance: ctx.balance,
      totalIncome: ctx.totalIncome,
      totalExpense: ctx.totalExpense,
    })),
    currentGoals: contexts[0].goals,
    currentBudgets: contexts[0].budgets,
  };
}


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


async function checkTotalUserRequestCount(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = await prisma.requestLog.findMany({
    where: {
      userId,
      date: today,
      provider: {
        in: ['gemini', 'groq'],
      },
    },
  });

  return logs.reduce((total, log) => total + log.count, 0);
}


function getProviderLimits(provider) {
  const limits = {
    gemini: {
      perUser: TOTAL_DAILY_LIMIT_PER_USER, // Usa limite total por usuário
    },
    groq: {
      perUser: TOTAL_DAILY_LIMIT_PER_USER, // Usa limite total por usuário
    },
  };
  return limits[provider] || { perUser: Infinity };
}

async function isProviderAvailable(provider, userId) {
  if (provider === 'gemini' && !genAI) return false;
  if (provider === 'groq' && !groqClient) return false;

  const limits = getProviderLimits(provider);
  const totalUserCount = await checkTotalUserRequestCount(userId);

  return totalUserCount < limits.perUser;
}

/**
 * Seleciona o melhor provedor disponível
 * Prioridade: GROQ > Gemini
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

  return null;
}

/**
 * Gera dica financeira usando Gemini
 */
async function generateWithGemini(contextText, historyText, userMessage) {
  const model = genAI.getGenerativeModel({ model: MODELS.gemini });

  const systemPrompt = `Você é um CONSULTOR FINANCEIRO ESPECIALIZADO em ajudar ESTUDANTES UNIVERSITÁRIOS de Palmas, Tocantins, com mais de 20 anos de experiência em finanças pessoais.

CONTEXTO DO PÚBLICO:
- Estudantes universitários de Palmas/TO (IFTO, UFT, faculdades privadas)
- Renda típica: bolsa-auxílio (R$ 400-600/mês) ou trabalho informal
- Gastos principais: alimentação no campus, transporte coletivo, moradia (república/alojamento), materiais de estudo
- Metas comuns: notebook, viagem de formatura, reserva para emergências, cursos complementares
- Custo de vida de Palmas: alimentação mais barata no campus, transporte R$ 4,50 (urbano), aluguel de república R$ 300-500

Sua MISSÃO é fornecer uma análise financeira EXTREMAMENTE DETALHADA, PROFUNDAMENTE PERSONALIZADA e PRATICAMENTE APLICÁVEL para estudantes.

IMPORTANTE - SUA RESPOSTA DEVE SER:
- MUITO LONGA (mínimo 1000 palavras, idealmente 1500-2000)
- ALTAMENTE ESTRUTURADA em seções claras
- RICA EM DADOS NÚMERICOS E PORCENTAGENS
- COM EXEMPLOS PRÁTICOS E CENÁRIOS REAIS de estudantes
- COM AÇÕES ESPECÍFICAS E IMEDIATAS

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

1. 🔍 RESUMO EXECUTIVO (100-150 palavras)
   - Situação financeira atual em 3 frases
   - Principal problema identificado
   - Principal oportunidade

2. 📊 ANÁLISE DE RECEITAS (150-200 palavras)
   - Total de receitas e comparação com renda típica de estudante em Palmas
   - Fontes de renda (bolsa, trabalho familiar, freelances)
   - Tendência de receitas no período analisado
   - Recomendações para aumentar renda (estudante-friendly)

3. 💸 ANÁLISE DE DESPESAS (200-250 palavras)
   - Total de despesas e percentual por categoria
   - Top 3 categorias de gastos com valores absolutos e relativos
   - Identificação de gastos desnecessários ou excessivos para estudante
   - Comparação com período anterior
   - Onde é possível economizar imediatamente (foco em custo estudantil)

4. 🎯 ORÇAMENTO (150-200 palavras)
   - Status de cada orçamento definido
   - Categorias estouradas com valores excedentes
   - Categorias dentro do limite com margem
   - Ajustes necessários no orçamento estudantil

5. 🏆 METAS FINANCEIRAS (200-250 palavras)
   - Progresso de cada meta em % e valor
   - Tempo restante para cada meta
   - Se está no caminho certo (sim/não e por quê)
   - Ajustes necessários para atingir metas no prazo
   - Sugestão de reorganização de prioridades (metas típicas de estudante)

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
   - Foco em economia estudantil (restaurante universitário, transporte, moradia)

8. 📅 PLANO DE AÇÃO DETALHADO (200-250 palavras)
   - Semana 1: 3 tarefas específicas
   - Semana 2: 3 tarefas específicas
   - Semana 3: 3 tarefas específicas
   - Semana 4: 3 tarefas específicas
   - Cada tarefa com responsável e prazo

9. ⚠️ RISCOS E ALERTAS (150-200 palavras)
   - 5 riscos financeiros atuais típicos de estudantes
   - 5 sinais de alerta a monitorar
   - 5 armadilhas comuns a evitar (compras impulsivas, apps de delivery, assinaturas)
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
- CONSIDERE A REALIDADE DE ESTUDANTES DE PALMAS/TO

Exemplo de formato:
"💡 Ação Imediata: Reduzir gastos com alimentação em R$ 150/mês
   Valor estimado: R$ 1.800/ano
   Como: Priorizar restaurante universitário do IFTO/UFT (R$ 2-3), reduzir entregas"

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
  const systemPrompt = `Você é um CONSULTOR FINANCEIRO ESPECIALIZADO em ajudar ESTUDANTES UNIVERSITÁRIOS de Palmas, Tocantins, com mais de 20 anos de experiência em finanças pessoais.

CONTEXTO DO PÚBLICO:
- Estudantes universitários de Palmas/TO (IFTO, UFT, faculdades privadas)
- Renda típica: bolsa-auxílio (R$ 400-600/mês) ou trabalho informal
- Gastos principais: alimentação no campus, transporte coletivo, moradia (república/alojamento), materiais de estudo
- Metas comuns: notebook, viagem de formatura, reserva para emergências, cursos complementares
- Custo de vida de Palmas: alimentação mais barata no campus, transporte R$ 4,50 (urbano), aluguel de república R$ 300-500

Sua MISSÃO é fornecer uma análise financeira EXTREMAMENTE DETALHADA, PROFUNDAMENTE PERSONALIZADA e PRATICAMENTE APLICÁVEL para estudantes.

IMPORTANTE - SUA RESPOSTA DEVE SER:
- MUITO LONGA (mínimo 1000 palavras, idealmente 1500-2000)
- ALTAMENTE ESTRUTURADA em seções claras
- RICA EM DADOS NÚMERICOS E PORCENTAGENS
- COM EXEMPLOS PRÁTICOS E CENÁRIOS REAIS de estudantes
- COM AÇÕES ESPECÍFICAS E IMEDIATAS

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

1. 🔍 RESUMO EXECUTIVO (100-150 palavras)
   - Situação financeira atual em 3 frases
   - Principal problema identificado
   - Principal oportunidade

2. 📊 ANÁLISE DE RECEITAS (150-200 palavras)
   - Total de receitas e comparação com renda típica de estudante em Palmas
   - Fontes de renda (bolsa, trabalho familiar, freelances)
   - Tendência de receitas no período analisado
   - Recomendações para aumentar renda (estudante-friendly)

3. 💸 ANÁLISE DE DESPESAS (200-250 palavras)
   - Total de despesas e percentual por categoria
   - Top 3 categorias de gastos com valores absolutos e relativos
   - Identificação de gastos desnecessários ou excessivos para estudante
   - Comparação com período anterior
   - Onde é possível economizar imediatamente (foco em custo estudantil)

4. 🎯 ORÇAMENTO (150-200 palavras)
   - Status de cada orçamento definido
   - Categorias estouradas com valores excedentes
   - Categorias dentro do limite com margem
   - Ajustes necessários no orçamento estudantil

5. 🏆 METAS FINANCEIRAS (200-250 palavras)
   - Progresso de cada meta em % e valor
   - Tempo restante para cada meta
   - Se está no caminho certo (sim/não e por quê)
   - Ajustes necessários para atingir metas no prazo
   - Sugestão de reorganização de prioridades (metas típicas de estudante)

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
   - Foco em economia estudantil (restaurante universitário, transporte, moradia)

8. 📅 PLANO DE AÇÃO DETALHADO (200-250 palavras)
   - Semana 1: 3 tarefas específicas
   - Semana 2: 3 tarefas específicas
   - Semana 3: 3 tarefas específicas
   - Semana 4: 3 tarefas específicas
   - Cada tarefa com responsável e prazo

9. ⚠️ RISCOS E ALERTAS (150-200 palavras)
   - 5 riscos financeiros atuais típicos de estudantes
   - 5 sinais de alerta a monitorar
   - 5 armadilhas comuns a evitar (compras impulsivas, apps de delivery, assinaturas)
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
- CONSIDERE A REALIDADE DE ESTUDANTES DE PALMAS/TO

Exemplo de formato:
"💡 Ação Imediata: Reduzir gastos com alimentação em R$ 150/mês
   Valor estimado: R$ 1.800/ano
   Como: Priorizar restaurante universitário do IFTO/UFT (R$ 2-3), reduzir entregas"

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
 * Retorna os limites atuais do usuário (2 requisições totais por dia, somando todos os provedores)
 */
export async function getUserLimits(userId) {
  const geminiUserCount = await checkUserLimit(userId, 'gemini');
  const groqUserCount = await checkUserLimit(userId, 'groq');
  const totalUserCount = await checkTotalUserRequestCount(userId);

  // Calcular porcentagem de uso do TOTAL
  const totalUserPercentage = (totalUserCount / TOTAL_DAILY_LIMIT_PER_USER) * 100;

  return {
    combined: {
      userLimit: TOTAL_DAILY_LIMIT_PER_USER,
      userUsed: totalUserCount,
      userRemaining: Math.max(0, TOTAL_DAILY_LIMIT_PER_USER - totalUserCount),
      userPercentage: Math.min(100, totalUserPercentage),
      nearLimit: totalUserCount >= TOTAL_DAILY_LIMIT_PER_USER - 1,
      limitExceeded: totalUserCount >= TOTAL_DAILY_LIMIT_PER_USER,
    },
    gemini: {
      // No global quota exposure for Gemini; only per-user usage is shown
      userUsed: geminiUserCount,
      userPercentage: Math.min(100, geminiUserCount > 0 ? 100 : 0),
      available: !!genAI && totalUserCount < TOTAL_DAILY_LIMIT_PER_USER,
    },
    groq: {
      // No global quota exposure for Groq; only per-user usage is shown
      userUsed: groqUserCount,
      userPercentage: Math.min(100, groqUserCount > 0 ? 100 : 0),
      available: !!groqClient && totalUserCount < TOTAL_DAILY_LIMIT_PER_USER,
    },
  };
}

/**
 * Gera dica financeira usando o melhor provedor disponível
 */
export async function generateFinancialAdvice(userId, userMessage, conversationHistory = [], period = '30d') {
  try {
    
    
    

    
  

    const context = await getFinancialContext(userId, period);

    const contextText = `
Contexto Financeiro do Usuário:
- Período analisado: ${period} (${context.periodDays} dias)
- Saldo atual: R$ ${context.balance.toFixed(2)}
- Receitas no período: R$ ${context.totalIncome.toFixed(2)}
- Despesas no período: R$ ${context.totalExpense.toFixed(2)}
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

    // Provider priority is configurable via environment variable AI_PROVIDER_PRIORITY (comma-separated)
    const providerPriority = (env.aiProviderPriority || 'groq,gemini').split(',').map(p => p.trim()).filter(Boolean);
    let response = null;
    let usedProvider = null;

    function isRateLimitError(err) {
      if (!err) return false;
      if (err.status === 429) return true;
      if (err.response && err.response.status === 429) return true;
      const msg = String(err.message || err).toLowerCase();
      if (msg.includes('429') || msg.includes('too many requests') || msg.includes('rate limit')) return true;
      return false;
    }

    for (const candidate of providerPriority) {
      // Skip candidate if client not configured or per-user total limit reached
      if (candidate === 'groq' && !groqClient) continue;
      if (candidate === 'gemini' && !genAI) continue;

      // if user exhausted total daily quota, don't attempt providers
      const totalUserCount = await checkTotalUserRequestCount(userId);
      if (totalUserCount >= TOTAL_DAILY_LIMIT_PER_USER) break;

      try {
        if (candidate === 'groq') {
          response = await generateWithGroq(contextText, historyText, userMessage);
        } else if (candidate === 'gemini') {
          response = await generateWithGemini(contextText, historyText, userMessage);
        }

        usedProvider = candidate;
        break; // success
      } catch (err) {
        // If rate limited by provider, log and try next provider. For non-rate errors
        // also try next provider to be resilient.
        console.warn(`[FinCash AI] Provider ${candidate} failed:`, err?.message || err);
        if (isRateLimitError(err)) {
          console.warn(`[FinCash AI] Provider ${candidate} reported rate limit (429). Trying next provider if available.`);
        }
        // continue loop to try next provider
      }
    }

    if (!response) {
      // All providers failed — return generic advice
      return getGenericAdvice();
    }

    // Salvar no cache (1 hora para respostas comuns, 24h para análises completas)
    const ttl = userMessage.includes('análise completa') || userMessage.includes('visão geral') ? 86400 : 3600;

    // Incrementar contador por usuário apenas para o provedor que foi usado
    if (usedProvider) {
      await checkAndIncrementRequestCount(userId, usedProvider);

      // Incrementar contador global para provedores pagos (registro apenas)
      await checkAndIncrementRequestCount('global', usedProvider);
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
