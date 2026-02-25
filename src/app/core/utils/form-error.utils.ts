import { AbstractControl, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { extractApiError } from './api-error.utils';

/**
 * Default error messages for common Angular validators.
 * Covers: required, minlength, maxlength, email, pattern, min, max, serverError.
 */
const DEFAULT_ERROR_MESSAGES: Record<string, (errors: any) => string> = {
  required: () => 'Este campo es requerido',
  minlength: (e) => `Mínimo ${e.requiredLength} caracteres`,
  maxlength: (e) => `Máximo ${e.requiredLength} caracteres`,
  email: () => 'Email inválido',
  pattern: () => 'Formato inválido',
  min: (e) => `El valor mínimo es ${e.min}`,
  max: (e) => `El valor máximo es ${e.max}`,
  serverError: (e) => e.message || 'Error del servidor',
};

/**
 * Checks if a form field is invalid and has been interacted with (dirty or touched).
 *
 * Usage:
 * ```ts
 * isFieldInvalid(this.form, 'email')
 * ```
 */
export function isFieldInvalid(form: FormGroup, fieldName: string): boolean {
  const field = form.get(fieldName);
  return !!(field && field.invalid && (field.dirty || field.touched));
}

/**
 * Returns the first error message for a form field, or null if valid.
 * Uses default messages for common validators. Pass `customMessages` to override
 * or extend for domain-specific validators.
 *
 * Usage:
 * ```ts
 * // Simple — uses default messages
 * getFieldError(this.form, 'email')
 *
 * // Custom — override specific validators
 * getFieldError(this.form, 'amount', {
 *   min: () => 'El monto debe ser mayor a $0',
 *   max: () => `No puede exceder ${this.maxAmount}`
 * })
 * ```
 */
export function getFieldError(
  form: FormGroup,
  fieldName: string,
  customMessages?: Record<string, (errors: any) => string>
): string | null {
  const field = form.get(fieldName);
  if (!field?.invalid || !(field.dirty || field.touched)) return null;

  const errors = field.errors;
  if (!errors) return null;

  const messages = { ...DEFAULT_ERROR_MESSAGES, ...customMessages };

  for (const key of Object.keys(errors)) {
    if (messages[key]) {
      return messages[key](errors[key]);
    }
  }

  return 'Campo inválido';
}

/**
 * Marks all controls in a FormGroup as touched.
 * Useful before submit to trigger validation display.
 *
 * Usage:
 * ```ts
 * if (this.form.invalid) {
 *   markFormGroupTouched(this.form);
 *   return;
 * }
 * ```
 */
export function markFormGroupTouched(formGroup: FormGroup): void {
  Object.keys(formGroup.controls).forEach(key => {
    const control = formGroup.get(key);
    control?.markAsTouched();
    if (control instanceof FormGroup) {
      markFormGroupTouched(control);
    }
  });
}

/**
 * Applies backend `formErrors` to an Angular FormGroup.
 * Sets a `serverError` validation error on each matching control,
 * which `getFieldError()` will pick up automatically.
 * Returns the general error message for inline banner display.
 *
 * Usage in error callback:
 * ```ts
 * error: (err) => {
 *   this.error.set(applyServerErrors(err, this.form));
 *   this.loading.set(false);
 * }
 * ```
 *
 * The returned message is always the general backend message (for the banner).
 * Individual field errors are set on the FormGroup controls and displayed
 * via the existing `getFieldError()` / `isFieldInvalid()` helpers.
 */
export function applyServerErrors(error: HttpErrorResponse, form: FormGroup): string {
  const parsed = extractApiError(error);

  // Clear any previous server errors on all controls
  Object.keys(form.controls).forEach(key => {
    const control = form.get(key);
    if (control?.hasError('serverError')) {
      const { serverError, ...remainingErrors } = control.errors || {};
      control.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
    }
  });

  // Apply new server errors if present
  if (parsed.isValidation && Object.keys(parsed.formErrors).length > 0) {
    for (const [field, messages] of Object.entries(parsed.formErrors)) {
      const control = form.get(field);
      if (control && messages.length > 0) {
        control.setErrors({
          ...(control.errors || {}),
          serverError: { message: messages[0] }
        });
        control.markAsTouched();
      }
    }
  }

  return parsed.message;
}
