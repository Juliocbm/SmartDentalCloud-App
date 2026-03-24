import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor que maneja respuestas HTTP 402 (suscripción expirada)
 * y 403 con error "limit_exceeded" (límite de plan excedido).
 * Redirige a las páginas de bloqueo correspondientes.
 */
export const subscriptionInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 402 && !req.url.includes('/subscriptions')) {
        const body = error.error;
        router.navigate(['/subscription/expired'], {
          queryParams: {
            status: body?.status,
            isTrial: body?.isTrial,
            days: body?.daysRemaining
          }
        });
      }

      if (error.status === 403 && error.error?.error === 'limit_exceeded') {
        const body = error.error;
        router.navigate(['/subscription/limit-exceeded'], {
          queryParams: {
            plan: body?.planName,
            patients: body?.currentPatients,
            patientLimit: body?.patientLimit,
            users: body?.currentUsers,
            userLimit: body?.userLimit
          }
        });
      }

      return throwError(() => error);
    })
  );
};
