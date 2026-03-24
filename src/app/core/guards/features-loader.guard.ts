import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { FeatureService } from '../services/feature.service';
import { SubscriptionsService } from '../../features/subscriptions/services/subscriptions.service';

/**
 * Guard que garantiza que las features del plan estén cargadas
 * en FeatureService ANTES de que los child guards las evalúen.
 * Siempre retorna true — su rol es data loading, no access control.
 */
export const featuresLoaderGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const featureService = inject(FeatureService);
  const subscriptionsService = inject(SubscriptionsService);

  if (!authService.isAuthenticated() || featureService.loaded()) {
    return true;
  }

  return subscriptionsService.getCurrent().pipe(
    map(sub => {
      featureService.loadFromPlanName(sub.planName);
      return true as const;
    }),
    catchError(() => {
      featureService.loadFromPlanName('');
      return of(true as const);
    })
  );
};
