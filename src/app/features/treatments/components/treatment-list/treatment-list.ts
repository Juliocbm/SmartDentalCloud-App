import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { TreatmentsService } from '../../services/treatments.service';
import { Treatment, TreatmentStatus, TREATMENT_STATUS_CONFIG } from '../../models/treatment.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvExportService } from '../../../../shared/services/csv-export.service';

@Component({
  selector: 'app-treatment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './treatment-list.html',
  styleUrl: './treatment-list.scss'
})
export class TreatmentListComponent implements OnInit, OnDestroy {
  private treatmentsService = inject(TreatmentsService);
  private logger = inject(LoggingService);
  private notifications = inject(NotificationService);
  private csvExport = inject(CsvExportService);
  private searchSubject = new Subject<string>();

  // State
  treatments = signal<Treatment[]>([]);
  filteredTreatments = signal<Treatment[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  searchTerm = signal('');
  filterStatus = signal<'all' | TreatmentStatus>('all');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  // Computed
  paginatedTreatments = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredTreatments().slice(start, end);
  });

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

  // Constants
  statusOptions = Object.values(TreatmentStatus);
  TreatmentStatus = TreatmentStatus;
  TREATMENT_STATUS_CONFIG = TREATMENT_STATUS_CONFIG;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Tratamientos' }
  ];

  ngOnInit(): void {
    this.loadTreatments();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadTreatments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.treatmentsService.getAll().subscribe({
      next: (data) => {
        this.treatments.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading treatments:', err);
        this.error.set('Error al cargar tratamientos. Por favor intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.treatments()];

    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(t =>
        t.patientName?.toLowerCase().includes(search) ||
        t.serviceName?.toLowerCase().includes(search) ||
        t.toothNumber?.toLowerCase().includes(search) ||
        t.notes?.toLowerCase().includes(search)
      );
    }

    const status = this.filterStatus();
    if (status !== 'all') {
      filtered = filtered.filter(t => t.status === status);
    }

    this.filteredTreatments.set(filtered);
    this.totalItems.set(filtered.length);
    this.totalPages.set(Math.ceil(filtered.length / this.pageSize()));
    this.currentPage.set(1);
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: string): void {
    this.filterStatus.set(value as 'all' | TreatmentStatus);
    this.applyFilters();
  }

  getStatusConfig(status: TreatmentStatus) {
    return TREATMENT_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
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

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  exportToCsv(): void {
    this.csvExport.export(this.filteredTreatments(), [
      { header: 'Paciente', accessor: (t) => t.patientName },
      { header: 'Servicio', accessor: (t) => t.serviceName },
      { header: 'Estado', accessor: (t) => TREATMENT_STATUS_CONFIG[t.status]?.label || t.status },
      { header: 'Fecha Inicio', accessor: (t) => this.formatDate(t.startDate) },
      { header: 'Fecha Fin', accessor: (t) => t.endDate ? this.formatDate(t.endDate) : '' },
      { header: 'Pieza Dental', accessor: (t) => t.toothNumber || '' }
    ], 'tratamientos');
  }
}
