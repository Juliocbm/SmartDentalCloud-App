import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { SendEmailModalComponent } from '../../../../shared/components/send-email-modal/send-email-modal';
import { TreatmentPlansService } from '../../services/treatment-plans.service';
import {
  TreatmentPlan,
  TreatmentPlanStatus,
  TREATMENT_PLAN_STATUS_CONFIG
} from '../../models/treatment-plan.models';
import { PatientsService } from '../../../patients/services/patients.service';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-treatment-plan-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent, SendEmailModalComponent, EmptyStateComponent],
  templateUrl: './treatment-plan-list.html',
  styleUrl: './treatment-plan-list.scss'
})
export class TreatmentPlanListComponent implements OnInit, OnDestroy {
  permissionService = inject(PermissionService);
  PERMISSIONS = PERMISSIONS;
  private plansService = inject(TreatmentPlansService);
  private patientsService = inject(PatientsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  // State
  plans = signal<TreatmentPlan[]>([]);
  filteredPlans = signal<TreatmentPlan[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Email modal state
  showEmailModal = signal(false);
  emailTargetId = signal<string | null>(null);
  patientEmail = signal<string | null>(null);
  sendingEmail = signal(false);
  printLoadingId = signal<string | null>(null);

  // Filters
  searchTerm = signal('');
  filterStatus = signal<'all' | TreatmentPlanStatus>('all');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  // Sorting
  sortColumn = signal<string>('startDate');
  sortDirection = signal<'asc' | 'desc'>('desc');

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
        this.error.set(getApiErrorMessage(err));
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

    const from = this.dateFrom();
    const to = this.dateTo();
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) <= toDate);
    }

    // Sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (col) {
        case 'patient':    aVal = a.patientName?.toLowerCase() ?? '';    bVal = b.patientName?.toLowerCase() ?? '';    break;
        case 'startDate':  aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                           bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;  break;
        case 'status':     aVal = a.status;                              bVal = b.status;                              break;
        case 'totalCost':  aVal = a.totalEstimatedCost ?? 0;             bVal = b.totalEstimatedCost ?? 0;             break;
        default: return 0;
      }
      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ?  1 : -1;
      return 0;
    });

    this.filteredPlans.set(filtered);
    this.totalItems.set(filtered.length);
    this.totalPages.set(Math.ceil(filtered.length / this.pageSize()));
    this.currentPage.set(1);
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
    this.applyFilters();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'fa-sort';
    return this.sortDirection() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: string): void {
    this.filterStatus.set(value as 'all' | TreatmentPlanStatus);
    this.applyFilters();
  }

  onDateFromChange(value: string): void {
    this.dateFrom.set(value);
    this.applyFilters();
  }

  onDateToChange(value: string): void {
    this.dateTo.set(value);
    this.applyFilters();
  }

  clearDateFilters(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.applyFilters();
  }

  getStatusConfig(status: string) {
    return TREATMENT_PLAN_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  canEdit(plan: TreatmentPlan): boolean {
    return plan.status !== TreatmentPlanStatus.Completed &&
           plan.status !== TreatmentPlanStatus.Cancelled;
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
    return DateFormatService.shortDate(date);
  }

  // ===== Print & Email from list =====

  onPrintFromList(plan: TreatmentPlan): void {
    this.printLoadingId.set(plan.id);
    this.plansService.downloadPdf(plan.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.printLoadingId.set(null);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.printLoadingId.set(null);
      }
    });
  }

  openEmailFromList(plan: TreatmentPlan): void {
    this.emailTargetId.set(plan.id);
    this.patientEmail.set(null);
    this.sendingEmail.set(false);
    this.showEmailModal.set(true);
    this.patientsService.getById(plan.patientId).subscribe({
      next: (patient) => this.patientEmail.set(patient.email || null),
      error: () => this.patientEmail.set(null)
    });
  }

  onSendEmail(email: string): void {
    const id = this.emailTargetId();
    if (!id) return;
    this.sendingEmail.set(true);
    this.plansService.sendEmail(id, email).subscribe({
      next: () => {
        this.notifications.success(`Plan de tratamiento enviado a ${email}`);
        this.showEmailModal.set(false);
        this.sendingEmail.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.sendingEmail.set(false);
      }
    });
  }
}
