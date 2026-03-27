import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ModalService } from '../../shared/services/modal.service';
import { QuotaExceededModalComponent, QuotaExceededModalData } from '../../shared/components/quota-exceeded-modal/quota-exceeded-modal';

/**
 * Interceptor que maneja respuestas HTTP 402 (suscripción expirada)
 * y 403 con errores de límites/quota.
 * Muestra modal para quota excedida; redirige para suscripción expirada.
 */
export const subscriptionInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const modalService = inject(ModalService);

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

      if (error.status === 403) {
        const body = error.error;

        // Quota excedida (QuotaExceededException → ERR-4034)
        if (body?.errorCode === 'ERR-4034') {
          const data: QuotaExceededModalData = {
            planName: body?.metadata?.planName ?? '',
            resourceType: body?.metadata?.resourceType ?? '',
            currentUsage: body?.metadata?.currentUsage ?? 0,
            limit: body?.metadata?.limit ?? 0
          };

          if (!modalService.isOpen()) {
            try {
              modalService.open<QuotaExceededModalData>(QuotaExceededModalComponent, { data });
            } catch {
              // Fallback: VCR no registrado (rutas fuera del layout)
              router.navigate(['/subscription/limit-exceeded'], {
                queryParams: {
                  plan: data.planName,
                  resourceType: data.resourceType,
                  current: data.currentUsage,
                  limit: data.limit
                }
              });
            }
          }
        }

        // Legacy: limit_exceeded del middleware (backward compat)
        if (body?.error === 'limit_exceeded') {
          if (!modalService.isOpen()) {
            try {
              modalService.open<QuotaExceededModalData>(QuotaExceededModalComponent, {
                data: {
                  planName: body?.planName ?? '',
                  resourceType: body?.currentUsers >= body?.userLimit ? 'Quota:Users' : 'Quota:Patients',
                  currentUsage: body?.currentUsers >= body?.userLimit ? body?.currentUsers : body?.currentPatients,
                  limit: body?.currentUsers >= body?.userLimit ? body?.userLimit : body?.patientLimit
                }
              });
            } catch {
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
          }
        }
      }

      return throwError(() => error);
    })
  );
};
