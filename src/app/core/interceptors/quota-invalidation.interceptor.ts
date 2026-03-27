import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { EntitlementService } from '../services/entitlement.service';

/**
 * Interceptor que invalida el cache de quotas/entitlements automáticamente
 * cuando se detecta una creación (POST → 201) o eliminación (DELETE → 200/204).
 * Esto mantiene el QuotaUsageIndicator y la validación de botones actualizados
 * sin necesidad de llamar reload() manualmente en cada formulario.
 */
export const quotaInvalidationInterceptor: HttpInterceptorFn = (req, next) => {
  const entitlementService = inject(EntitlementService);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const isCreate = req.method === 'POST' && event.status === 201;
        const isDelete = req.method === 'DELETE' && (event.status === 200 || event.status === 204);

        if (isCreate || isDelete) {
          entitlementService.reload();
        }
      }
    })
  );
};
