import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaymentsService } from '../../services/payments.service';
import { Payment, PAYMENT_METHOD_CONFIG } from '../../models/payment.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent],
  templateUrl: './payment-detail.html',
  styleUrl: './payment-detail.scss'
})
export class PaymentDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentsService = inject(PaymentsService);
  private logger = inject(LoggingService);
  private location = inject(Location);

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
        this.error.set('Error al cargar el pago');
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
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(date));
  }

  formatDateTime(date: Date | string): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(date));
  }

  goBack(): void {
    this.location.back();
  }
}
