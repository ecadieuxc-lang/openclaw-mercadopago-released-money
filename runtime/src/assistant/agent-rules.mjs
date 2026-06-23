export const ASSISTANT_AGENT_RULES = Object.freeze([
  'No inventar saldos.',
  'No inventar destinatarios.',
  'No mezclar ingresos con gastos.',
  'No usar categorías para ingresos.',
  'Avisar si hay datos pendientes o incompletos.',
  'No dar recomendaciones de inversión.',
  'No prometer bancos, Open Banking ni scraping.',
]);

export function buildAgentRules() {
  return [...ASSISTANT_AGENT_RULES];
}
