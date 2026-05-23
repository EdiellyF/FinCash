import PDFDocument from 'pdfkit';


export function buildAdvancedTransactionsPdf({ title, rows, options = {} }) {
  const {
    includeCharts = false,
    includeSummary = true,
    customColors = {
      header: '#2c3e50',
      income: '#27ae60',
      expense: '#e74c3c',
      text: '#34495e'
    },
    footer = 'Gerado por FinCash'
  } = options;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

 
  const getColor = (colorName) => customColors[colorName] || colorName;


  doc.fillColor(getColor('header'))
     .fontSize(24)
     .text(title, { align: 'center' });
  
  doc.moveDown();
  
  // Add timestamp
  doc.fillColor('#7f8c8d')
     .fontSize(10)
     .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
  
  doc.moveDown(2);

  // Summary section
  if (includeSummary && rows.length > 0) {
    const totalIncome = rows
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpense = rows
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const balance = totalIncome - totalExpense;

    doc.fillColor(getColor('header'))
       .fontSize(14)
       .text('Resumo Financeiro', { underline: true });
    
    doc.moveDown(0.5);
    
    const summaryData = [
      { label: 'Total de Receitas', value: `R$ ${totalIncome.toFixed(2)}`, color: getColor('income') },
      { label: 'Total de Despesas', value: `R$ ${totalExpense.toFixed(2)}`, color: getColor('expense') },
      { label: 'Saldo', value: `R$ ${balance.toFixed(2)}`, color: balance >= 0 ? getColor('income') : getColor('expense') },
      { label: 'Transações', value: rows.length.toString(), color: getColor('text') }
    ];

    doc.fontSize(11);
    summaryData.forEach(item => {
      doc.fillColor('#7f8c8d')
         .text(item.label, { continued: true })
         .fillColor(item.color)
         .text(`: ${item.value}`, { align: 'right' });
    });

    doc.moveDown(1.5);
  }

  // Transactions table
  if (rows.length > 0) {
    doc.fillColor(getColor('header'))
       .fontSize(16)
       .text('Transações', { underline: true });
    
    doc.moveDown(1);

    // Table header
    const tableHeader = ['Data', 'Título', 'Categoria', 'Tipo', 'Valor'];
    const columnWidths = [80, 150, 100, 60, 80];
    
    doc.fontSize(9);
    doc.fillColor('#7f8c8d');
    
    tableHeader.forEach((header, i) => {
      doc.text(header, doc.x, doc.y, { width: columnWidths[i] });
      doc.x += columnWidths[i];
    });
    
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#bdc3c7');
    doc.moveDown(0.5);

    // Table rows
    rows.forEach((item, index) => {
      const type = item.type === 'income' ? 'Receita' : 'Despesa';
      const color = item.type === 'income' ? getColor('income') : getColor('expense');
      
      const row = [
        new Date(item.transactionDate).toLocaleDateString('pt-BR'),
        item.title.substring(0, 20) + (item.title.length > 20 ? '...' : ''),
        item.category?.name || 'Sem categoria',
        type,
        `R$ ${Number(item.amount).toFixed(2)}`
      ];

      doc.fillColor(index % 2 === 0 ? '#ffffff' : '#f8f9fa');
      doc.rect(50, doc.y - 4, 495, 14).fill();
      
      doc.fillColor(color);
      row.forEach((text, i) => {
        doc.text(text, doc.x, doc.y, { width: columnWidths[i] });
        doc.x += columnWidths[i];
      });
      
      doc.moveDown(0.3);
    });
  } else {
    doc.fillColor('#7f8c8d')
       .fontSize(12)
       .text('Nenhuma transação encontrada.', { align: 'center' });
  }

  // Footer
  doc.fillColor('#95a5a6')
     .fontSize(8)
     .text(footer, 50, doc.page.height - 30, { align: 'center' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Build PDF for goals
 */
export function buildGoalsPdf({ title, rows, options = {} }) {
  const {
    includeProgress = true,
    customColors = {
      header: '#2c3e50',
      accent: '#3498db',
      text: '#34495e'
    }
  } = options;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Header
  doc.fillColor(customColors.header)
     .fontSize(24)
     .text(title, { align: 'center' });
  
  doc.moveDown();
  doc.fillColor('#7f8c8d')
     .fontSize(10)
     .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
  
  doc.moveDown(2);

  // Goals list
  if (rows.length > 0) {
    rows.forEach((goal, index) => {
      const progress = Number(goal.targetAmount) > 0 
        ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 
        : 0;

      // Goal card
      doc.fillColor('#f8f9fa')
         .roundedRect(50, doc.y, 495, 80, 5)
         .fill();
      
      doc.fillColor(customColors.header)
         .fontSize(14)
         .text(goal.title, 65, doc.y - 70);
      
      doc.fillColor('#7f8c8d')
         .fontSize(10)
         .text(`Prazo: ${goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}`, 65, doc.y - 55);
      
      // Progress bar
      const barWidth = 400;
      const barHeight = 8;
      const filledWidth = (progress / 100) * barWidth;
      
      doc.fillColor('#e0e0e0')
         .rect(65, doc.y - 35, barWidth, barHeight)
         .fill();
      
      doc.fillColor(customColors.accent)
         .rect(65, doc.y - 35, filledWidth, barHeight)
         .fill();
      
      // Progress text
      doc.fillColor(customColors.text)
         .fontSize(12)
         .text(`${progress.toFixed(1)}% concluído`, 65, doc.y - 25);
      
      // Amounts
      doc.fillColor(customColors.accent)
         .fontSize(12)
         .text(`R$ ${Number(goal.currentAmount).toFixed(2)} de R$ ${Number(goal.targetAmount).toFixed(2)}`, 200, doc.y - 25);
      
      doc.moveDown(2);
    });
  } else {
    doc.fillColor('#7f8c8d')
       .fontSize(12)
       .text('Nenhuma meta encontrada.', { align: 'center' });
  }

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Build PDF for budgets
 */
export function buildBudgetsPdf({ title, rows, month, year, options = {} }) {
  const {
    customColors = {
      header: '#2c3e50',
      warning: '#f39c12',
      danger: '#e74c3c',
      success: '#27ae60',
      text: '#34495e'
    }
  } = options;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Header
  doc.fillColor(customColors.header)
     .fontSize(24)
     .text(title, { align: 'center' });
  
  doc.moveDown();
  doc.fillColor('#7f8c8d')
     .fontSize(12)
     .text(`Período: ${month}/${year}`, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
  
  doc.moveDown(2);

  // Budgets
  if (rows.length > 0) {
    let totalLimit = 0;
    let totalSpent = 0;

    rows.forEach((budget, index) => {
      const limit = Number(budget.limitAmount);
      const spent = budget.spent ? Number(budget.spent) : 0;
      const remaining = limit - spent;
      const percentage = (spent / limit) * 100;

      totalLimit += limit;
      totalSpent += spent;

      // Determine status color
      let statusColor = customColors.success;
      if (percentage > 100) statusColor = customColors.danger;
      else if (percentage > 80) statusColor = customColors.warning;

      // Budget card
      doc.fillColor('#f8f9fa')
         .roundedRect(50, doc.y, 495, 70, 5)
         .fill();
      
      doc.fillColor(customColors.header)
         .fontSize(14)
         .text(budget.category?.name || 'Sem categoria', 65, doc.y - 60);
      
      // Progress bar
      const barWidth = 350;
      const barHeight = 8;
      const filledWidth = Math.min((percentage / 100) * barWidth, barWidth);
      
      doc.fillColor('#e0e0e0')
         .rect(65, doc.y - 40, barWidth, barHeight)
         .fill();
      
      doc.fillColor(statusColor)
         .rect(65, doc.y - 40, filledWidth, barHeight)
         .fill();
      
      // Amounts and percentage
      doc.fillColor(statusColor)
         .fontSize(11)
         .text(`${percentage.toFixed(1)}%`, 65, doc.y - 28);
      
      doc.fillColor(customColors.text)
         .fontSize(11)
         .text(`R$ ${spent.toFixed(2)} / R$ ${limit.toFixed(2)}`, 120, doc.y - 28);
      
      doc.fillColor(remaining >= 0 ? customColors.success : customColors.danger)
         .text(`Restante: R$ ${remaining.toFixed(2)}`, 300, doc.y - 28);
      
      doc.moveDown(2);
    });

    // Total summary
    doc.fillColor(customColors.header)
       .fontSize(14)
       .text('Resumo Total', { underline: true });
    
    doc.moveDown(0.5);
    
    const totalRemaining = totalLimit - totalSpent;
    
    doc.fillColor(customColors.text)
       .fontSize(12)
       .text(`Limite Total: R$ ${totalLimit.toFixed(2)}`, 65, doc.y);
    doc.text(`Gasto Total: R$ ${totalSpent.toFixed(2)}`, 65, doc.y + 15);
    doc.fillColor(totalRemaining >= 0 ? customColors.success : customColors.danger)
       .text(`Restante Total: R$ ${totalRemaining.toFixed(2)}`, 65, doc.y + 30);
  } else {
    doc.fillColor('#7f8c8d')
       .fontSize(12)
       .text('Nenhum orçamento encontrado.', { align: 'center' });
  }

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}