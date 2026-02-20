import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ApiService } from '../../../../core/services/api.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  SubscriptionInfo,
  SUBSCRIPTION_STATUS_CONFIG,
  AVAILABLE_PLANS,
  SubscriptionPlan
} from '../../models/subscription.models';

@Component({
  selector: 'app-subscription-page',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './subscription-page.html',
  styleUrl: './subscription-page.scss'
})
export class SubscriptionPageComponent implements OnInit {
  private api = inject(ApiService);
  private logger = inject(LoggingService);
  private notifications = inject(NotificationService);

  loading = signal(true);
  subscription = signal<SubscriptionInfo | null>(null);
  showCancelConfirm = signal(false);
  cancelling = signal(false);

  plans = AVAILABLE_PLANS;
  STATUS_CONFIG = SUBSCRIPTION_STATUS_CONFIG;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Configuración', route: '/settings' },
    { label: 'Suscripción' }
  ];

  ngOnInit(): void {
    this.loadSubscription();
  }

  private loadSubscription(): void {
    this.loading.set(true);
    this.api.get<SubscriptionInfo>('/subscriptions/current').subscribe({
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

  cancelSubscription(): void {
    this.cancelling.set(true);
    this.api.post<boolean>('/subscriptions/cancel', { immediately: false }).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.showCancelConfirm.set(false);
        this.notifications.success('Suscripción cancelada. Mantendrás acceso hasta el final del período.');
        this.loadSubscription();
      },
      error: () => {
        this.cancelling.set(false);
        this.notifications.error('Error al cancelar la suscripción');
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
