/**
 * DateFormatService — Servicio centralizado de formateo de fechas para todo el SaaS.
 *
 * Todos los métodos son estáticos y usan Intl.DateTimeFormat('es-MX') como único mecanismo.
 * Aceptan Date | string | null | undefined y retornan '—' para valores nulos.
 *
 * Formatos estándar:
 *   shortDate()    → 09/03/2026         (tablas, listas)
 *   longDate()     → 09 de marzo de 2026 (detail views)
 *   dateTime()     → 09/03/2026 14:30   (audit, timestamps)
 *   compactDate()  → 09 mar             (dashboards compactos)
 *   fullDate()     → domingo, 09 de marzo de 2026 (calendario)
 *   timeOnly()     → 14:30              (horas)
 *   dateForApi()   → 2026-03-09         (enviar fecha pura al backend)
 *   dateTimeForApi() → 2026-03-09T14:30:00 (enviar datetime al backend)
 */
export class DateFormatService {

  private static readonly LOCALE = 'es-MX';
  private static readonly EMPTY = '—';

  // ===== Display Formats =====

  /** 09/03/2026 — Para tablas, listas, resúmenes */
  static shortDate(date: Date | string | null | undefined): string {
    const d = DateFormatService.toDate(date);
    if (!d) return DateFormatService.EMPTY;
    return new Intl.DateTimeFormat(DateFormatService.LOCALE, {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(d);
  }

  /** 09 de marzo de 2026 — Para detail views, formularios de solo lectura */
  static longDate(date: Date | string | null | undefined): string {
    const d = DateFormatService.toDate(date);
    if (!d) return DateFormatService.EMPTY;
    return new Intl.DateTimeFormat(DateFormatService.LOCALE, {
      day: '2-digit', month: 'long', year: 'numeric'
    }).format(d);
  }

  /** 09/03/2026 14:30 — Para timestamps, auditoría, notificaciones */
  static dateTime(date: Date | string | null | undefined): string {
    const d = DateFormatService.toDate(date);
    if (!d) return DateFormatService.EMPTY;
    return new Intl.DateTimeFormat(DateFormatService.LOCALE, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  }

  /** 09 mar — Para dashboards compactos, gráficas */
  static compactDate(date: Date | string | null | undefined): string {
    const d = DateFormatService.toDate(date);
    if (!d) return DateFormatService.EMPTY;
    return new Intl.DateTimeFormat(DateFormatService.LOCALE, {
      day: '2-digit', month: 'short'
    }).format(d);
  }

  /** domingo, 09 de marzo de 2026 — Para calendario, vistas completas */
  static fullDate(date: Date | string | null | undefined): string {
    const d = DateFormatService.toDate(date);
    if (!d) return DateFormatService.EMPTY;
    return new Intl.DateTimeFormat(DateFormatService.LOCALE, {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    }).format(d);
  }

  /** 14:30 — Para mostrar solo la hora */
  static timeOnly(date: Date | string | null | undefined): string {
    const d = DateFormatService.toDate(date);
    if (!d) return DateFormatService.EMPTY;
    return new Intl.DateTimeFormat(DateFormatService.LOCALE, {
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  }

  /** 9 mar 2026 — Para badges, etiquetas con espacio limitado */
  static mediumDate(date: Date | string | null | undefined): string {
    const d = DateFormatService.toDate(date);
    if (!d) return DateFormatService.EMPTY;
    return new Intl.DateTimeFormat(DateFormatService.LOCALE, {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(d);
  }

  // ===== API Formats =====

  /** 2026-03-09 — Formato ISO date para enviar al backend */
  static dateForApi(date: Date | string | null | undefined): string {
    const d = DateFormatService.toDate(date);
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** 2026-03-09T14:30:00 — Formato ISO datetime para enviar al backend */
  static dateTimeForApi(date: Date | string | null | undefined): string {
    const d = DateFormatService.toDate(date);
    if (!d) return '';
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${mo}-${day}T${h}:${mi}:${s}`;
  }

  // ===== Helpers =====

  /** Convierte cualquier input a Date o null */
  private static toDate(date: Date | string | null | undefined): Date | null {
    if (date == null) return null;
    if (date instanceof Date) return isNaN(date.getTime()) ? null : date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}
