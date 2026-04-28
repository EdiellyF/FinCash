import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

const prisma = new PrismaClient();


const OLLAMA_API_URL = env.ollamaApiUrl || 'http://localhost:11434';
const OLLAMA_MODEL = env.ollamaModel || 'llama3.2';
const DAILY_LIMIT = 50;


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


async function checkAndIncrementRequestCount(provider) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.requestLog.findUnique({
    where: {
      date_provider: {
        date: today,
        provider,
      },
    },
  });

  if (!log) {
    await prisma.requestLog.create({
      data: {
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


async function getProvider() {
 
  return 'ollama';
}


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
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API do Ollama: ${response.statusText}`);
    }

    const data = await response.json();
    
   
    await checkAndIncrementRequestCount('ollama');

    return data.response;
  } catch (error) {
    console.error('Erro ao gerar dica financeira:', error);
    
   
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
