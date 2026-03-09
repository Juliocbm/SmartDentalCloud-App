import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PieChartComponent, LineChartComponent, ChartDataItem, LineDataset } from '../../../../shared/components/charts';
import { DateRangePickerComponent, DateRange } from '../../../../shared/components/date-range-picker/date-range-picker';
import { TreatmentsService } from '../../services/treatments.service';
import { Treatment, TreatmentStatus, TREATMENT_STATUS_CONFIG } from '../../models/treatment.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-treatment-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PieChartComponent, LineChartComponent, DateRangePickerComponent],
  templateUrl: './treatment-dashboard.html',
  styleUrl: './treatment-dashboard.scss'
})
export class TreatmentDashboardComponent implements OnInit {
  private treatmentsService = inject(TreatmentsService);
  private logger = inject(LoggingService);

  dateRange = signal<DateRange>(this.getDefaultDateRange());
  loading = signal(true);
  error = signal<string | null>(null);
  treatments = signal<Treatment[]>([]);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Tratamientos', route: '/treatments' },
    { label: 'Dashboard' }
  ];

  statusCounts = computed(() => {
    const all = this.treatments();
    return {
      total: all.length,
      inProgress: all.filter(t => t.status === TreatmentStatus.InProgress).length,
      completed: all.filter(t => t.status === TreatmentStatus.Completed).length,
      cancelled: all.filter(t => t.status === TreatmentStatus.Cancelled).length,
      onHold: all.filter(t => t.status === TreatmentStatus.OnHold).length
    };
  });

  completionRate = computed(() => {
    const c = this.statusCounts();
    if (c.total === 0) return 0;
    return Math.round((c.completed / c.total) * 100);
  });

  recentTreatments = computed(() => {
    return [...this.treatments()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  });

  activeTreatments = computed(() => {
    return this.treatments().filter(t => t.status === TreatmentStatus.InProgress);
  });

  statusChartData = computed<ChartDataItem[]>(() => {
    const counts = this.statusCounts();
    const config = TREATMENT_STATUS_CONFIG;

    const items: ChartDataItem[] = [
      { label: config[TreatmentStatus.InProgress].label, value: counts.inProgress },
      { label: config[TreatmentStatus.Completed].label, value: counts.completed },
      { label: config[TreatmentStatus.OnHold].label, value: counts.onHold },
      { label: config[TreatmentStatus.Cancelled].label, value: counts.cancelled }
    ];

    return items.filter(item => item.value > 0);
  });

  timelineLabels = computed<string[]>(() => {
    const trend = this.buildMonthlyTrend();
    return trend.labels;
  });

  timelineDatasets = computed<LineDataset[]>(() => {
    const trend = this.buildMonthlyTrend();

    if (trend.labels.length === 0) {
      return [];
    }

    const datasets: LineDataset[] = [];

    if (trend.started.some(v => v > 0)) {
      datasets.push({
        label: 'Iniciados',
        data: trend.started,
        fill: false
      });
    }

    if (trend.completed.some(v => v > 0)) {
      datasets.push({
        label: 'Completados',
        data: trend.completed,
        fill: true
      });
    }

    return datasets;
  });

  TREATMENT_STATUS_CONFIG = TREATMENT_STATUS_CONFIG;

  ngOnInit(): void {
    this.loadData();
  }

  onDateRangeChange(range: DateRange | null): void {
    if (!range) return;
    this.dateRange.set(range);
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    const { start, end } = this.dateRange();
    this.treatmentsService.getAll(start, end).subscribe({
      next: (data) => {
        this.treatments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading treatments dashboard:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  getStatusConfig(status: TreatmentStatus) {
    return TREATMENT_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(new Date(date));
  }

  private getDefaultDateRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      end: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    };
  }

  private buildMonthlyTrend(): { labels: string[]; started: number[]; completed: number[] } {
    const { start: rangeStart, end: rangeEnd } = this.dateRange();
    const startDate = new Date(rangeStart);
    const endDate = new Date(rangeEnd);

    const months: { key: string; date: Date }[] = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (cursor <= endDate) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, date: new Date(cursor) });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    if (months.length === 0) {
      return { labels: [], started: [], completed: [] };
    }

    const startedMap = new Map<string, number>();
    const completedMap = new Map<string, number>();

    this.treatments().forEach(t => {
      const s = new Date(t.startDate);
      const key = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}`;
      startedMap.set(key, (startedMap.get(key) ?? 0) + 1);

      if (t.endDate) {
        const e = new Date(t.endDate);
        const eKey = `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, '0')}`;
        completedMap.set(eKey, (completedMap.get(eKey) ?? 0) + 1);
      }
    });

    const labels = months.map(m => this.formatMonthLabel(m.date));
    const started = months.map(m => startedMap.get(m.key) ?? 0);
    const completed = months.map(m => completedMap.get(m.key) ?? 0);

    return { labels, started, completed };
  }

  private formatMonthLabel(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      month: 'short',
      year: '2-digit'
    }).format(date);
  }
}
