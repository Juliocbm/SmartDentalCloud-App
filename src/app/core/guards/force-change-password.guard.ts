import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que bloquea navegación a rutas protegidas cuando el usuario
 * tiene pendiente un cambio de contraseña forzado.
 *
 * Debe colocarse DESPUÉS de authGuard y ANTES de featuresLoaderGuard
 * en la cadena de guards del layout.
 *
 * NO debe usarse en la ruta /force-change-password (evita loop infinito).
 */
export const forceChangePasswordGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.mustChangePassword()) {
    router.navigate(['/force-change-password']);
    return false;
  }

  return true;
};
