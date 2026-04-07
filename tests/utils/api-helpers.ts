import { http, HttpResponse } from 'msw';

// Helper to create API handlers for testing
export const createMockHandler = (
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  response: any,
  status = 200
) => {
  switch (method) {
    case 'get':
      return http.get(path, () => HttpResponse.json(response, { status }));
    case 'post':
      return http.post(path, () => HttpResponse.json(response, { status }));
    case 'put':
      return http.put(path, () => HttpResponse.json(response, { status }));
    case 'delete':
      return http.delete(path, () => HttpResponse.json(response, { status }));
  }
};

// Helper to create error handlers
export const createErrorHandler = (
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  errorMessage: string,
  status = 500
) => {
  switch (method) {
    case 'get':
      return http.get(path, () => HttpResponse.json({ error: errorMessage }, { status }));
    case 'post':
      return http.post(path, () => HttpResponse.json({ error: errorMessage }, { status }));
    case 'put':
      return http.put(path, () => HttpResponse.json({ error: errorMessage }, { status }));
    case 'delete':
      return http.delete(path, () => HttpResponse.json({ error: errorMessage }, { status }));
  }
};

// Helper to create delay handlers (for testing loading states)
export const createDelayHandler = (
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  response: any,
  delayMs = 1000
) => {
  const handler = async () => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return HttpResponse.json(response);
  };

  switch (method) {
    case 'get':
      return http.get(path, handler);
    case 'post':
      return http.post(path, handler);
    case 'put':
      return http.put(path, handler);
    case 'delete':
      return http.delete(path, handler);
  }
};
