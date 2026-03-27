import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// ═══════════════════════════════════════════════════════════
// Regex Patterns — single source of truth para formatos MX
// ═══════════════════════════════════════════════════════════

export const MX_PATTERNS = {
  /** CURP: 4 letras + 6 dígitos + sexo (H/M) + 5 letras + alfanumérico + dígito */
  CURP: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/,
  /** RFC persona física: 4 caracteres + 6 dígitos + 3 homoclave */
  RFC_FISICA: /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/,
  /** RFC persona moral: 3 caracteres + 6 dígitos + 3 homoclave */
  RFC_MORAL: /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/,
  /** RFC combinado: acepta persona física o moral */
  RFC: /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/,
  /** Teléfono mexicano: exactamente 10 dígitos */
  PHONE: /^\d{10}$/,
  /** Código postal mexicano: exactamente 5 dígitos */
  POSTAL_CODE: /^\d{5}$/,
} as const;

// ═══════════════════════════════════════════════════════════
// Input Format Configs — usados por InputFormatDirective
// ═══════════════════════════════════════════════════════════

export type InputFormatType = 'curp' | 'rfc' | 'phone' | 'postalCode';

export interface InputFormatConfig {
  /** Regex para eliminar caracteres no permitidos */
  stripPattern: RegExp;
  /** Longitud máxima del campo */
  maxLength: number;
  /** Transformación opcional del valor */
  transform?: 'uppercase';
}

export const INPUT_FORMAT_CONFIGS: Record<InputFormatType, InputFormatConfig> = {
  curp:       { stripPattern: /[^A-Z0-9]/g,   maxLength: 18, transform: 'uppercase' },
  rfc:        { stripPattern: /[^A-ZÑ&0-9]/g, maxLength: 13, transform: 'uppercase' },
  phone:      { stripPattern: /[^\d]/g,        maxLength: 10 },
  postalCode: { stripPattern: /[^\d]/g,        maxLength: 5 },
};

// ═══════════════════════════════════════════════════════════
// ValidatorFn — errores con keys nombrados (curp, rfc, phone, postalCode)
// para que form-error.utils.ts resuelva el mensaje automáticamente
// ═══════════════════════════════════════════════════════════

export function curpValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return MX_PATTERNS.CURP.test(control.value) ? null : { curp: true };
  };
}

export function rfcValidator(type: 'fisica' | 'moral' | 'any' = 'any'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const pattern = type === 'fisica' ? MX_PATTERNS.RFC_FISICA
                  : type === 'moral'  ? MX_PATTERNS.RFC_MORAL
                  : MX_PATTERNS.RFC;
    return pattern.test(control.value) ? null : { rfc: true };
  };
}

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return MX_PATTERNS.PHONE.test(control.value) ? null : { phone: true };
  };
}

export function postalCodeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return MX_PATTERNS.POSTAL_CODE.test(control.value) ? null : { postalCode: true };
  };
}

// ═══════════════════════════════════════════════════════════
// Error Messages — se integran con DEFAULT_ERROR_MESSAGES
// en form-error.utils.ts via spread
// ═══════════════════════════════════════════════════════════

export const MX_ERROR_MESSAGES: Record<string, () => string> = {
  curp:       () => 'CURP inválido (18 caracteres, ej: GARC850101HDFRRL09)',
  rfc:        () => 'RFC inválido (ej: XAXX010101000)',
  phone:      () => 'Teléfono inválido (10 dígitos)',
  postalCode: () => 'Código postal inválido (5 dígitos)',
};
