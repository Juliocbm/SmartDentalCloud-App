import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { TreatmentsService } from '../../services/treatments.service';
import { Treatment, TreatmentStatus, TREATMENT_STATUS_CONFIG } from '../../models/treatment.models';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-treatment-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './treatment-dashboard.html',
  styleUrl: './treatment-dashboard.scss'
})
export class TreatmentDashboardComponent implements OnInit {
  private treatmentsService = inject(TreatmentsService);
  private logger = inject(LoggingService);

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

  TREATMENT_STATUS_CONFIG = TREATMENT_STATUS_CONFIG;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.treatmentsService.getAll().subscribe({
      next: (data) => {
        this.treatments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading treatments dashboard:', err);
        this.error.set('Error al cargar datos de tratamientos');
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
}
