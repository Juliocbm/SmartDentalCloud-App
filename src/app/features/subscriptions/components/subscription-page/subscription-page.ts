import { Component, OnInit, signal, inject, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { LoggingService } from '../../../../core/services/logging.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SubscriptionsService } from '../../services/subscriptions.service';
import {
  SubscriptionInfo,
  SUBSCRIPTION_STATUS_CONFIG,
  AVAILABLE_PLANS,
  SubscriptionPlan
} from '../../models/subscription.models';
import { environment } from '../../../../../environments/environment';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

declare const Stripe: any;

@Component({
  selector: 'app-subscription-page',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './subscription-page.html',
  styleUrl: './subscription-page.scss'
})
export class SubscriptionPageComponent implements OnInit, OnDestroy {
  private subscriptionsService = inject(SubscriptionsService);
  private logger = inject(LoggingService);
  private notifications = inject(NotificationService);

  loading = signal(true);
  subscription = signal<SubscriptionInfo | null>(null);
  showCancelConfirm = signal(false);
  cancelling = signal(false);

  // Checkout state
  showCheckoutModal = signal(false);
  selectedPlan = signal<SubscriptionPlan | null>(null);
  subscribing = signal(false);
  checkoutError = signal<string | null>(null);
  stripeReady = signal(false);

  // Payment method update state
  showPaymentMethodModal = signal(false);
  updatingPaymentMethod = signal(false);

  private stripe: any = null;
  private cardElement: any = null;
  private elements: any = null;

  plans = AVAILABLE_PLANS;
  STATUS_CONFIG = SUBSCRIPTION_STATUS_CONFIG;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Configuración', route: '/settings' },
    { label: 'Suscripción' }
  ];

  ngOnInit(): void {
    this.loadSubscription();
    this.loadStripe();
  }

  ngOnDestroy(): void {
    if (this.cardElement) {
      this.cardElement.destroy();
    }
  }

  private loadSubscription(): void {
    this.loading.set(true);
    this.subscriptionsService.getCurrent().subscribe({
      next: (data) => {
        this.subscription.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading subscription:', err);
        this.loading.set(false);
      }
    });
  }

  private loadStripe(): void {
    const stripeKey = (environment as any).stripePublishableKey;
    if (!stripeKey) {
      this.logger.warn('Stripe publishable key not configured');
      return;
    }

    if (typeof Stripe !== 'undefined') {
      this.initStripe(stripeKey);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => this.initStripe(stripeKey);
    script.onerror = () => this.logger.error('Failed to load Stripe.js');
    document.head.appendChild(script);
  }

  private initStripe(key: string): void {
    this.stripe = Stripe(key);
    this.elements = this.stripe.elements({ locale: 'es' });
    this.stripeReady.set(true);
  }

  private mountCardElement(containerId: string): void {
    if (!this.elements) return;

    if (this.cardElement) {
      this.cardElement.destroy();
    }

    this.cardElement = this.elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          '::placeholder': { color: '#aab7c4' }
        },
        invalid: { color: '#dc3545' }
      }
    });

    setTimeout(() => {
      const container = document.getElementById(containerId);
      if (container) {
        this.cardElement.mount(container);
      }
    }, 100);
  }

  getStatusConfig(status: string) {
    return SUBSCRIPTION_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  getDaysRemaining(): number {
    const sub = this.subscription();
    if (!sub?.endDate) return 0;
    const diff = new Date(sub.endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  isCurrentPlan(plan: SubscriptionPlan): boolean {
    return this.subscription()?.planName === plan.name;
  }

  // === Checkout Flow ===

  openCheckout(plan: SubscriptionPlan): void {
    this.selectedPlan.set(plan);
    this.checkoutError.set(null);
    this.showCheckoutModal.set(true);
    this.mountCardElement('stripe-card-element');
  }

  closeCheckout(): void {
    this.showCheckoutModal.set(false);
    this.selectedPlan.set(null);
    this.checkoutError.set(null);
  }

  async processCheckout(): Promise<void> {
    const plan = this.selectedPlan();
    if (!plan || !this.stripe || !this.cardElement) return;

    this.subscribing.set(true);
    this.checkoutError.set(null);

    try {
      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement
      });

      if (error) {
        this.checkoutError.set(error.message);
        this.subscribing.set(false);
        return;
      }

      this.subscriptionsService.createSubscription({
        planId: plan.id,
        stripePaymentMethodId: paymentMethod.id
      }).subscribe({
        next: () => {
          this.subscribing.set(false);
          this.closeCheckout();
          this.notifications.success(`¡Suscripción al plan ${plan.name} activada exitosamente!`);
          this.loadSubscription();
        },
        error: (err) => {
          this.subscribing.set(false);
          this.checkoutError.set(getApiErrorMessage(err));
        }
      });
    } catch (e: any) {
      this.subscribing.set(false);
      this.checkoutError.set(e?.message || 'Error inesperado');
    }
  }

  // === Update Payment Method ===

  openPaymentMethodUpdate(): void {
    this.showPaymentMethodModal.set(true);
    this.checkoutError.set(null);
    this.mountCardElement('stripe-payment-method-element');
  }

  closePaymentMethodModal(): void {
    this.showPaymentMethodModal.set(false);
    this.checkoutError.set(null);
  }

  async updatePaymentMethod(): Promise<void> {
    if (!this.stripe || !this.cardElement) return;

    this.updatingPaymentMethod.set(true);
    this.checkoutError.set(null);

    try {
      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement
      });

      if (error) {
        this.checkoutError.set(error.message);
        this.updatingPaymentMethod.set(false);
        return;
      }

      this.subscriptionsService.updatePaymentMethod({
        newStripePaymentMethodId: paymentMethod.id
      }).subscribe({
        next: () => {
          this.updatingPaymentMethod.set(false);
          this.closePaymentMethodModal();
          this.notifications.success('Método de pago actualizado exitosamente');
        },
        error: (err) => {
          this.updatingPaymentMethod.set(false);
          this.checkoutError.set(getApiErrorMessage(err));
        }
      });
    } catch (e: any) {
      this.updatingPaymentMethod.set(false);
      this.checkoutError.set(e?.message || 'Error inesperado');
    }
  }

  // === Cancel ===

  cancelSubscription(): void {
    this.cancelling.set(true);
    this.subscriptionsService.cancelSubscription(false).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.showCancelConfirm.set(false);
        this.notifications.success('Suscripción cancelada. Mantendrás acceso hasta el final del período.');
        this.loadSubscription();
      },
      error: (err) => {
        this.cancelling.set(false);
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(date));
  }
}
