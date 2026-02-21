import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PrescriptionsService } from '../../services/prescriptions.service';
import {
  Prescription,
  PrescriptionStatus,
  PRESCRIPTION_STATUS_CONFIG
} from '../../models/prescription.models';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-prescription-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './prescription-list.html',
  styleUrl: './prescription-list.scss'
})
export class PrescriptionListComponent implements OnInit {
  private prescriptionsService = inject(PrescriptionsService);
  private router = inject(Router);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Recetas' }
  ];

  // State
  prescriptions = signal<Prescription[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  searchTerm = signal('');
  statusFilter = signal<string>('all');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Search debounce
  private searchSubject = new Subject<string>();

  // Status config
  PRESCRIPTION_STATUS_CONFIG = PRESCRIPTION_STATUS_CONFIG;
  PrescriptionStatus = PrescriptionStatus;

  // Computed
  filteredPrescriptions = computed(() => {
    let items = this.prescriptions();
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();

    if (status !== 'all') {
      items = items.filter(p => p.status === status);
    }

    if (search) {
      items = items.filter(p =>
        p.patientName.toLowerCase().includes(search) ||
        p.prescribedByName.toLowerCase().includes(search) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(search)) ||
        p.items.some(item => item.medicationName.toLowerCase().includes(search))
      );
    }

    return items;
  });

  totalPages = computed(() => Math.ceil(this.filteredPrescriptions().length / this.pageSize()) || 1);

  paginatedPrescriptions = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredPrescriptions().slice(start, start + this.pageSize());
  });

  // KPIs
  totalCount = computed(() => this.prescriptions().length);
  activeCount = computed(() => this.prescriptions().filter(p => p.status === PrescriptionStatus.Active).length);
  completedCount = computed(() => this.prescriptions().filter(p => p.status === PrescriptionStatus.Completed).length);

  ngOnInit(): void {
    this.loadPrescriptions();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
    });
  }

  loadPrescriptions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.prescriptionsService.getAll().subscribe({
      next: (data) => {
        const parsed = data.map(p => ({
          ...p,
          issuedAt: new Date(p.issuedAt),
          expiresAt: p.expiresAt ? new Date(p.expiresAt) : undefined
        }));
        // Sort by most recent first
        parsed.sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
        this.prescriptions.set(parsed);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las recetas. Por favor intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
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
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewDetail(id: string): void {
    this.router.navigate(['/prescriptions', id]);
  }

  createPrescription(): void {
    this.router.navigate(['/prescriptions', 'new']);
  }

  getStatusConfig(status: string) {
    return PRESCRIPTION_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  formatDate(date: Date | string): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  getMedicationsSummary(prescription: Prescription): string {
    if (!prescription.items || prescription.items.length === 0) return 'Sin medicamentos';
    if (prescription.items.length === 1) return prescription.items[0].medicationName;
    return `${prescription.items[0].medicationName} (+${prescription.items.length - 1} más)`;
  }

  isExpired(prescription: Prescription): boolean {
    return prescription.status === PrescriptionStatus.Active &&
      !!prescription.expiresAt &&
      new Date(prescription.expiresAt) < new Date();
  }
}
