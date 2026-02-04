import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PieChartComponent, BarChartComponent, ChartDataItem } from '../../../../shared/components/charts';
import { AppointmentsService } from '../../services/appointments.service';
import { AppointmentsAnalyticsService } from '../../services/appointments-analytics.service';
import {
  UpcomingAppointment,
  PendingConfirmation,
  StatusDistribution,
  WeekdayDistribution,
  AppointmentActivity,
  FrequentPatient,
  AppointmentDashboardMetrics,
  APPOINTMENT_ACTIVITY_CONFIG
} from '../../models/appointments-analytics.models';
import { ROUTES } from '../../../../core/constants/routes.constants';

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-appointments-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PieChartComponent, BarChartComponent],
  templateUrl: './appointments-dashboard.html',
  styleUrls: ['./appointments-dashboard.scss']
})
export class AppointmentsDashboardComponent implements OnInit {
  private appointmentsService = inject(AppointmentsService);
  private analyticsService = inject(AppointmentsAnalyticsService);

  // Estados de carga
  loading = signal(true);
  error = signal<string | null>(null);

  // Métricas principales
  metrics = signal<AppointmentDashboardMetrics | null>(null);

  // Datos de listas
  loadingUpcoming = signal(false);
  upcomingAppointments = signal<UpcomingAppointment[]>([]);

  loadingPending = signal(false);
  pendingConfirmations = signal<PendingConfirmation[]>([]);

  loadingActivity = signal(false);
  recentActivity = signal<AppointmentActivity[]>([]);

  loadingPatients = signal(false);
  frequentPatients = signal<FrequentPatient[]>([]);

  // Datos de gráficos
  loadingStatusChart = signal(false);
  statusDistribution = signal<StatusDistribution[]>([]);

  loadingWeekdayChart = signal(false);
  weekdayDistribution = signal<WeekdayDistribution[]>([]);

  // Configuración de actividades
  activityConfig = APPOINTMENT_ACTIVITY_CONFIG;

  // Breadcrumbs
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Citas' }
  ];

  // Accesos rápidos
  quickActions: QuickAction[] = [
    {
      label: 'Nueva Cita',
      description: 'Programar una cita',
      icon: 'fa-calendar-plus',
      route: ROUTES.APPOINTMENTS_NEW
    },
    {
      label: 'Calendario',
      description: 'Ver calendario completo',
      icon: 'fa-calendar-days',
      route: ROUTES.APPOINTMENTS_CALENDAR
    },
    {
      label: 'Lista de Citas',
      description: 'Ver todas las citas',
      icon: 'fa-list',
      route: ROUTES.APPOINTMENTS
    },
    {
      label: 'Pacientes',
      description: 'Gestionar pacientes',
      icon: 'fa-users',
      route: ROUTES.PATIENTS
    }
  ];

  // Computed: Datos para gráfico de estados
  statusChartData = computed<ChartDataItem[]>(() =>
    this.statusDistribution()
      .filter(s => s.count > 0)
      .map(s => ({
        label: s.label,
        value: s.count
      }))
  );

  // Computed: Datos para gráfico de días
  weekdayChartData = computed<ChartDataItem[]>(() =>
    this.weekdayDistribution()
      .filter(d => d.dayNumber >= 1 && d.dayNumber <= 5) // Solo días laborales
      .map(d => ({
        label: d.dayName.substring(0, 3),
        value: d.count
      }))
  );

  // Computed: Alertas (citas sin confirmar)
  totalPendingAlerts = computed(() => this.metrics()?.pendingConfirmations || 0);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    
    // Cargar métricas principales
    this.analyticsService.getDashboardMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard metrics:', err);
        this.error.set('Error al cargar datos del dashboard');
        this.loading.set(false);
      }
    });

    // Cargar datos adicionales en paralelo
    this.loadUpcomingAppointments();
    this.loadPendingConfirmations();
    this.loadRecentActivity();
    this.loadStatusDistribution();
    this.loadWeekdayDistribution();
    this.loadFrequentPatients();
  }

  private loadUpcomingAppointments(): void {
    this.loadingUpcoming.set(true);
    this.analyticsService.getUpcomingToday(5).subscribe({
      next: (appointments) => {
        this.upcomingAppointments.set(appointments);
        this.loadingUpcoming.set(false);
      },
      error: (err) => {
        console.error('Error loading upcoming appointments:', err);
        this.loadingUpcoming.set(false);
      }
    });
  }

  private loadPendingConfirmations(): void {
    this.loadingPending.set(true);
    this.analyticsService.getPendingConfirmations(5).subscribe({
      next: (pending) => {
        this.pendingConfirmations.set(pending);
        this.loadingPending.set(false);
      },
      error: (err) => {
        console.error('Error loading pending confirmations:', err);
        this.loadingPending.set(false);
      }
    });
  }

  private loadRecentActivity(): void {
    this.loadingActivity.set(true);
    this.analyticsService.getRecentActivity(5).subscribe({
      next: (activities) => {
        this.recentActivity.set(activities);
        this.loadingActivity.set(false);
      },
      error: (err) => {
        console.error('Error loading recent activity:', err);
        this.loadingActivity.set(false);
      }
    });
  }

  private loadStatusDistribution(): void {
    this.loadingStatusChart.set(true);
    this.analyticsService.getStatusDistribution().subscribe({
      next: (distribution) => {
        this.statusDistribution.set(distribution);
        this.loadingStatusChart.set(false);
      },
      error: (err) => {
        console.error('Error loading status distribution:', err);
        this.loadingStatusChart.set(false);
      }
    });
  }

  private loadWeekdayDistribution(): void {
    this.loadingWeekdayChart.set(true);
    this.analyticsService.getWeekdayDistribution().subscribe({
      next: (distribution) => {
        this.weekdayDistribution.set(distribution);
        this.loadingWeekdayChart.set(false);
      },
      error: (err) => {
        console.error('Error loading weekday distribution:', err);
        this.loadingWeekdayChart.set(false);
      }
    });
  }

  private loadFrequentPatients(): void {
    this.loadingPatients.set(true);
    this.analyticsService.getFrequentPatients(5).subscribe({
      next: (patients) => {
        this.frequentPatients.set(patients);
        this.loadingPatients.set(false);
      },
      error: (err) => {
        console.error('Error loading frequent patients:', err);
        this.loadingPatients.set(false);
      }
    });
  }

  // Helpers para el template
  getActivityIcon(type: string): string {
    return this.activityConfig[type as keyof typeof this.activityConfig]?.icon || 'fa-circle';
  }

  getActivityColor(type: string): string {
    return this.activityConfig[type as keyof typeof this.activityConfig]?.color || 'info';
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(date));
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short'
    }).format(new Date(date));
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Hace menos de 1 hora';
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  }

  getUrgencyClass(hoursUntil: number): string {
    if (hoursUntil <= 2) return 'urgency-critical';
    if (hoursUntil <= 24) return 'urgency-warning';
    return 'urgency-info';
  }
}
