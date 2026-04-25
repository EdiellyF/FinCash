import { stringify } from 'csv-stringify/sync';

export function transactionsToCsv(rows) {
  return stringify(
    rows.map((t) => ({
      titulo: t.title,
      descricao: t.description || '',
      tipo: t.type,
      categoria: t.category?.name || '',
      valor: Number(t.amount),
      data: new Date(t.transactionDate).toISOString().slice(0, 10)
    })),
    { header: true }
  );
}
