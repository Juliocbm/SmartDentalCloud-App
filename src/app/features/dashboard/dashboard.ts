import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { DashboardService } from './services/dashboard.service';
import { DashboardData, QuickAction } from './models/dashboard.models';
import { LoggingService } from '../../core/services/logging.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private logger = inject(LoggingService);

  loading = signal(true);
  data = signal<DashboardData | null>(null);

  quickActions: QuickAction[] = [
    { label: 'Nueva Cita', description: 'Agendar paciente', icon: 'fa-calendar-plus', route: '/appointments/new', color: 'primary' },
    { label: 'Nuevo Paciente', description: 'Registrar paciente', icon: 'fa-user-plus', route: '/patients/new', color: 'success' },
    { label: 'Nueva Factura', description: 'Generar factura', icon: 'fa-file-invoice', route: '/invoices/new', color: 'info' },
    { label: 'Nuevo Tratamiento', description: 'Iniciar tratamiento', icon: 'fa-tooth', route: '/treatments/new', color: 'primary' },
    { label: 'Calendario', description: 'Ver agenda de citas', icon: 'fa-calendar-days', route: '/appointments', color: 'warning' },
    { label: 'Reportes', description: 'Ver estadísticas', icon: 'fa-chart-line', route: '/reports', color: 'success' }
  ];

  todayAppointmentsCount = computed(() => this.data()?.todayAppointments.length ?? 0);
  monthlyIncome = computed(() => this.data()?.income.totalIncome ?? 0);
  pendingBalance = computed(() => this.data()?.income.totalPending ?? 0);
  activeTreatmentsCount = computed(() =>
    this.data()?.treatments.filter(t => t.status === 'InProgress').length ?? 0
  );
  pendingApprovalCount = computed(() =>
    this.data()?.treatmentPlans.filter(p => p.status === 'PendingApproval').length ?? 0
  );
  lowStockCount = computed(() => this.data()?.inventory.lowStockProducts ?? 0);

  upcomingAppointments = computed(() => this.data()?.upcomingAppointments ?? []);
  pendingPlans = computed(() =>
    this.data()?.treatmentPlans
      .filter(p => p.status === 'PendingApproval')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8) ?? []
  );
  lowStockItems = computed(() => this.data()?.inventory.lowStockItems ?? []);

  ngOnInit(): void {
    this.loadData();
  }

  refreshData(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.dashboardService.loadDashboardData().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading dashboard:', err);
        this.loading.set(false);
      }
    });
  }

  getAppointmentStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Scheduled': 'badge-primary',
      'Confirmed': 'badge-info',
      'Completed': 'badge-success',
      'Cancelled': 'badge-error',
      'NoShow': 'badge-warning'
    };
    return map[status] || 'badge-neutral';
  }

  getAppointmentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'Scheduled': 'Programada',
      'Confirmed': 'Confirmada',
      'Completed': 'Completada',
      'Cancelled': 'Cancelada',
      'NoShow': 'No Asistió'
    };
    return map[status] || status;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
