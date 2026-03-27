import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { EntitlementService } from '../services/entitlement.service';

/**
 * Guard que garantiza que los entitlements (features + quotas) estén cargados
 * ANTES de que los child guards los evalúen.
 * También hidrata currentUser si está null (ej: post-registro o refresh de página).
 */
export const featuresLoaderGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const entitlementService = inject(EntitlementService);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Red de seguridad: si hay token pero no hay usuario, obtenerlo del backend
  if (!authService.currentUser()) {
    try {
      await firstValueFrom(authService.fetchCurrentUser());
    } catch {
      // Si falla (ej: endpoint no disponible), continuar sin user info.
      // El dashboard funcionará con permisos limitados pero no expulsa al usuario.
    }
  }

  if (!entitlementService.loaded()) {
    await entitlementService.loadEntitlements();
  }

  return true;
};
