/**
 * Utilitários e funções auxiliares para o serviço de IA
 */

/**
 * Retorna uma dica financeira genérica quando os provedores de IA não estão disponíveis
 */
function getGenericAdvice() {
  const genericTips = [
    "Uma dica importante: tente poupar pelo menos 20% da sua renda mensal.",
    "Considere criar um fundo de emergência equivalente a 3-6 meses de despesas.",
    "Revise suas assinaturas e serviços recorrentes regularmente para cortar gastos desnecessários.",
    "Antes de fazer uma compra impulsiva, espere 24 horas e reavalie se realmente precisa.",
    "Use a regra 50/30/20: 50% para necessidades, 30% para desejos, 20% para poupança.",
  ];

  return genericTips[Math.floor(Math.random() * genericTips.length)];
}

/**
 * Verifica se um erro é de rate limit (429)
 */
function isRateLimitError(err) {
  if (!err) return false;
  if (err.status === 429) return true;
  if (err.response && err.response.status === 429) return true;
  const msg = String(err.message || err).toLowerCase();
  if (msg.includes('429') || msg.includes('too many requests') || msg.includes('rate limit')) return true;
  return false;
}

export { getGenericAdvice, isRateLimitError };