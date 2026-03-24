import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { InvoicesService } from '../../services/invoices.service';
import { PendingBillingItem } from '../../models/invoice.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { PermissionService } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-pending-billing',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './pending-billing.html',
  styleUrl: './pending-billing.scss'
})
export class PendingBillingComponent implements OnInit {
  private invoicesService = inject(InvoicesService);
  private router = inject(Router);
  private logger = inject(LoggingService);
  permissionService = inject(PermissionService);

  items = signal<PendingBillingItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Facturas', route: '/invoices' },
    { label: 'Pendientes de Facturar' }
  ];

  totalPending = computed(() =>
    this.items().reduce((sum, i) => sum + i.cost, 0)
  );

  patientCount = computed(() =>
    new Set(this.items().map(i => i.patientId)).size
  );

  averageAgeDays = computed(() => {
    const items = this.items();
    if (items.length === 0) return 0;
    const now = new Date().getTime();
    const totalDays = items.reduce((sum, i) => {
      const start = new Date(i.startDate).getTime();
      return sum + (now - start) / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(totalDays / items.length);
  });

  groupedByPatient = computed(() => {
    const map = new Map<string, { patientId: string; patientName: string; items: PendingBillingItem[]; total: number }>();
    for (const item of this.items()) {
      const key = item.patientId;
      if (!map.has(key)) {
        map.set(key, { patientId: key, patientName: item.patientName || 'Sin nombre', items: [], total: 0 });
      }
      const group = map.get(key)!;
      group.items.push(item);
      group.total += item.cost;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  });

  ngOnInit(): void {
    this.loadPendingBilling();
  }

  private loadPendingBilling(): void {
    this.loading.set(true);
    this.error.set(null);

    this.invoicesService.getPendingBilling().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading pending billing:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onGenerateInvoice(patientId: string): void {
    this.router.navigate(['/invoices', 'new'], {
      queryParams: { patientId }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  formatDate(date: Date | string): string {
    return DateFormatService.shortDate(date);
  }
}
