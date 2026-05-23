import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';

/**
 * Suggest a category for a transaction based on its title and description
 * Uses the existing AI infrastructure to analyze the transaction content
 */
export async function suggestCategory(userId, transactionData) {
  try {
    const { title, description, type } = transactionData;
    
    // Get user's categories
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { isDefault: true }],
        type: type // Match the transaction type
      },
      orderBy: { name: 'asc' }
    });

    if (categories.length === 0) {
      logger.warn('No categories available for categorization', { userId, type });
      return null;
    }

    // Build category context for AI
    const categoryContext = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      isDefault: cat.isDefault
    }));

    // Create a simple text-based categorization prompt
    const textToAnalyze = `${title} ${description || ''}`.trim();
    
    // Simple keyword matching for now (can be enhanced with AI)
    const suggestedCategory = findCategoryByKeywords(textToAnalyze, categories, type);
    
    if (suggestedCategory) {
      logger.info('Category suggested', { 
        userId, 
        transactionTitle: title,
        suggestedCategory: suggestedCategory.name,
        confidence: suggestedCategory.confidence 
      });
      
      return {
        categoryId: suggestedCategory.id,
        categoryName: suggestedCategory.name,
        confidence: suggestedCategory.confidence,
        method: 'keyword_matching'
      };
    }

    // If no keyword match, return the most used category for this user
    const mostUsedCategory = await getMostUsedCategory(userId, type);
    
    if (mostUsedCategory) {
      logger.info('Using most used category as fallback', { 
        userId, 
        categoryName: mostUsedCategory.name 
      });
      
      return {
        categoryId: mostUsedCategory.id,
        categoryName: mostUsedCategory.name,
        confidence: 0.3,
        method: 'frequency_fallback'
      };
    }

    // Final fallback to first default category
    const defaultCategory = categories.find(cat => cat.isDefault) || categories[0];
    
    return {
      categoryId: defaultCategory.id,
      categoryName: defaultCategory.name,
      confidence: 0.2,
      method: 'default_fallback'
    };

  } catch (error) {
    logger.error('Error in category suggestion', { error: error.message, userId });
    throw error;
  }
}

/**
 * Find category by keyword matching
 */
function findCategoryByKeywords(text, categories, type) {
  const keywords = {
    income: {
      'Salário': ['salário', 'salary', 'pagamento', 'payment', 'honorário', 'honorarios'],
      'Freelance': ['freelance', 'projeto', 'consultoria', 'consulting'],
      'Investimento': ['investimento', 'investment', 'rendimento', 'dividendo', 'juros'],
      'Venda': ['venda', 'sale', 'revenda', 'mercado'],
      'Presente': ['presente', 'gift', 'bônus', 'bonus']
    },
    expense: {
      'Alimentação': ['alimentação', 'food', 'restaurante', 'restaurant', 'mercado', 'supermercado', 'lanche', 'lunch'],
      'Transporte': ['transporte', 'transport', 'uber', 'taxi', 'combustível', 'gasolina', 'ônibus', 'bus', 'metro'],
      'Moradia': ['moradia', 'housing', 'aluguel', 'rent', 'luz', 'electricidade', 'água', 'water', 'internet'],
      'Saúde': ['saúde', 'health', 'farmácia', 'pharmacy', 'médico', 'doctor', 'hospital'],
      'Educação': ['educação', 'education', 'curso', 'course', 'livro', 'book', 'escola', 'school'],
      'Lazer': ['lazer', 'leisure', 'cinema', 'movie', 'viagem', 'travel', 'entretenimento', 'entertainment'],
      'Compras': ['compras', 'shopping', 'roupa', 'clothing', 'calçado', 'shoes'],
      'Outros': ['outro', 'other', 'diversos', 'misc']
    }
  };

  const typeKeywords = keywords[type] || {};
  const lowerText = text.toLowerCase();

  let bestMatch = null;
  let highestScore = 0;

  for (const [categoryName, categoryKeywords] of Object.entries(typeKeywords)) {
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) continue;

    let score = 0;
    for (const keyword of categoryKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        ...category,
        confidence: Math.min(score / categoryKeywords.length, 0.95)
      };
    }
  }

  return bestMatch;
}

/**
 * Get the most used category for a user
 */
async function getMostUsedCategory(userId, type) {
  const result = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type
    },
    _count: {
      categoryId: true
    },
    orderBy: {
      _count: {
        categoryId: 'desc'
      }
    },
    take: 1
  });

  if (result.length === 0) return null;

  const category = await prisma.category.findUnique({
    where: { id: result[0].categoryId }
  });

  return category;
}

/**
 * Batch categorize existing uncategorized or poorly categorized transactions
 */
export async function batchCategorizeTransactions(userId, options = {}) {
  try {
    const { limit = 50, type } = options;
    
    logger.info('Starting batch categorization', { userId, limit, type });

    // Get transactions to categorize (recent ones without clear categorization)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        ...(type && { type }),
        // You might want to add criteria for "poorly categorized" transactions
        // For now, we'll just get recent transactions
      },
      include: { category: true },
      orderBy: { transactionDate: 'desc' },
      take: limit
    });

    const results = [];
    
    for (const transaction of transactions) {
      const suggestion = await suggestCategory(userId, {
        title: transaction.title,
        description: transaction.description,
        type: transaction.type
      });

      if (suggestion && suggestion.categoryId !== transaction.categoryId) {
        results.push({
          transactionId: transaction.id,
          transactionTitle: transaction.title,
          currentCategory: transaction.category.name,
          suggestedCategory: suggestion.categoryName,
          confidence: suggestion.confidence,
          method: suggestion.method
        });
      }
    }

    logger.info('Batch categorization completed', { 
      userId, 
      processed: transactions.length,
      suggestions: results.length 
    });

    return {
      processed: transactions.length,
      suggestions: results
    };

  } catch (error) {
    logger.error('Error in batch categorization', { error: error.message, userId });
    throw error;
  }
}

/**
 * Auto-categorize a transaction (apply the suggestion)
 */
export async function autoCategorizeTransaction(userId, transactionId) {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: { category: true }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const suggestion = await suggestCategory(userId, {
      title: transaction.title,
      description: transaction.description,
      type: transaction.type
    });

    if (!suggestion) {
      return { success: false, message: 'No category suggestion available' };
    }

    // Only update if confidence is high enough
    if (suggestion.confidence < 0.5) {
      return { 
        success: false, 
        message: 'Low confidence suggestion',
        suggestion 
      };
    }

    // Update the transaction
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: { categoryId: suggestion.categoryId },
      include: { category: true }
    });

    logger.info('Transaction auto-categorized', { 
      userId, 
      transactionId,
      oldCategory: transaction.category.name,
      newCategory: updated.category.name,
      confidence: suggestion.confidence 
    });

    return {
      success: true,
      transaction: updated,
      suggestion
    };

  } catch (error) {
    logger.error('Error in auto categorization', { error: error.message, userId, transactionId });
    throw error;
  }
}