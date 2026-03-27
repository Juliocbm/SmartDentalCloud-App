import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PieChartComponent, ChartDataItem } from '../../../../shared/components/charts';
import { DateRangePickerComponent, DateRange } from '../../../../shared/components/date-range-picker/date-range-picker';
import { InvoicesService } from '../../services/invoices.service';
import { Invoice, InvoiceStatus, INVOICE_STATUS_CONFIG } from '../../models/invoice.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { ROUTES } from '../../../../core/constants/routes.constants';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert';

interface AgingBucket {
  label: string;
  count: number;
  total: number;
  cssClass: string;
}

@Component({
  selector: 'app-invoices-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PieChartComponent, DateRangePickerComponent, EmptyStateComponent, FormAlertComponent],
  templateUrl: './invoices-dashboard.html',
  styleUrl: './invoices-dashboard.scss'
})
export class InvoicesDashboardComponent implements OnInit {
  private invoicesService = inject(InvoicesService);
  private logger = inject(LoggingService);

  dateRange = signal<DateRange>(this.getDefaultDateRange());
  loading = signal(true);
  error = signal<string | null>(null);
  invoices = signal<Invoice[]>([]);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Facturación' }
  ];

  // Computed metrics
  totals = computed(() => this.invoicesService.calculateTotals(this.invoices()));

  invoicesByStatus = computed(() => {
    const invs = this.invoices();
    return {
      issued: invs.filter(i => i.status === InvoiceStatus.Issued).length,
      partial: invs.filter(i => i.status === InvoiceStatus.Partial).length,
      paid: invs.filter(i => i.status === InvoiceStatus.Paid).length,
      overpaid: invs.filter(i => i.status === InvoiceStatus.Overpaid).length,
      cancelled: invs.filter(i => i.status === InvoiceStatus.Cancelled).length
    };
  });

  collectionRate = computed(() => {
    const t = this.totals();
    if (t.total === 0) return 0;
    return (t.paid / t.total) * 100;
  });

  statusChartData = computed<ChartDataItem[]>(() => {
    const byStatus = this.invoicesByStatus();
    const items: ChartDataItem[] = [];
    if (byStatus.issued > 0) items.push({ label: 'Emitida', value: byStatus.issued });
    if (byStatus.partial > 0) items.push({ label: 'Parcial', value: byStatus.partial });
    if (byStatus.paid > 0) items.push({ label: 'Pagada', value: byStatus.paid });
    if (byStatus.overpaid > 0) items.push({ label: 'Sobrepagada', value: byStatus.overpaid });
    if (byStatus.cancelled > 0) items.push({ label: 'Cancelada', value: byStatus.cancelled });
    return items;
  });

  recentInvoices = computed(() => {
    return [...this.invoices()]
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
      .slice(0, 5);
  });

  unpaidInvoices = computed(() => {
    return this.invoices().filter(i => i.balance > 0 && i.status !== InvoiceStatus.Paid && i.status !== InvoiceStatus.Overpaid && i.status !== InvoiceStatus.Cancelled);
  });

  accountsReceivable = computed(() => {
    const pending = this.unpaidInvoices();
    const totalBalance = pending.reduce((sum, i) => sum + i.balance, 0);
    const now = new Date();

    const buckets: AgingBucket[] = [
      { label: 'Vigente (0-30d)', count: 0, total: 0, cssClass: 'ar-current' },
      { label: '31-60 días', count: 0, total: 0, cssClass: 'ar-warning' },
      { label: '61-90 días', count: 0, total: 0, cssClass: 'ar-high' },
      { label: '+90 días', count: 0, total: 0, cssClass: 'ar-critical' }
    ];

    for (const inv of pending) {
      const days = Math.floor((now.getTime() - new Date(inv.issuedAt).getTime()) / (1000 * 60 * 60 * 24));
      const idx = days <= 30 ? 0 : days <= 60 ? 1 : days <= 90 ? 2 : 3;
      buckets[idx].count++;
      buckets[idx].total += inv.balance;
    }

    return { totalBalance, totalCount: pending.length, buckets };
  });

  INVOICE_STATUS_CONFIG = INVOICE_STATUS_CONFIG;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  onDateRangeChange(range: DateRange | null): void {
    if (!range) return;
    this.dateRange.set(range);
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    const { start, end } = this.dateRange();
    this.invoicesService.getAll(start, end).subscribe({
      next: (data) => {
        this.invoices.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading invoices dashboard:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  getStatusConfig(status: InvoiceStatus) {
    return INVOICE_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  formatDate(date: Date): string {
    return DateFormatService.mediumDate(date);
  }

  private getDefaultDateRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      end: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    };
  }
}
