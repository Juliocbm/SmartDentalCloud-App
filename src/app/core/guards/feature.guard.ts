import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { FeatureService, PlanFeature } from '../services/feature.service';
import { AuthService } from '../services/auth.service';

export const featureGuard = (requiredFeature: PlanFeature): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const featureService = inject(FeatureService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    if (featureService.hasFeature(requiredFeature)) {
      return true;
    }

    const minimumPlan = featureService.getMinimumPlan(requiredFeature);
    const featureLabel = featureService.getFeatureLabel(requiredFeature);

    router.navigate(['/subscription/feature-required'], {
      queryParams: {
        feature: requiredFeature,
        featureLabel,
        minimumPlan,
        currentPlan: featureService.planName()
      }
    });
    return false;
  };
};
