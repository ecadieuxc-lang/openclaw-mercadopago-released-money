import { badRequestResponse } from './errors.mjs';
import {
  assistantContextResponse,
  assistantSpendingSummaryResponse,
  buildExports,
  clarificationAnswerResponse,
  clarificationsResponse,
  coachResponse,
  doctorResponse,
  financeHistoryResponse,
  financeHomeResponse,
  healthResponse,
  importsStatusResponse,
  movementsResponse,
  periodSummaryResponse,
  publicConfigResponse,
  schemaVersionResponse,
  SYNTHETIC_PERIOD,
} from './responses.mjs';

function sendCsv(reply, csvContent) {
  return reply.header('content-type', 'text/csv; charset=utf-8').send(csvContent);
}

export async function registerApiRoutes(app) {
  app.get('/health', async () => healthResponse());

  app.get('/v1/system/doctor', async () => doctorResponse());
  app.get('/v1/system/config/public', async () => publicConfigResponse());
  app.get('/v1/system/schema-version', async () => schemaVersionResponse());
  app.get('/v1/imports/status', async () => importsStatusResponse());

  app.get('/v1/finance/home', async () => financeHomeResponse());
  app.get('/v1/finance/movements', async (request) => movementsResponse(request.query));
  app.get('/v1/finance/periods/current', async () => periodSummaryResponse(SYNTHETIC_PERIOD.period_id));
  app.get('/v1/finance/periods/:period_id/summary', async (request) => periodSummaryResponse(request.params.period_id));
  app.get('/v1/finance/history', async () => financeHistoryResponse());
  app.get('/v1/finance/clarifications', async () => clarificationsResponse());
  app.post('/v1/finance/clarifications/:id/answer', async (request, reply) => {
    const answer = request.body?.answer;
    if (typeof answer !== 'string' || answer.trim() === '') {
      return reply.code(400).send(badRequestResponse(request, [{ field: 'answer', message: 'answer must be a non-empty string' }]));
    }
    return clarificationAnswerResponse({ id: request.params.id, answer: answer.trim() });
  });

  app.get('/v1/finance/coach/current', async () => coachResponse(SYNTHETIC_PERIOD.period_id));
  app.get('/v1/finance/coach/:period_id', async (request) => coachResponse(request.params.period_id));

  app.get('/v1/assistant/context', async () => assistantContextResponse());
  app.get('/v1/assistant/spending-summary', async () => assistantSpendingSummaryResponse());
  app.get('/v1/assistant/period/:period_id', async (request) => ({
    period_id: request.params.period_id,
    context: assistantContextResponse(),
    summary: periodSummaryResponse(request.params.period_id),
  }));

  app.get('/v1/exports/current-period.csv', async (_request, reply) => sendCsv(reply, buildExports().files.find((file) => file.fileName === 'clean-movements.csv').content));
  app.get('/v1/exports/periods/:period_id.csv', async (_request, reply) => sendCsv(reply, buildExports().files.find((file) => file.fileName === 'clean-movements.csv').content));
  app.get('/v1/exports/periods/:period_id/summary.json', async (request) => periodSummaryResponse(request.params.period_id));
}
