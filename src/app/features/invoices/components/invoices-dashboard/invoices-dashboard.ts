import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PieChartComponent, ChartDataItem } from '../../../../shared/components/charts';
import { InvoicesService } from '../../services/invoices.service';
import { Invoice, InvoiceStatus, INVOICE_STATUS_CONFIG } from '../../models/invoice.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { ROUTES } from '../../../../core/constants/routes.constants';

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-invoices-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PieChartComponent],
  templateUrl: './invoices-dashboard.html',
  styleUrl: './invoices-dashboard.scss'
})
export class InvoicesDashboardComponent implements OnInit {
  private invoicesService = inject(InvoicesService);
  private logger = inject(LoggingService);

  loading = signal(true);
  error = signal<string | null>(null);
  invoices = signal<Invoice[]>([]);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Facturación' }
  ];

  quickActions: QuickAction[] = [
    {
      label: 'Nueva Factura',
      description: 'Crear una factura',
      icon: 'fa-file-circle-plus',
      route: ROUTES.INVOICES_NEW
    },
    {
      label: 'Lista de Facturas',
      description: 'Ver todas las facturas',
      icon: 'fa-list',
      route: ROUTES.INVOICES_LIST
    },
    {
      label: 'Pagos',
      description: 'Historial de pagos',
      icon: 'fa-money-bill-wave',
      route: '/payments'
    },
    {
      label: 'Pacientes',
      description: 'Gestionar pacientes',
      icon: 'fa-users',
      route: ROUTES.PATIENTS
    }
  ];

  // Computed metrics
  totals = computed(() => this.invoicesService.calculateTotals(this.invoices()));

  invoicesByStatus = computed(() => {
    const invs = this.invoices();
    return {
      pending: invs.filter(i => i.status === InvoiceStatus.Pending).length,
      partial: invs.filter(i => i.status === InvoiceStatus.PartiallyPaid).length,
      paid: invs.filter(i => i.status === InvoiceStatus.Paid).length,
      cancelled: invs.filter(i => i.status === InvoiceStatus.Cancelled).length,
      overdue: invs.filter(i => i.status === InvoiceStatus.Overdue).length
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
    if (byStatus.pending > 0) items.push({ label: 'Pendiente', value: byStatus.pending });
    if (byStatus.partial > 0) items.push({ label: 'Parcial', value: byStatus.partial });
    if (byStatus.paid > 0) items.push({ label: 'Pagada', value: byStatus.paid });
    if (byStatus.cancelled > 0) items.push({ label: 'Cancelada', value: byStatus.cancelled });
    if (byStatus.overdue > 0) items.push({ label: 'Vencida', value: byStatus.overdue });
    return items;
  });

  recentInvoices = computed(() => {
    return [...this.invoices()]
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
      .slice(0, 5);
  });

  overdueInvoices = computed(() => {
    return this.invoices().filter(i => i.status === InvoiceStatus.Overdue || (i.balance > 0 && i.status !== InvoiceStatus.Paid && i.status !== InvoiceStatus.Cancelled));
  });

  INVOICE_STATUS_CONFIG = INVOICE_STATUS_CONFIG;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.invoicesService.getAll().subscribe({
      next: (data) => {
        this.invoices.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading invoices dashboard:', err);
        this.error.set('Error al cargar datos de facturación');
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
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }
}
