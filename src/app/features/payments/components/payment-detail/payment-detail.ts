import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaymentsService } from '../../services/payments.service';
import { Payment, PAYMENT_METHOD_CONFIG } from '../../models/payment.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent, EmptyStateComponent],
  templateUrl: './payment-detail.html',
  styleUrl: './payment-detail.scss'
})
export class PaymentDetailComponent implements OnInit {
  showAuditModal = signal(false);
  showDeleteConfirm = signal(false);
  deleting = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentsService = inject(PaymentsService);
  private logger = inject(LoggingService);
  private notifications = inject(NotificationService);
  private location = inject(Location);
  permissionService = inject(PermissionService);
  PERMISSIONS = PERMISSIONS;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pagos', route: '/payments' },
    { label: 'Detalle' }
  ];

  payment = signal<Payment | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadPayment(id);
  }

  private loadPayment(id: string): void {
    this.loading.set(true);
    this.paymentsService.getById(id).subscribe({
      next: (data) => {
        this.payment.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading payment:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  getMethodConfig(method: string) {
    return (PAYMENT_METHOD_CONFIG as Record<string, { label: string; icon: string; color: string }>)[method]
      || { label: method, icon: 'fa-ellipsis', color: 'var(--neutral-500)' };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date | string): string {
    return DateFormatService.longDate(date);
  }

  formatDateTime(date: Date | string): string {
    return DateFormatService.dateTime(date);
  }

  goBack(): void {
    this.location.back();
  }

  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  deletePayment(): void {
    const pay = this.payment();
    if (!pay) return;

    this.deleting.set(true);
    this.showDeleteConfirm.set(false);

    this.paymentsService.delete(pay.id).subscribe({
      next: () => {
        this.notifications.success('Pago eliminado correctamente. El balance de la factura ha sido recalculado.');
        this.router.navigate(['/payments']);
      },
      error: (err) => {
        this.logger.error('Error deleting payment:', err);
        this.notifications.error(getApiErrorMessage(err, 'Error al eliminar el pago'));
        this.deleting.set(false);
      }
    });
  }
}
