import { getCategorySummary, getMonthlyTransactions } from '../services/reportService.js';
import { buildTransactionsPdf } from '../utils/pdfExporter.js';
import { transactionsToCsv } from '../utils/csvExporter.js';
import { ok } from '../utils/response.js';

export async function monthly(req, res) {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!month || !year) {
    return res.status(400).json({ message: 'Informe month e year.' });
  }

  const rows = await getMonthlyTransactions(req.user.id, month, year);
  return ok(res, rows);
}

export async function categorySummary(req, res) {
  return ok(res, await getCategorySummary(req.user.id));
}

export async function exportCsv(req, res) {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!month || !year) {
    return res.status(400).json({ message: 'Informe month e year.' });
  }

  const rows = await getMonthlyTransactions(req.user.id, month, year);
  const csv = transactionsToCsv(rows);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="relatorio-${year}-${month}.csv"`);
  return res.status(200).send(csv);
}

export async function exportPdf(req, res) {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!month || !year) {
    return res.status(400).json({ message: 'Informe month e year.' });
  }

  const rows = await getMonthlyTransactions(req.user.id, month, year);
  const pdf = await buildTransactionsPdf({ title: `Relatório ${month}/${year}`, rows });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="relatorio-${year}-${month}.pdf"`);
  return res.status(200).send(pdf);
}
