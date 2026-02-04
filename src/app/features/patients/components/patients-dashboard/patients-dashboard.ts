import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { BarChartComponent, ChartDataItem } from '../../../../shared/components/charts';
import { PatientsAnalyticsService } from '../../services/patients-analytics.service';
import { ROUTES } from '../../../../core/constants/routes.constants';
import {
  PatientsAnalytics,
  PatientsStatistics,
  PatientAlert,
  PatientListItem,
  PatientBirthday,
  PatientWithBalance,
  AgeGroupData,
  PatientTypeData,
  PATIENT_ALERT_CONFIG
} from '../../models/patients-analytics.models';

interface DashboardMetric {
  label: string;
  value: number | string;
  icon: string;
  trend?: { value: number; isPositive: boolean };
  color: string;
}

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
}

/**
 * Dashboard de pacientes con métricas, alertas y gráficos
 */
@Component({
  selector: 'app-patients-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, BarChartComponent],
  templateUrl: './patients-dashboard.html',
  styleUrls: ['./patients-dashboard.scss']
})
export class PatientsDashboardComponent implements OnInit {
  private analyticsService = inject(PatientsAnalyticsService);
  private router = inject(Router);

  // Breadcrumbs
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Pacientes' }
  ];

  // Estado
  loading = signal(true);
  error = signal<string | null>(null);

  // Datos
  statistics = signal<PatientsStatistics | null>(null);
  alerts = signal<PatientAlert[]>([]);
  recentPatients = signal<PatientListItem[]>([]);
  birthdays = signal<PatientBirthday[]>([]);
  patientsWithBalance = signal<PatientWithBalance[]>([]);
  ageDistribution = signal<AgeGroupData[]>([]);
  patientTrend = signal<PatientTypeData[]>([]);

  // Métricas computadas
  metrics = computed<DashboardMetric[]>(() => {
    const stats = this.statistics();
    if (!stats) return [];

    return [
      {
        label: 'Total Pacientes',
        value: stats.totalPatients.toLocaleString(),
        icon: 'fa-solid fa-users',
        color: 'primary'
      },
      {
        label: 'Nuevos este Mes',
        value: stats.newThisMonth,
        icon: 'fa-solid fa-user-plus',
        trend: { value: 12, isPositive: true },
        color: 'success'
      },
      {
        label: 'Activos',
        value: stats.activePatients.toLocaleString(),
        icon: 'fa-solid fa-user-check',
        color: 'info'
      },
      {
        label: 'Inactivos',
        value: stats.inactivePatients,
        icon: 'fa-solid fa-user-clock',
        color: 'warning'
      }
    ];
  });

  // Indicadores secundarios
  indicators = computed(() => {
    const stats = this.statistics();
    if (!stats) return [];

    const total = stats.genderDistribution.male + stats.genderDistribution.female + stats.genderDistribution.other;
    
    return [
      {
        label: 'Edad Promedio',
        value: `${stats.averageAge.toFixed(1)} años`,
        icon: 'fa-solid fa-calendar-alt'
      },
      {
        label: 'Nuevos esta Semana',
        value: stats.newThisWeek.toString(),
        icon: 'fa-solid fa-calendar-week'
      },
      {
        label: 'Masculino',
        value: `${((stats.genderDistribution.male / total) * 100).toFixed(0)}%`,
        icon: 'fa-solid fa-mars'
      },
      {
        label: 'Femenino',
        value: `${((stats.genderDistribution.female / total) * 100).toFixed(0)}%`,
        icon: 'fa-solid fa-venus'
      }
    ];
  });

  // Acciones rápidas
  quickActions: QuickAction[] = [
    {
      label: 'Nuevo Paciente',
      description: 'Registrar nuevo paciente',
      icon: 'fa-user-plus',
      route: '/patients/new'
    },
    {
      label: 'Lista de Pacientes',
      description: 'Ver todos los pacientes',
      icon: 'fa-list',
      route: '/patients'
    },
    {
      label: 'Citas',
      description: 'Gestionar citas',
      icon: 'fa-calendar-days',
      route: '/appointments'
    },
    {
      label: 'Tratamientos',
      description: 'Ver tratamientos',
      icon: 'fa-tooth',
      route: '/treatments'
    }
  ];

  // Conteo de alertas
  alertsCount = computed(() => this.alerts().length);
  criticalAlertsCount = computed(() => 
    this.alerts().filter(a => a.severity === 'high').length
  );

  // Total saldo pendiente
  totalPendingBalance = computed(() => 
    this.patientsWithBalance().reduce((sum, p) => sum + p.pendingBalance, 0)
  );

  // Datos para gráfico de distribución por edad
  ageChartData = computed<ChartDataItem[]>(() => 
    this.ageDistribution().map(group => ({
      label: group.ageGroup,
      value: group.count
    }))
  );

  // Datos para gráfico de nuevos pacientes por mes
  newPatientsChartData = computed<ChartDataItem[]>(() => 
    this.patientTrend().map(data => ({
      label: data.period,
      value: data.newPatients
    }))
  );

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.analyticsService.getDashboardData().subscribe({
      next: (data) => {
        this.statistics.set(data.statistics);
        this.alerts.set(data.alerts);
        this.recentPatients.set(data.recentPatients);
        this.birthdays.set(data.birthdaysThisMonth);
        this.patientsWithBalance.set(data.patientsWithBalance);
        this.ageDistribution.set(data.ageDistribution);
        this.patientTrend.set(data.patientTrend);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading patients dashboard:', err);
        this.error.set('Error al cargar los datos del dashboard');
        this.loading.set(false);
      }
    });
  }

  // === Navegación ===

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  viewPatient(patientId: string): void {
    this.router.navigate(['/patients', patientId]);
  }

  viewAllPatients(): void {
    this.router.navigate(['/patients']);
  }

  // === Helpers ===

  getAlertConfig(type: string) {
    return PATIENT_ALERT_CONFIG[type as keyof typeof PATIENT_ALERT_CONFIG] || {
      icon: 'fa-solid fa-info-circle',
      color: 'secondary',
      label: 'Alerta'
    };
  }

  getAlertSeverityClass(severity: string): string {
    const classes: Record<string, string> = {
      'high': 'alert--danger',
      'medium': 'alert--warning',
      'low': 'alert--info'
    };
    return classes[severity] || 'alert--info';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short'
    }).format(new Date(date));
  }

  getBirthdayLabel(days: number): string {
    if (days === 0) return '¡Hoy!';
    if (days === 1) return 'Mañana';
    return `En ${days} días`;
  }

  getDaysLabel(days: number | null): string {
    if (days === null) return 'Sin pagos';
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  }

  refresh(): void {
    this.loadDashboardData();
  }
}
