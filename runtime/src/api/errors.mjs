const DEFAULT_MESSAGES = Object.freeze({
  UNAUTHORIZED: 'Authentication is required for this endpoint.',
  NOT_FOUND: 'Endpoint not found.',
  INTERNAL_ERROR: 'Internal server error.',
  BAD_REQUEST: 'Request body is invalid.',
});

export function requestIdFrom(request) {
  return request?.id ? String(request.id) : 'local-request';
}

export function errorResponse({ code, message, request, details = [] }) {
  return {
    error: {
      code,
      message: message ?? DEFAULT_MESSAGES[code] ?? 'Request failed.',
      request_id: requestIdFrom(request),
      details,
    },
  };
}

export function unauthorizedResponse(request) {
  return errorResponse({ code: 'UNAUTHORIZED', request });
}

export function notFoundResponse(request) {
  return errorResponse({ code: 'NOT_FOUND', request });
}

export function badRequestResponse(request, details = []) {
  return errorResponse({ code: 'BAD_REQUEST', request, details });
}
