import { Request, Response, NextFunction } from 'express';

/**
 * Error Handler Middleware
 * Centralizza la gestione degli errori per tutti gli endpoint
 */

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Crea un errore API con status code
 */
export function createApiError(message: string, statusCode: number = 500): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

/**
 * Middleware per catturare errori async
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Middleware di gestione errori centralizzato
 */
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log dell'errore
  console.error(`[${new Date().toISOString()}] Error ${req.method} ${req.path}:`, error);

  // Determina status code
  const statusCode = error.statusCode || 500;
  
  // Determina messaggio errore
  let message = error.message || 'Errore interno del server';
  
  // In produzione, nascondi dettagli errori interni
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Errore interno del server';
  }

  // Risposta JSON standardizzata
  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
}

/**
 * Middleware per endpoint non trovati (404)
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = createApiError(`Endpoint non trovato: ${req.method} ${req.path}`, 404);
  next(error);
}
