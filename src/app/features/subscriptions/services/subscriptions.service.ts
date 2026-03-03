import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SubscriptionInfo } from '../models/subscription.models';

export type PaymentProviderType = 'Stripe' | 'Conekta' | 'OpenPay';

export interface CreateSubscriptionRequest {
  planId: string;
  paymentProvider?: PaymentProviderType;
  paymentMethodToken: string;
  billingEmail?: string;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  externalSubscriptionId: string;
  paymentProvider: string;
  status: string;
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
}

export interface UpdatePaymentMethodRequest {
  newStripePaymentMethodId: string;
}

export interface PaymentProviderOption {
  id: PaymentProviderType;
  name: string;
  icon: string;
  description: string;
}

export const PAYMENT_PROVIDERS: PaymentProviderOption[] = [
  { id: 'Stripe', name: 'Tarjeta Internacional', icon: 'fa-credit-card', description: 'Visa, Mastercard, Amex' },
  { id: 'Conekta', name: 'Conekta', icon: 'fa-building-columns', description: 'Tarjetas MX, OXXO, SPEI' },
  { id: 'OpenPay', name: 'OpenPay', icon: 'fa-store', description: 'Tarjetas MX, Tiendas, SPEI' }
];

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
