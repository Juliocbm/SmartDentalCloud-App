import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { TreatmentPlansService } from '../../services/treatment-plans.service';
import {
  TreatmentPlan,
  TreatmentPlanStatus,
  TREATMENT_PLAN_STATUS_CONFIG
} from '../../models/treatment-plan.models';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-treatment-plan-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './treatment-plan-list.html',
  styleUrl: './treatment-plan-list.scss'
})
export class TreatmentPlanListComponent implements OnInit, OnDestroy {
  private plansService = inject(TreatmentPlansService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  // State
  plans = signal<TreatmentPlan[]>([]);
  filteredPlans = signal<TreatmentPlan[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  searchTerm = signal('');
  filterStatus = signal<'all' | TreatmentPlanStatus>('all');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  // Computed
  paginatedPlans = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredPlans().slice(start, end);
  });

  statusCounts = computed(() => {
    const all = this.plans();
    return {
      total: all.length,
      draft: all.filter(p => p.status === TreatmentPlanStatus.Draft).length,
      approved: all.filter(p => p.status === TreatmentPlanStatus.Approved).length,
      inProgress: all.filter(p => p.status === TreatmentPlanStatus.InProgress).length,
      completed: all.filter(p => p.status === TreatmentPlanStatus.Completed).length
    };
  });

  // Config
  statusOptions = Object.values(TreatmentPlanStatus);
  TreatmentPlanStatus = TreatmentPlanStatus;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Planes de Tratamiento' }
  ];

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.applyFilters();
    });

    this.loadPlans();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadPlans(): void {
    this.loading.set(true);
    this.error.set(null);

    this.plansService.getAll().subscribe({
      next: (data) => {
        this.plans.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading treatment plans:', err);
        this.error.set('Error al cargar los planes de tratamiento.');
        this.loading.set(false);
      }
    });
  }

  private applyFilters(): void {
    let filtered = [...this.plans()];
    const search = this.searchTerm().toLowerCase().trim();

    if (search) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(search) ||
        p.planNumber?.toLowerCase().includes(search) ||
        p.patientName?.toLowerCase().includes(search) ||
        p.diagnosis?.toLowerCase().includes(search)
      );
    }

    const status = this.filterStatus();
    if (status !== 'all') {
      filtered = filtered.filter(p => p.status === status);
    }

    this.filteredPlans.set(filtered);
    this.totalItems.set(filtered.length);
    this.totalPages.set(Math.ceil(filtered.length / this.pageSize()));
    this.currentPage.set(1);
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: string): void {
    this.filterStatus.set(value as 'all' | TreatmentPlanStatus);
    this.applyFilters();
  }

  getStatusConfig(status: string) {
    return TREATMENT_PLAN_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  getProgressPercentage(plan: TreatmentPlan): number {
    if (plan.totalItems === 0) return 0;
    return Math.round((plan.completedItems / plan.totalItems) * 100);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPaginationPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (current >= total - 2) {
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        for (let i = current - 2; i <= current + 2; i++) pages.push(i);
      }
    }
    return pages;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }
}
