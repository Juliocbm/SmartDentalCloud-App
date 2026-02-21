import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SubscriptionInfo } from '../models/subscription.models';

export interface CreateSubscriptionRequest {
  planId: string;
  stripePaymentMethodId: string;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodEnd: string;
}

export interface UpdatePaymentMethodRequest {
  newStripePaymentMethodId: string;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private api = inject(ApiService);

  getCurrent(): Observable<SubscriptionInfo> {
    return this.api.get<SubscriptionInfo>('/subscriptions/current');
  }

  createSubscription(request: CreateSubscriptionRequest): Observable<CreateSubscriptionResult> {
    return this.api.post<CreateSubscriptionResult>('/subscriptions', request);
  }

  cancelSubscription(immediately: boolean = false): Observable<boolean> {
    return this.api.post<boolean>('/subscriptions/cancel', { immediately });
  }

  updatePaymentMethod(request: UpdatePaymentMethodRequest): Observable<boolean> {
    return this.api.put<boolean>('/subscriptions/payment-method', request);
  }
}
