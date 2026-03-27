import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ReportsService } from '../../services/reports.service';
import { DentistProductivity, TopService, BillingConversion } from '../../models/report.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { DateRangePickerComponent, DateRange } from '../../../../shared/components/date-range-picker/date-range-picker';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-billing-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, DateRangePickerComponent, EmptyStateComponent],
  templateUrl: './billing-reports.html',
  styleUrl: './billing-reports.scss'
})
export class BillingReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  startDate = signal(this.getDefaultStart());
  endDate = signal(this.getDefaultEnd());

  // Data
  productivity = signal<DentistProductivity[]>([]);
  topServices = signal<TopService[]>([]);
  conversion = signal<BillingConversion | null>(null);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Facturación', route: '/invoices' },
    { label: 'Reportes de Producción' }
  ];

  totalProduction = computed(() =>
    this.productivity().reduce((sum, d) => sum + d.revenueGenerated, 0)
  );

  totalTreatments = computed(() =>
    this.productivity().reduce((sum, d) => sum + d.treatmentsCompleted, 0)
  );

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.error.set(null);
    const start = this.startDate();
    const end = this.endDate();

    let pending = 3;
    const done = () => { pending--; if (pending <= 0) this.loading.set(false); };

    this.reportsService.getDentistProductivity(start, end).subscribe({
      next: (data) => { this.productivity.set(data); done(); },
      error: (err) => { this.error.set(getApiErrorMessage(err)); done(); }
    });

    this.reportsService.getTopServices(start, end, 10).subscribe({
      next: (data) => { this.topServices.set(data); done(); },
      error: () => done()
    });

    this.reportsService.getBillingConversion(start, end).subscribe({
      next: (data) => { this.conversion.set(data); done(); },
      error: () => done()
    });
  }

  onRangeChange(range: DateRange | null): void {
    if (range) {
      this.startDate.set(range.start);
      this.endDate.set(range.end);
      this.loadAll();
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  getMaxRevenue(): number {
    const items = this.productivity();
    if (!items.length) return 1;
    return Math.max(...items.map(d => d.revenueGenerated));
  }

  getServiceMaxRevenue(): number {
    const items = this.topServices();
    if (!items.length) return 1;
    return Math.max(...items.map(s => s.totalRevenue));
  }

  private getDefaultStart(): string {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  }

  private getDefaultEnd(): string {
    return new Date().toISOString().split('T')[0];
  }
}
