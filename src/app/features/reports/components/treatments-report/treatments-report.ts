import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ReportsService } from '../../services/reports.service';
import { TreatmentsSummary } from '../../models/report.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { DateRangePickerComponent, DateRange } from '../../../../shared/components/date-range-picker/date-range-picker';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-treatments-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, DateRangePickerComponent, EmptyStateComponent],
  templateUrl: './treatments-report.html',
  styleUrl: './treatments-report.scss'
})
export class TreatmentsReportComponent implements OnInit {
  private reportsService = inject(ReportsService);

  report = signal<TreatmentsSummary | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  startDate = signal(this.getDefaultStart());
  endDate = signal(this.getDefaultEnd());

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Reportes', route: '/reports' },
    { label: 'Tratamientos' }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reportsService.getTreatmentsSummary(this.startDate(), this.endDate()).subscribe({
      next: (data) => { this.report.set(data); this.loading.set(false); },
      error: (err) => { this.error.set(getApiErrorMessage(err)); this.loading.set(false); }
    });
  }

  onRangeChange(range: DateRange | null): void {
    if (range) {
      this.startDate.set(range.start);
      this.endDate.set(range.end);
      this.loadReport();
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  private getDefaultStart(): string {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  }

  private getDefaultEnd(): string {
    return new Date().toISOString().split('T')[0];
  }
}
