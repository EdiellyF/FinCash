import { getCategorySummary, getMonthlyTransactions } from '../services/reportService.js';
import { buildTransactionsPdf } from '../utils/pdfExporter.js';
import { 
  buildAdvancedTransactionsPdf,
  buildGoalsPdf,
  buildBudgetsPdf
} from '../utils/advancedPdfExporter.js';
import { 
  transactionsToAdvancedCsv,
  goalsToAdvancedCsv,
  budgetsToAdvancedCsv
} from '../utils/advancedCsvExporter.js';
import { transactionsToCsv } from '../utils/csvExporter.js';
import { ok } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';
import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';

export async function monthly(req, res) {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!month || !year) {
    throw new ValidationError('Informe month e year.');
  }

  logger.info('Monthly report requested', { userId: req.user.id, month, year });
  const rows = await getMonthlyTransactions(req.user.id, month, year);
  return ok(res, rows);
}

export async function categorySummary(req, res) {
  const { startDate, endDate } = req.query;
  
  logger.info('Category summary requested', { 
    userId: req.user.id, 
    startDate, 
    endDate 
  });
  
  return ok(res, await getCategorySummary(req.user.id, startDate, endDate));
}

export async function exportCsv(req, res) {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  const { fields, separator, advanced } = req.query;

  if (!month || !year) {
    throw new ValidationError('Informe month e year.');
  }

  const rows = await getMonthlyTransactions(req.user.id, month, year);
  
  logger.info('CSV export requested', { 
    userId: req.user.id, 
    month, 
    year, 
    advanced: advanced === 'true' 
  });

  let csv;
  if (advanced === 'true') {
    csv = transactionsToAdvancedCsv(rows, {
      fields: fields ? fields.split(',') : undefined,
      separator: separator || ','
    });
  } else {
    csv = transactionsToCsv(rows);
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="relatorio-${year}-${month}.csv"`);
  return res.status(200).send(csv);
}

export async function exportPdf(req, res) {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  const { advanced, type } = req.query;

  if (!month || !year) {
    throw new ValidationError('Informe month e year.');
  }

  logger.info('PDF export requested', { 
    userId: req.user.id, 
    month, 
    year, 
    advanced: advanced === 'true',
    type 
  });

  let pdf;
  
  if (type === 'goals') {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    pdf = await buildGoalsPdf({ 
      title: `Metas Financeiras - ${new Date().toLocaleDateString('pt-BR')}`, 
      rows: goals 
    });
    res.setHeader('Content-Disposition', `attachment; filename="metas-${new Date().toISOString().split('T')[0]}.pdf"`);
  } else if (type === 'budgets') {
    const budgets = await prisma.budget.findMany({
      where: { 
        userId: req.user.id,
        month,
        year
      },
      include: { category: true }
    });
    
    // Calculate spent amount for each budget
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    
    const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: req.user.id,
          categoryId: budget.categoryId,
          type: 'expense',
          transactionDate: { gte: monthStart, lte: monthEnd }
        }
      });
      const spent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      return { ...budget, spent };
    }));
    
    pdf = await buildBudgetsPdf({ 
      title: `Orçamentos - ${month}/${year}`, 
      rows: budgetsWithSpent,
      month,
      year 
    });
    res.setHeader('Content-Disposition', `attachment; filename="orcamentos-${year}-${month}.pdf"`);
  } else {
    const rows = await getMonthlyTransactions(req.user.id, month, year);
    
    if (advanced === 'true') {
      pdf = await buildAdvancedTransactionsPdf({ 
        title: `Relatório Financeiro - ${month}/${year}`, 
        rows,
        options: {
          includeSummary: true,
          includeCharts: false
        }
      });
    } else {
      pdf = await buildTransactionsPdf({ title: `Relatório ${month}/${year}`, rows });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${year}-${month}.pdf"`);
  }

  res.setHeader('Content-Type', 'application/pdf');
  return res.status(200).send(pdf);
}

export async function exportGoalsCsv(req, res) {
  const { fields, separator } = req.query;

  const goals = await prisma.goal.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });

  logger.info('Goals CSV export requested', { userId: req.user.id, count: goals.length });

  const csv = goalsToAdvancedCsv(goals, {
    fields: fields ? fields.split(',') : undefined,
    separator: separator || ','
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="metas-${new Date().toISOString().split('T')[0]}.csv"`);
  return res.status(200).send(csv);
}

export async function exportBudgetsCsv(req, res) {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  const { fields, separator } = req.query;

  if (!month || !year) {
    throw new ValidationError('Informe month e year.');
  }

  const budgets = await prisma.budget.findMany({
    where: { 
      userId: req.user.id,
      month,
      year
    },
    include: { category: true }
  });

  // Calculate spent amount for each budget
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  
  const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        categoryId: budget.categoryId,
        type: 'expense',
        transactionDate: { gte: monthStart, lte: monthEnd }
      }
    });
    const spent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    return { ...budget, spent };
  }));

  logger.info('Budgets CSV export requested', { 
    userId: req.user.id, 
    month, 
    year, 
    count: budgetsWithSpent.length 
  });

  const csv = budgetsToAdvancedCsv(budgetsWithSpent, {
    fields: fields ? fields.split(',') : undefined,
    separator: separator || ','
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="orcamentos-${year}-${month}.csv"`);
  return res.status(200).send(csv);
}