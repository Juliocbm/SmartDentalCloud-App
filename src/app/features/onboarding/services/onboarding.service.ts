import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { RegisterTenantRequest, RegisterTenantResult, SubscriptionPlanDto } from '../models/onboarding.models';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private api = inject(ApiService);

  register(request: RegisterTenantRequest): Observable<RegisterTenantResult> {
    return this.api.post<RegisterTenantResult>('/onboarding/register', request);
  }

  getPlans(): Observable<SubscriptionPlanDto[]> {
    return this.api.get<SubscriptionPlanDto[]>('/plans');
  }
}
