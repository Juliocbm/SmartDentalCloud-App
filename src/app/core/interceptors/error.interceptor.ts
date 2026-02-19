import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * Interceptor global de errores HTTP.
 * Muestra notificaciones toast para errores no manejados por los componentes.
 * Los errores 401 se manejan en authInterceptor.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 se maneja en authInterceptor — no duplicar
      if (error.status === 401) {
        return throwError(() => error);
      }

      // Extraer mensaje del error
      const message = getErrorMessage(error);

      switch (error.status) {
        case 0:
          notificationService.error('No se pudo conectar con el servidor. Verifique su conexión.');
          break;
        case 400:
          // Bad request — dejar que el componente maneje el detalle
          break;
        case 403:
          notificationService.error('No tiene permisos para realizar esta acción.');
          break;
        case 404:
          // Not found — generalmente manejado por componentes
          break;
        case 409:
          notificationService.warning(message || 'Conflicto: el recurso ya existe o fue modificado.');
          break;
        case 500:
          notificationService.error('Error interno del servidor. Intente nuevamente más tarde.');
          break;
        default:
          if (error.status >= 500) {
            notificationService.error('Error del servidor. Intente nuevamente más tarde.');
          }
          break;
      }

      return throwError(() => error);
    })
  );
};

function getErrorMessage(error: HttpErrorResponse): string {
  if (typeof error.error === 'string') {
    return error.error;
  }
  if (error.error?.message) {
    return error.error.message;
  }
  if (error.error?.title) {
    return error.error.title;
  }
  return error.message || 'Error desconocido';
}
