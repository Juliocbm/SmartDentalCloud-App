import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { TreatmentPlansService } from '../../services/treatment-plans.service';
import {
  TreatmentPlan,
  TreatmentPlanStatus,
  TREATMENT_PLAN_STATUS_CONFIG
} from '../../models/treatment-plan.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-treatment-plan-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, CurrencyPipe],
  templateUrl: './treatment-plan-dashboard.html',
  styleUrl: './treatment-plan-dashboard.scss'
})
export class TreatmentPlanDashboardComponent implements OnInit {
  private plansService = inject(TreatmentPlansService);
  private logger = inject(LoggingService);

  loading = signal(true);
  error = signal<string | null>(null);
  plans = signal<TreatmentPlan[]>([]);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Planes de Tratamiento', route: '/treatment-plans' },
    { label: 'Dashboard' }
  ];

  statusCounts = computed(() => {
    const all = this.plans();
    return {
      total: all.length,
      draft: all.filter(p => p.status === TreatmentPlanStatus.Draft).length,
      pendingApproval: all.filter(p => p.status === TreatmentPlanStatus.PendingApproval).length,
      approved: all.filter(p => p.status === TreatmentPlanStatus.Approved).length,
      inProgress: all.filter(p => p.status === TreatmentPlanStatus.InProgress).length,
      completed: all.filter(p => p.status === TreatmentPlanStatus.Completed).length,
      rejected: all.filter(p => p.status === TreatmentPlanStatus.Rejected).length,
      cancelled: all.filter(p => p.status === TreatmentPlanStatus.Cancelled).length
    };
  });

  approvalRate = computed(() => {
    const c = this.statusCounts();
    const decided = c.approved + c.rejected + c.inProgress + c.completed;
    const total = decided + c.pendingApproval;
    if (total === 0) return 0;
    return Math.round((decided / total) * 100);
  });

  totalEstimatedValue = computed(() => {
    return this.plans().reduce((sum, p) => sum + p.totalEstimatedCost, 0);
  });

  pendingApprovalPlans = computed(() => {
    return this.plans()
      .filter(p => p.status === TreatmentPlanStatus.PendingApproval)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  activePlans = computed(() => {
    return this.plans()
      .filter(p => p.status === TreatmentPlanStatus.InProgress || p.status === TreatmentPlanStatus.Approved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  recentPlans = computed(() => {
    return [...this.plans()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  });

  TREATMENT_PLAN_STATUS_CONFIG = TREATMENT_PLAN_STATUS_CONFIG;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.plansService.getAll().subscribe({
      next: (data) => {
        this.plans.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading treatment plans dashboard:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  getStatusConfig(status: string) {
    return TREATMENT_PLAN_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(new Date(date));
  }
}
