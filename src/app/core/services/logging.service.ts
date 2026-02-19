import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Servicio centralizado de logging.
 * En desarrollo usa console.*; en producción puede enviar logs a un servicio externo.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private readonly isProduction = environment.production;

  debug(message: string, ...args: unknown[]): void {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.isProduction) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error ?? '');

    if (this.isProduction) {
      this.reportToExternalService(message, error);
    }
  }

  /**
   * Placeholder para integración futura con servicio de logging externo
   * (e.g., Sentry, Application Insights, LogRocket).
   */
  private reportToExternalService(message: string, error?: unknown): void {
    // TODO: Integrar con servicio de monitoreo externo
  }
}
