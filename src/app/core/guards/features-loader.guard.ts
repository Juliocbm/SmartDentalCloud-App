import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EntitlementService } from '../services/entitlement.service';

/**
 * Guard que garantiza que los entitlements (features + quotas) estén cargados
 * ANTES de que los child guards los evalúen.
 * Siempre retorna true — su rol es data loading, no access control.
 */
export const featuresLoaderGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const entitlementService = inject(EntitlementService);

  if (!authService.isAuthenticated() || entitlementService.loaded()) {
    return true;
  }

  await entitlementService.loadEntitlements();
  return true;
};
