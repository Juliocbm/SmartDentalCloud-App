/**
 * Mirrors backend ApiErrorResponse from ExceptionHandlingMiddleware.
 * All API errors follow this structure.
 */
export interface ApiErrorResponse {
  statusCode: number;
  errorCode: string;
  error: string;
  message: string;
  details?: string;
  validationErrors?: ValidationErrorDetail[];
  formErrors?: Record<string, string[]>;
  timestamp: string;
  path?: string;
  correlationId?: string;
}

export interface ValidationErrorDetail {
  property: string;
  message: string;
  attemptedValue?: unknown;
}

/**
 * Parsed result from extractApiError() — ready for component use.
 */
export interface ParsedApiError {
  /** Main error message from backend (Spanish, user-friendly) */
  message: string;
  /** Error code for programmatic handling (e.g. 'VALIDATION_FAILED') */
  errorCode: string | null;
  /** HTTP status code */
  statusCode: number;
  /** Validation errors array (for custom rendering) */
  validationErrors: ValidationErrorDetail[];
  /** FormErrors keyed by camelCase field name (for Angular FormGroup integration) */
  formErrors: Record<string, string[]>;
  /** Whether this is a validation error (400 with validationErrors) */
  isValidation: boolean;
}
