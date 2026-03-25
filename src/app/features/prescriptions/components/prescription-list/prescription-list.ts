import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PrescriptionsService } from '../../services/prescriptions.service';
import {
  Prescription,
  PrescriptionStatus,
  PRESCRIPTION_STATUS_CONFIG
} from '../../models/prescription.models';
import { PatientsService } from '../../../patients/services/patients.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { SendEmailModalComponent } from '../../../../shared/components/send-email-modal/send-email-modal';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { DateFormatService } from '../../../../core/services/date-format.service';

@Component({
  selector: 'app-prescription-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, SendEmailModalComponent],
  templateUrl: './prescription-list.html',
  styleUrl: './prescription-list.scss'
})
export class PrescriptionListComponent implements OnInit {
  permissionService = inject(PermissionService);
  PERMISSIONS = PERMISSIONS;
  private prescriptionsService = inject(PrescriptionsService);
  private patientsService = inject(PatientsService);
  private notifications = inject(NotificationService);
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
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Sorting
  sortColumn = signal<string>('issuedDate');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Email modal state
  showEmailModal = signal(false);
  emailTargetId = signal<string | null>(null);
  patientEmail = signal<string | null>(null);
  sendingEmail = signal(false);
  printLoadingId = signal<string | null>(null);

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
    const from = this.dateFrom();
    const to = this.dateTo();

    if (status !== 'all') {
      items = items.filter(p => p.status === status);
    }

    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      items = items.filter(p => new Date(p.issuedAt) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      items = items.filter(p => new Date(p.issuedAt) <= toDate);
    }

    if (search) {
      items = items.filter(p =>
        p.patientName.toLowerCase().includes(search) ||
        p.prescribedByName.toLowerCase().includes(search) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(search)) ||
        p.items.some(item => item.medicationName.toLowerCase().includes(search))
      );
    }

    // Sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const sorted = [...items].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (col) {
        case 'patient':    aVal = a.patientName?.toLowerCase() ?? '';         bVal = b.patientName?.toLowerCase() ?? '';         break;
        case 'issuedDate': aVal = new Date(a.issuedAt).getTime();             bVal = new Date(b.issuedAt).getTime();             break;
        case 'status':     aVal = a.status;                                   bVal = b.status;                                   break;
        default: return 0;
      }
      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ?  1 : -1;
      return 0;
    });

    return sorted;
  });

  totalPages = computed(() => Math.ceil(this.filteredPrescriptions().length / this.pageSize()) || 1);

  paginatedPrescriptions = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredPrescriptions().slice(start, start + this.pageSize());
  });

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
        this.prescriptions.set(parsed);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'fa-sort';
    return this.sortDirection() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
  }

  onDateFromChange(value: string): void {
    this.dateFrom.set(value);
    this.currentPage.set(1);
  }

  onDateToChange(value: string): void {
    this.dateTo.set(value);
    this.currentPage.set(1);
  }

  clearDateFilters(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
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
    return DateFormatService.shortDate(date);
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

  // ===== Print & Email from list =====

  onPrintFromList(prescription: Prescription): void {
    this.printLoadingId.set(prescription.id);
    this.prescriptionsService.downloadPdf(prescription.id).subscribe({
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

  openEmailFromList(prescription: Prescription): void {
    this.emailTargetId.set(prescription.id);
    this.patientEmail.set(null);
    this.sendingEmail.set(false);
    this.showEmailModal.set(true);
    this.patientsService.getById(prescription.patientId).subscribe({
      next: (patient) => this.patientEmail.set(patient.email || null),
      error: () => this.patientEmail.set(null)
    });
  }

  onSendEmail(email: string): void {
    const id = this.emailTargetId();
    if (!id) return;
    this.sendingEmail.set(true);
    this.prescriptionsService.sendEmail(id, { email }).subscribe({
      next: () => {
        this.notifications.success(`Receta enviada a ${email}`);
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
