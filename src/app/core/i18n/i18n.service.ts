import { Injectable, signal } from '@angular/core';
import { ES_MX } from './translations/es-MX';
import { EN_US } from './translations/en-US';

export type SupportedLocale = 'es-MX' | 'en-US';

const TRANSLATIONS: Record<SupportedLocale, Record<string, string>> = {
  'es-MX': ES_MX,
  'en-US': EN_US
};

/**
 * Servicio de internacionalización (i18n)
 * Estructura base para futuro soporte multi-idioma.
 * Actualmente el idioma por defecto es es-MX.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private currentLocale = signal<SupportedLocale>('es-MX');

  get locale() {
    return this.currentLocale;
  }

  setLocale(locale: SupportedLocale): void {
    this.currentLocale.set(locale);
    localStorage.setItem('sdc_locale', locale);
  }

  /**
   * Traduce una clave al idioma actual
   */
  t(key: string, params?: Record<string, string>): string {
    const translations = TRANSLATIONS[this.currentLocale()];
    let value = translations[key] || key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{{${k}}}`, v);
      });
    }

    return value;
  }

  /**
   * Inicializa el locale desde localStorage
   */
  init(): void {
    const stored = localStorage.getItem('sdc_locale') as SupportedLocale | null;
    if (stored && TRANSLATIONS[stored]) {
      this.currentLocale.set(stored);
    }
  }
}
