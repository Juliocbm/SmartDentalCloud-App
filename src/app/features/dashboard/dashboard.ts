import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import {
  DashboardStats,
  UpcomingAppointment,
  QuickStat,
  LowStockProduct,
  MonthlyRevenueData
} from '../../core/models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  stats = signal<DashboardStats | null>(null);
  kpis = signal<QuickStat[]>([]);
  upcomingAppointments = signal<UpcomingAppointment[]>([]);
  lowStockProducts = signal<LowStockProduct[]>([]);
  revenueData = signal<MonthlyRevenueData | null>(null);
  loading = signal(true);

  quickActions = [
    { icon: 'fa-calendar-plus', title: 'Nueva Cita', subtitle: 'Agendar paciente', route: '/appointments/new' },
    { icon: 'fa-user-plus', title: 'Nuevo Paciente', subtitle: 'Registrar paciente', route: '/patients/new' },
    { icon: 'fa-file-invoice', title: 'Nueva Factura', subtitle: 'Generar factura', route: '/invoices/new' },
    { icon: 'fa-tooth', title: 'Nuevo Tratamiento', subtitle: 'Iniciar tratamiento', route: '/treatments/new' },
    { icon: 'fa-box', title: 'Inventario', subtitle: 'Gestionar productos', route: '/inventory' },
    { icon: 'fa-chart-line', title: 'Reportes', subtitle: 'Ver estadísticas', route: '/reports' }
  ];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);

    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.buildKpis(stats);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.loading.set(false);
      }
    });

    this.dashboardService.getUpcomingAppointments(5).subscribe({
      next: (appointments) => this.upcomingAppointments.set(appointments)
    });

    this.dashboardService.getLowStockProducts(5).subscribe({
      next: (products) => this.lowStockProducts.set(products)
    });

    this.dashboardService.getMonthlyRevenueData(6).subscribe({
      next: (data) => this.revenueData.set(data)
    });
  }

  private buildKpis(stats: DashboardStats): void {
    this.kpis.set([
      {
        label: 'Citas de Hoy',
        value: stats.todayAppointments,
        icon: 'fa-calendar-check',
        color: 'primary',
        trend: 12,
        trendDirection: 'up'
      },
      {
        label: 'Nuevos Pacientes',
        value: stats.newPatientsThisMonth,
        icon: 'fa-user-plus',
        color: 'success',
        trend: 8,
        trendDirection: 'up'
      },
      {
        label: 'Ingresos del Mes',
        value: this.formatCurrency(stats.monthlyRevenue),
        icon: 'fa-dollar-sign',
        color: 'info',
        trend: 15,
        trendDirection: 'up'
      },
      {
        label: 'Tratamientos Activos',
        value: stats.activeTreatmentPlans,
        icon: 'fa-tooth',
        color: 'warning'
      },
      {
        label: 'Productos con Stock Bajo',
        value: stats.lowStockProducts,
        icon: 'fa-exclamation-triangle',
        color: 'error',
        trend: stats.lowStockProducts > 0 ? -5 : 0,
        trendDirection: stats.lowStockProducts > 0 ? 'down' : 'neutral'
      },
      {
        label: 'Citas Pendientes',
        value: stats.pendingAppointments,
        icon: 'fa-clock',
        color: 'neutral'
      }
    ]);
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Scheduled': 'badge-primary',
      'Confirmed': 'badge-success',
      'Completed': 'badge-success',
      'Cancelled': 'badge-error',
      'NoShow': 'badge-warning',
      'Pending': 'badge-warning'
    };
    return statusMap[status] || 'badge-neutral';
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  }

  onQuickAction(action: any): void {
    console.log('Navigate to:', action.route);
  }

  refreshData(): void {
    this.loadDashboardData();
  }
}
