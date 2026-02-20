import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ReportsService } from '../../services/reports.service';
import { IncomeReport } from '../../models/report.models';

@Component({
  selector: 'app-income-report',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './income-report.html',
  styleUrl: './income-report.scss'
})
export class IncomeReportComponent implements OnInit {
  private reportsService = inject(ReportsService);

  report = signal<IncomeReport | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  startDate = signal(this.getDefaultStart());
  endDate = signal(this.getDefaultEnd());

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Reportes', route: '/reports' },
    { label: 'Ingresos' }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reportsService.getIncomeReport(this.startDate(), this.endDate()).subscribe({
      next: (data) => { this.report.set(data); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar el reporte de ingresos'); this.loading.set(false); }
    });
  }

  onDateChange(): void {
    this.loadReport();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(new Date(date));
  }

  getMaxAmount(): number {
    const r = this.report();
    if (!r || !r.dailyBreakdown.length) return 1;
    return Math.max(...r.dailyBreakdown.map(d => d.amount));
  }

  private getDefaultStart(): string {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }

  private getDefaultEnd(): string {
    return new Date().toISOString().split('T')[0];
  }
}
