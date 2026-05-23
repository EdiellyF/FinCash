import { prisma } from '../config/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// Configuração Gemini
const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

// Configuração GROQ
const groqClient = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;

// Configuração Ollama (local)
const OLLAMA_API_URL = env.ollamaApiUrl || 'http://localhost:11434';
const OLLAMA_MODEL = env.ollamaModel || 'llama3.2';

// Modelos disponíveis
const MODELS = {
  gemini: 'gemini-1.5-pro',
  groq: 'llama-3.3-70b-versatile',
  ollama: env.ollamaModel || 'llama3.2',
};

/**
 * Extrai transações a partir de texto livre usando IA
 * Exemplo: "meu salário é 1800, gastei 300 com alimentação, 150 com transporte"
 */
export async function extractTransactionsFromText(userId, text, options = {}) {
  try {
    logger.info('Transaction extraction requested', { userId, textLength: text.length });

    // Obter categorias do usuário para contexto
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { isDefault: true }],
      },
      orderBy: { name: 'asc' }
    });

    // Construir contexto das categorias
    const categoryContext = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      isDefault: cat.isDefault
    }));

    // Criar prompt para extração
    const prompt = buildExtractionPrompt(text, categoryContext);

    // Selecionar melhor provedor e gerar resposta
    const provider = await selectBestProvider(userId);
    const extractedData = await generateWithProvider(provider, prompt);

    // Processar e validar as transações extraídas
    const transactions = processExtractedData(extractedData, categories);

    logger.info('Transactions extracted successfully', { 
      userId, 
      extractedCount: transactions.length,
      provider 
    });

    return {
      transactions,
      provider,
      confidence: calculateConfidence(transactions)
    };

  } catch (error) {
    logger.error('Error in transaction extraction', { error: error.message, userId });
    throw error;
  }
}

/**
 * Salva transações extraídas no banco de dados
 */
export async function saveExtractedTransactions(userId, transactions, options = {}) {
  const { autoSave = false, transactionDate = new Date() } = options;

  try {
    logger.info('Saving extracted transactions', { userId, count: transactions.length });

    if (!autoSave) {
      return { saved: false, transactions };
    }

    const savedTransactions = [];

    for (const tx of transactions) {
      try {
        // Encontrar categoria correspondente
        const category = await findMatchingCategory(tx.category, tx.type, userId);

        if (!category) {
          logger.warn('Category not found for transaction', { category: tx.category, type: tx.type });
          continue;
        }

        const transaction = await prisma.transaction.create({
          data: {
            userId,
            categoryId: category.id,
            type: tx.type,
            title: tx.title || tx.description,
            description: tx.description,
            amount: tx.amount,
            transactionDate: new Date(transactionDate)
          }
        });

        savedTransactions.push(transaction);
        logger.info('Transaction saved', { transactionId: transaction.id, title: tx.title });

      } catch (error) {
        logger.error('Error saving individual transaction', { error: error.message, title: tx.title });
      }
    }

    logger.info('Batch transaction save completed', { 
      userId, 
      requested: transactions.length,
      saved: savedTransactions.length 
    });

    return {
      saved: true,
      transactions: savedTransactions,
      totalRequested: transactions.length,
      totalSaved: savedTransactions.length
    };

  } catch (error) {
    logger.error('Error in batch transaction save', { error: error.message, userId });
    throw error;
  }
}

/**
 * Constrói o prompt para extração de transações
 */
function buildExtractionPrompt(text, categories) {
  const categoryList = categories
    .map(cat => `- ${cat.name} (${cat.type === 'income' ? 'Receita' : 'Despesa'})`)
    .join('\n');

  return `Você é um especialista em extração de informações financeiras. Sua tarefa é extrair transações financeiras de texto livre.

CATEGORIAS DISPONÍVEIS:
${categoryList}

REGRAS DE EXTRAÇÃO:
1. Extraia TODAS as transações mencionadas no texto
2. Identifique se é RECEITA (income) ou DESPESA (expense)
3. Atribua a categoria mais apropriada da lista
4. Extraia o valor numérico (considere R$, reais, ou apenas números)
5. Crie um título descritivo para cada transação
6. Se a data não for especificada, use a data atual
7. Retorne APENAS JSON válido, sem texto adicional

FORMATO DE RESPOSTA (JSON):
{
  "transactions": [
    {
      "type": "income|expense",
      "amount": number,
      "category": "nome exato da categoria",
      "title": "título descritivo",
      "description": "descrição detalhada ou contexto"
    }
  ]
}

TEXTO PARA ANALISAR:
${text}

Responda APENAS com o JSON, sem markdown ou texto adicional:`;
}

/**
 * Gera resposta usando o provedor selecionado
 */
async function generateWithProvider(provider, prompt) {
  try {
    switch (provider) {
      case 'gemini':
        return await generateWithGemini(prompt);
      case 'groq':
        return await generateWithGroq(prompt);
      case 'ollama':
        return await generateWithOllama(prompt);
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  } catch (error) {
    logger.error(`Error generating with ${provider}`, { error: error.message });
    throw error;
  }
}

/**
 * Gera com Gemini
 */
async function generateWithGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: MODELS.gemini });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return parseJsonResponse(text);
}

/**
 * Gera com GROQ
 */
async function generateWithGroq(prompt) {
  const response = await groqClient.chat.completions.create({
    model: MODELS.groq,
    messages: [
      { role: 'system', content: 'Você é um especialista em extração de dados financeiros. Responda apenas com JSON válido.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 1000
  });

  const text = response.choices[0].message.content;
  return parseJsonResponse(text);
}

/**
 * Gera com Ollama
 */
async function generateWithOllama(prompt) {
  const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false
    })
  });

  const data = await response.json();
  const text = data.response;
  return parseJsonResponse(text);
}

/**
 * Faz parse da resposta JSON removendo markdown ou texto adicional
 */
function parseJsonResponse(text) {
  // Remover markdown code blocks se existirem
  let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Remover texto antes do primeiro { e depois do último }
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleanText);
}

/**
 * Processa os dados extraídos pela IA
 */
function processExtractedData(data, categories) {
  if (!data || !data.transactions || !Array.isArray(data.transactions)) {
    return [];
  }

  return data.transactions.map(tx => {
    // Validar e normalizar tipo
    const type = tx.type === 'income' ? 'income' : 'expense';
    
    // Validar valor
    const amount = parseFloat(tx.amount) || 0;
    
    // Validar categoria
    const validCategory = categories.find(cat => 
      cat.name.toLowerCase() === tx.category?.toLowerCase()
    );

    return {
      type,
      amount,
      category: validCategory ? validCategory.name : tx.category || 'Outros',
      categoryId: validCategory ? validCategory.id : null,
      title: tx.title || tx.description || 'Transação',
      description: tx.description || ''
    };
  }).filter(tx => tx.amount > 0); // Remover transações com valor inválido
}

/**
 * Encontra categoria correspondente por nome e tipo
 */
async function findMatchingCategory(categoryName, type, userId) {
  const category = await prisma.category.findFirst({
    where: {
      name: {
        equals: categoryName,
        mode: 'insensitive'
      },
      type: type,
      OR: [
        { userId },
        { isDefault: true }
      ]
    }
  });

  return category;
}

/**
 * Seleciona o melhor provedor disponível
 */
async function selectBestProvider(userId) {
  // Tentar GROQ primeiro
  if (groqClient) return 'groq';
  
  // Tentar Gemini
  if (genAI) return 'gemini';
  
  // Fallback para Ollama
  return 'ollama';
}

/**
 * Calcula confiança na extração baseada na quantidade e qualidade dos dados
 */
function calculateConfidence(transactions) {
  if (transactions.length === 0) return 0;
  
  const withValidCategory = transactions.filter(tx => tx.categoryId).length;
  const withValidAmount = transactions.filter(tx => tx.amount > 0).length;
  
  const categoryScore = withValidCategory / transactions.length;
  const amountScore = withValidAmount / transactions.length;
  
  return (categoryScore + amountScore) / 2;
}