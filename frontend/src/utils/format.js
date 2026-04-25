export function currency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function dateBR(value) {
  return new Date(value).toLocaleDateString('pt-BR');
}
