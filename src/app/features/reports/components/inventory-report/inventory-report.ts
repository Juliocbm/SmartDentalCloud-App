import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ReportsService } from '../../services/reports.service';
import { InventorySummary } from '../../models/report.models';

@Component({
  selector: 'app-inventory-report',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './inventory-report.html',
  styleUrl: './inventory-report.scss'
})
export class InventoryReportComponent implements OnInit {
  private reportsService = inject(ReportsService);

  report = signal<InventorySummary | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Reportes', route: '/reports' },
    { label: 'Inventario' }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reportsService.getInventorySummary().subscribe({
      next: (data) => { this.report.set(data); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar el reporte de inventario'); this.loading.set(false); }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  getStockClass(current: number, minimum: number): string {
    if (current <= 0) return 'stock-critical';
    if (current <= minimum) return 'stock-warning';
    return 'stock-ok';
  }
}
