import { prisma } from '../config/db.js';
import pdfParse from 'pdf-parse';
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
  const { isBankStatement = false } = options;

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
    const prompt = buildExtractionPrompt(text, categoryContext, isBankStatement);

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
/**
 * Extrai transacoes de extratos bancarios ou faturas em PDF.
 * Primeiro tenta texto com pdf-parse; se o PDF parecer escaneado, usa Gemini com inlineData.
 */
export async function extractTransactionsFromPDF(userId, pdfBuffer, options = {}) {
  try {
    logger.info('PDF transaction extraction requested', { userId, fileSize: pdfBuffer.length });

    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { isDefault: true }],
      },
      orderBy: { name: 'asc' }
    });

    const categoryContext = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      isDefault: cat.isDefault
    }));

    let extractedText = '';
    try {
      const parsedPdf = await pdfParse(pdfBuffer);
      extractedText = parsedPdf.text?.trim() || '';
    } catch (error) {
      logger.warn('Could not parse PDF text, falling back to Gemini inline PDF', {
        userId,
        error: error.message
      });
    }

    const hasReadableText = extractedText.length >= (options.minTextLength || 80);

    let provider;
    let extractedData;

    if (hasReadableText) {
      const prompt = buildExtractionPrompt(extractedText, categoryContext, true);
      provider = await selectBestProvider(userId);
      extractedData = await generateWithProvider(provider, prompt);
    } else {
      if (!genAI) {
        throw new Error('O PDF parece ser escaneado ou imagem. Configure o Gemini para analisar PDFs sem texto legivel.');
      }

      const prompt = buildExtractionPrompt('', categoryContext, true);
      provider = 'gemini-vision';
      extractedData = await generateWithGeminiPDF(pdfBuffer.toString('base64'), prompt);
    }

    const transactions = processExtractedData(extractedData, categories);

    logger.info('PDF transactions extracted successfully', {
      userId,
      extractedCount: transactions.length,
      provider,
      textLength: extractedText.length
    });

    return {
      transactions,
      provider,
      confidence: calculateConfidence(transactions),
      source: hasReadableText ? 'pdf-text' : 'pdf-vision'
    };
  } catch (error) {
    logger.error('Error in PDF transaction extraction', { error: error.message, userId });
    throw error;
  }
}

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
            transactionDate: tx.transactionDate ? new Date(tx.transactionDate) : new Date(transactionDate)
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
function buildExtractionPrompt(text, categories, isBankStatement = false) {
  const categoryList = categories
    .map(cat => `- ${cat.name} (${cat.type === 'income' ? 'Receita' : 'Despesa'})`)
    .join('\n');

  const contextInstruction = isBankStatement
    ? 'Voce esta processando um PDF de extrato bancario ou fatura de cartao de credito. O conteudo pode ter ruido: saldos, totais, cabecalhos, rodapes, dados de agencia/conta e avisos legais.'
    : 'Voce esta processando texto livre digitado pelo usuario.';

  const bankRules = isBankStatement ? `
REGRAS ESPECIFICAS PARA EXTRATOS E FATURAS:
1. IGNORE COMPLETAMENTE saldos, totais, limites, cabecalhos do banco, dados de agencia/conta, numero do cartao, avisos legais, rodapes e PAGAMENTOS DE FATURA.
2. Extraia APENAS linhas que representem transacoes reais de consumo.
3. Em extratos bancarios: "C", "Credito", "Cred" ou entrada positiva = income; "D", "Debito", "Deb", saque, pagamento, tarifa, pix enviado e compra = expense.
4. Em faturas de cartao: APENAS compras = expense. IGNORE pagamentos de fatura, estornos, ajustes de credito e cashback.
5. Valores podem vir no formato brasileiro, como "1.234,56" ou "1234,56". Converta SEMPRE para numero JSON em formato americano, como 1234.56.
6. Extraia a data da transacao. Se vier como DD/MM, DD-MM ou "07 MAI", use o ano indicado no extrato/fatura. Se nao houver ano confiavel, use null.
7. Limpe o estabelecimento no title. Exemplo: "*STON*       IFOOD" vira title "Ifood" e description "*STON*".
` : '';

  return `Voce e um especialista em extracao de informacoes financeiras.
${contextInstruction}

CATEGORIAS DISPONÍVEIS:
${categoryList}

REGRAS GERAIS DE EXTRACAO:
1. Extraia TODAS as transacoes financeiras reais mencionadas.
2. Identifique se é RECEITA (income) ou DESPESA (expense).
3. Atribua a categoria mais apropriada da lista.
4. Extraia o valor numerico exato.
5. O 'title' DEVE SER O NOME DO ESTABELECIMENTO ou origem da transacao contido no texto. Nao invente nomes genericos.
6. Use a 'description' para dados adicionais do texto, como parcela, codigo, forma de pagamento ou trecho original relevante.
${bankRules}
7. Retorne APENAS JSON valido, sem texto adicional e sem markdown.

FORMATO DE RESPOSTA (JSON):
{
  "transactions": [
    {
      "type": "income|expense",
      "amount": number,
      "category": "nome exato da categoria",
      "title": "nome do estabelecimento da transação (ex: Shopee, Drogasil)",
      "description": "dados adicionais contidos na linha (ex: 07 MAI, Parcela 3/3)",
      "transactionDate": "YYYY-MM-DD ou null"
    }
  ]
}

TEXTO PARA ANALISAR:
${text || 'O conteudo esta no arquivo PDF anexado.'}

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

async function generateWithGeminiPDF(pdfBase64, prompt) {
  const model = genAI.getGenerativeModel({ model: MODELS.gemini });
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: pdfBase64,
        mimeType: 'application/pdf'
      }
    }
  ]);

  return parseJsonResponse(result.response.text());
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
    max_tokens: 4000
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
    const amount = Number.parseFloat(tx.amount) || 0;
    
    // Validar categoria
    const validCategory = categories.find(cat => 
      cat.name.toLowerCase() === tx.category?.toLowerCase()
    );

    const transactionDate = parseTransactionDate(tx.transactionDate);

    return {
      type,
      amount,
      category: validCategory ? validCategory.name : tx.category || 'Outros',
      categoryId: validCategory ? validCategory.id : null,
      title: tx.title || tx.description || 'Transação',
      description: tx.description || '',
      transactionDate
    };
  }).filter(tx => tx.amount > 0); // Remover transações com valor inválido
}

function parseTransactionDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
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
