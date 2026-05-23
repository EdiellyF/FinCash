import { stringify } from 'csv-stringify/sync';

export function transactionsToAdvancedCsv(rows, options = {}) {
  const {
    fields = ['title', 'description', 'type', 'category', 'amount', 'date'],
    separator = ',',
    includeHeaders = true,
    formatDate = 'pt-BR'
  } = options;


  const fieldMapping = {
    title: (row) => row.title,
    description: (row) => row.description || '',
    type: (row) => row.type === 'income' ? 'Receita' : 'Despesa',
    category: (row) => row.category?.name || '',
    amount: (row) => Number(row.amount).toFixed(2),
    date: (row) => formatDateInLocale(row.transactionDate, formatDate),
    categoryColor: (row) => row.category?.color || '',
    categoryId: (row) => row.categoryId,
    transactionId: (row) => row.id,
    createdAt: (row) => formatDateInLocale(row.createdAt, formatDate)
  };


  const mappedRows = rows.map(row => {
    const mapped = {};
    fields.forEach(field => {
      if (fieldMapping[field]) {
  
        const headerMap = {
          title: 'Título',
          description: 'Descrição',
          type: 'Tipo',
          category: 'Categoria',
          amount: 'Valor',
          date: 'Data',
          categoryColor: 'Cor da Categoria',
          categoryId: 'ID da Categoria',
          transactionId: 'ID da Transação',
          createdAt: 'Criado em'
        };
        
        mapped[headerMap[field] || field] = fieldMapping[field](row);
      }
    });
    return mapped;
  });

  return stringify(mappedRows, {
    header: includeHeaders,
    delimiter: separator,
    quoted: true,
    quotedString: true
  });
}

/**
 * Enhanced CSV exporter for goals
 */
export function goalsToAdvancedCsv(rows, options = {}) {
  const {
    fields = ['title', 'targetAmount', 'currentAmount', 'progress', 'deadline'],
    separator = ',',
    includeHeaders = true
  } = options;

  const fieldMapping = {
    title: (row) => row.title,
    targetAmount: (row) => Number(row.targetAmount).toFixed(2),
    currentAmount: (row) => Number(row.currentAmount).toFixed(2),
    progress: (row) => {
      const target = Number(row.targetAmount);
      const current = Number(row.currentAmount);
      return target > 0 ? ((current / target) * 100).toFixed(2) + '%' : '0%';
    },
    deadline: (row) => row.deadline ? formatDateInLocale(row.deadline, 'pt-BR') : '',
    createdAt: (row) => formatDateInLocale(row.createdAt, 'pt-BR'),
    goalId: (row) => row.id
  };

  const headerMap = {
    title: 'Meta',
    targetAmount: 'Valor Alvo',
    currentAmount: 'Valor Atual',
    progress: 'Progresso',
    deadline: 'Prazo',
    createdAt: 'Criado em',
    goalId: 'ID da Meta'
  };

  const mappedRows = rows.map(row => {
    const mapped = {};
    fields.forEach(field => {
      if (fieldMapping[field]) {
        mapped[headerMap[field] || field] = fieldMapping[field](row);
      }
    });
    return mapped;
  });

  return stringify(mappedRows, {
    header: includeHeaders,
    delimiter: separator,
    quoted: true,
    quotedString: true
  });
}


export function budgetsToAdvancedCsv(rows, options = {}) {
  const {
    fields = ['category', 'month', 'year', 'limitAmount', 'spent'],
    separator = ',',
    includeHeaders = true
  } = options;

  const fieldMapping = {
    category: (row) => row.category?.name || '',
    month: (row) => row.month,
    year: (row) => row.year,
    limitAmount: (row) => Number(row.limitAmount).toFixed(2),
    spent: (row) => row.spent ? Number(row.spent).toFixed(2) : '0.00',
    remaining: (row) => {
      const limit = Number(row.limitAmount);
      const spent = row.spent ? Number(row.spent) : 0;
      return (limit - spent).toFixed(2);
    },
    budgetId: (row) => row.id
  };

  const headerMap = {
    category: 'Categoria',
    month: 'Mês',
    year: 'Ano',
    limitAmount: 'Limite',
    spent: 'Gasto',
    remaining: 'Restante',
    budgetId: 'ID do Orçamento'
  };

  const mappedRows = rows.map(row => {
    const mapped = {};
    fields.forEach(field => {
      if (fieldMapping[field]) {
        mapped[headerMap[field] || field] = fieldMapping[field](row);
      }
    });
    return mapped;
  });

  return stringify(mappedRows, {
    header: includeHeaders,
    delimiter: separator,
    quoted: true,
    quotedString: true
  });
}

/**
 * Helper function to format dates in different locales
 */
function formatDateInLocale(date, locale) {
  if (!date) return '';
  
  const d = new Date(date);
  if (locale === 'pt-BR') {
    return d.toLocaleDateString('pt-BR');
  } else if (locale === 'en-US') {
    return d.toLocaleDateString('en-US');
  } else if (locale === 'ISO') {
    return d.toISOString().split('T')[0];
  }
  
  return d.toLocaleDateString('pt-BR');
}