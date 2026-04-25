import PDFDocument from 'pdfkit';

export function buildTransactionsPdf({ title, rows }) {
  const doc = new PDFDocument({ margin: 40 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();

  rows.forEach((item, index) => {
    doc
      .fontSize(12)
      .text(`${index + 1}. ${item.title} | ${item.category?.name || 'Sem categoria'} | ${item.type}`)
      .text(`Valor: R$ ${Number(item.amount).toFixed(2)} | Data: ${new Date(item.transactionDate).toLocaleDateString('pt-BR')}`)
      .text(`Descrição: ${item.description || '-'}`)
      .moveDown(0.8);
  });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
