import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { BarChartComponent, ChartDataItem } from '../../../../shared/components/charts';
import { DateRangePickerComponent, DateRange } from '../../../../shared/components/date-range-picker/date-range-picker';
import { DentistAnalyticsService } from '../../services/dentist-analytics.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { User } from '../../models/user.models';
import { DentistProductivity, AppointmentOccupancy } from '../../../reports/models/report.models';
import { DentistAutocompleteComponent } from '../../../../shared/components/dentist-autocomplete/dentist-autocomplete';
import { DentistListItem } from '../../../../core/models/user.models';
import {
  DentistDashboardMetrics,
  DentistRanking,
  DentistTeamMember,
  DentistIndividualMetrics
} from '../../models/dentist-analytics.models';
import { ROUTES } from '../../../../core/constants/routes.constants';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { FeatureService } from '../../../../core/services/feature.service';

@Component({
  selector: 'app-dentist-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, BarChartComponent, DateRangePickerComponent, DentistAutocompleteComponent],
  templateUrl: './dentist-dashboard.html',
  styleUrl: './dentist-dashboard.scss'
})
export class DentistDashboardComponent implements OnInit {
  private analyticsService = inject(DentistAnalyticsService);
  private logger = inject(LoggingService);
  featureService = inject(FeatureService);

  // Date range
  dateRange = signal<DateRange>(this.getDefaultDateRange());

  // Estados de carga
  loading = signal(true);
  error = signal<string | null>(null);

  // Datos base
  private dentists = signal<User[]>([]);
  private productivity = signal<DentistProductivity[]>([]);

  // Métricas KPI
  metrics = signal<DentistDashboardMetrics | null>(null);

  // Datos de gráficos
  revenueChartData = signal<ChartDataItem[]>([]);
  appointmentsChartData = signal<ChartDataItem[]>([]);

  // Datos de secciones
  topByRevenue = signal<DentistRanking[]>([]);
  topByTreatments = signal<DentistRanking[]>([]);
  teamList = signal<DentistTeamMember[]>([]);

  // Dentista seleccionado para ver métricas individuales
  selectedDentist = signal<User | null>(null);
  selectedDentistMetrics = signal<DentistIndividualMetrics | null>(null);
  private occupancyData = signal<AppointmentOccupancy | null>(null);

  // Dentistas sin actividad este mes
  inactiveDentistsCount = computed(() => {
    const m = this.metrics();
    if (!m) return 0;
    return m.totalDentists - this.productivity().length;
  });

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Dentistas', route: '/dentists' },
    { label: 'Dashboard' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  onDateRangeChange(range: DateRange | null): void {
    if (!range) return;
    this.dateRange.set(range);
    this.loadData();
  }

  onDentistSelected(dentist: DentistListItem | null): void {
    if (!dentist) {
      this.selectedDentist.set(null);
      this.selectedDentistMetrics.set(null);
      return;
    }
    const user = this.dentists().find(d => d.id === dentist.id) ?? null;
    this.selectedDentist.set(user);
    if (user) {
      this.updateSelectedDentistMetrics(user);
    }
  }

  private updateSelectedDentistMetrics(dentist: User): void {
    const metrics = this.analyticsService.getIndividualMetrics(
      dentist,
      this.productivity(),
      this.occupancyData()
    );
    this.selectedDentistMetrics.set(metrics);
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    const { start, end } = this.dateRange();

    this.analyticsService.loadDashboardData(start, end).subscribe({
      next: ({ dentists, productivity }) => {
        this.dentists.set(dentists);
        this.productivity.set(productivity);

        this.metrics.set(this.analyticsService.computeMetrics(dentists, productivity));
        this.revenueChartData.set(this.analyticsService.getRevenueChartData(dentists, productivity));
        this.appointmentsChartData.set(this.analyticsService.getAppointmentsChartData(dentists, productivity));
        this.topByRevenue.set(this.analyticsService.getTopByRevenue(dentists, productivity, 5));
        this.topByTreatments.set(this.analyticsService.getTopByTreatments(dentists, productivity, 5));
        this.teamList.set(this.analyticsService.getTeamList(dentists, productivity));

        this.analyticsService.loadOccupancyData(start, end).subscribe(occ => {
          this.occupancyData.set(occ);
          if (this.selectedDentist()) {
            this.updateSelectedDentistMetrics(this.selectedDentist()!);
          }
          this.loading.set(false);
        });
      },
      error: (err) => {
        this.logger.error('Error loading dentist dashboard:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private getDefaultDateRange(): DateRange {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      start: `${first.getFullYear()}-${pad(first.getMonth() + 1)}-${pad(first.getDate())}`,
      end: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  }
}
