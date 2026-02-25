import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { extractApiError } from '../utils/api-error.utils';

/**
 * Interceptor global de errores HTTP.
 *
 * Estrategia por código de estado:
 * - 0:   Toast error (sin conexión) — global, ningún componente puede manejar
 * - 401: NO toast — authInterceptor maneja refresh/redirect
 * - Todos los demás: NO toast — el componente es responsable del feedback
 *   (inline con error.set() o toast con notifications.error())
 *
 * El error siempre se re-lanza para que el componente pueda procesarlo.
 *
 * IMPORTANTE: No agregar toasts aquí para 400/403/404/409/500+.
 * Los componentes ya manejan estos errores con contexto específico.
 * Agregar toast aquí causaría notificaciones duplicadas.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 se maneja en authInterceptor — no duplicar
      if (error.status === 401) {
        return throwError(() => error);
      }

      // Solo toast para errores de conexión — verdaderamente global
      if (error.status === 0) {
        const apiError = extractApiError(error);
        notificationService.error(apiError.message);
      }

      return throwError(() => error);
    })
  );
};
