import { HttpErrorResponse } from '@angular/common/http';
import { ParsedApiError, ValidationErrorDetail } from '../models/api-error.models';

/**
 * Fallback messages when the backend doesn't provide one.
 */
const FALLBACK_MESSAGES: Record<number, string> = {
  0: 'No se pudo conectar con el servidor. Verifique su conexión.',
  400: 'La solicitud no es válida.',
  401: 'Su sesión ha expirado. Inicie sesión nuevamente.',
  403: 'No tiene permisos para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  409: 'Conflicto: el recurso ya existe o fue modificado.',
  500: 'Error interno del servidor. Intente nuevamente más tarde.'
};

/**
 * Helper: safely get a property from body regardless of casing.
 * Checks camelCase first, then PascalCase.
 */
function prop(body: any, camel: string): any {
  if (body[camel] !== undefined) return body[camel];
  const pascal = camel.charAt(0).toUpperCase() + camel.slice(1);
  return body[pascal];
}

/**
 * Extracts a structured error from an HttpErrorResponse.
 * Handles:
 *   1. Backend ApiErrorResponse (message, validationErrors, formErrors)
 *   2. ASP.NET ProblemDetails (title, errors, status)
 *   3. Plain string body
 *   4. No body / unknown format
 *
 * Usage:
 * ```ts
 * error: (err) => {
 *   const apiError = extractApiError(err);
 *   this.error.set(apiError.message);
 * }
 * ```
 */
export function extractApiError(error: HttpErrorResponse): ParsedApiError {
  const body = error.error;

  // Debug: log raw error body in development
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    console.warn('[API Error]', error.status, body);
  }

  // Not an object — handle string or empty body
  if (!body || typeof body !== 'object') {
    if (typeof body === 'string' && body.length > 0 && body.length < 500) {
      return buildResult(body, error.status);
    }
    return buildResult(FALLBACK_MESSAGES[error.status] || `Error inesperado (${error.status}).`, error.status);
  }

  // --- Format 1: Our ApiErrorResponse (has "message" field) ---
  const message = prop(body, 'message');
  const validationErrors: ValidationErrorDetail[] = prop(body, 'validationErrors') || [];
  const formErrors: Record<string, string[]> = prop(body, 'formErrors') || {};
  const errorCode: string | null = prop(body, 'errorCode') || null;
  const statusCode: number = prop(body, 'statusCode') || error.status;

  if (message) {
    return {
      message,
      errorCode,
      statusCode,
      validationErrors: validationErrors.map((e: any) => ({
        property: prop(e, 'property') || e.property || '',
        message: prop(e, 'message') || e.message || ''
      })),
      formErrors,
      isValidation: validationErrors.length > 0
    };
  }

  // --- Format 2: ASP.NET ProblemDetails (has "title" field) ---
  const title = prop(body, 'title');
  if (title) {
    const pdErrors: ValidationErrorDetail[] = [];
    const errors = prop(body, 'errors');
    if (errors && typeof errors === 'object') {
      for (const [key, msgs] of Object.entries(errors)) {
        if (Array.isArray(msgs)) {
          msgs.forEach((msg: string) => pdErrors.push({ property: key, message: msg }));
        }
      }
    }
    const detailMsgs = pdErrors.map(e => e.message).filter(m => !!m);
    return {
      message: detailMsgs.length > 0 ? detailMsgs.join('. ') : title,
      errorCode: null,
      statusCode: prop(body, 'status') || error.status,
      validationErrors: pdErrors,
      formErrors: errors || {},
      isValidation: pdErrors.length > 0
    };
  }

  // --- Format 3: Unknown object format ---
  return buildResult(FALLBACK_MESSAGES[error.status] || `Error inesperado (${error.status}).`, error.status);
}

/**
 * Shorthand: extracts only the message string from an API error.
 *
 * Usage:
 * ```ts
 * error: (err) => this.error.set(getApiErrorMessage(err))
 * ```
 */
export function getApiErrorMessage(error: HttpErrorResponse, fallback?: string): string {
  const parsed = extractApiError(error);
  return parsed.message || fallback || 'Error desconocido.';
}

/** Internal helper to build a simple ParsedApiError */
function buildResult(message: string, statusCode: number): ParsedApiError {
  return {
    message,
    errorCode: null,
    statusCode,
    validationErrors: [],
    formErrors: {},
    isValidation: false
  };
}
