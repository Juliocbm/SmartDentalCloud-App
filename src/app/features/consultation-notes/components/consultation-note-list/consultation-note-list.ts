import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ConsultationNotesService } from '../../services/consultation-notes.service';
import { Appointment } from '../../../appointments/models/appointment.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-consultation-note-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './consultation-note-list.html',
  styleUrl: './consultation-note-list.scss'
})
export class ConsultationNoteListComponent implements OnInit, OnDestroy {
  private notesService = inject(ConsultationNotesService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  // State
  appointments = signal<Appointment[]>([]);
  filteredAppointments = signal<Appointment[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  searchTerm = signal('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  // Computed
  paginatedAppointments = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredAppointments().slice(start, end);
  });

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Notas de Consulta' }
  ];

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.applyFilters();
    });

    this.loadAppointments();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadAppointments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.notesService.getCompletedAppointments().subscribe({
      next: (data) => {
        // Sort by date descending (most recent first)
        data.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
        this.appointments.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading completed appointments:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private applyFilters(): void {
    let filtered = [...this.appointments()];
    const search = this.searchTerm().toLowerCase().trim();

    if (search) {
      filtered = filtered.filter(a =>
        a.patientName?.toLowerCase().includes(search) ||
        a.doctorName?.toLowerCase().includes(search) ||
        a.reason?.toLowerCase().includes(search)
      );
    }

    this.filteredAppointments.set(filtered);
    this.totalItems.set(filtered.length);
    this.totalPages.set(Math.ceil(filtered.length / this.pageSize()));
    this.currentPage.set(1);
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
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

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(date));
  }
}
