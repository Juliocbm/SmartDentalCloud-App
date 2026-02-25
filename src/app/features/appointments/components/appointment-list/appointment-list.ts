import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AppointmentsService } from '../../services/appointments.service';
import { AppointmentListItem, AppointmentStatus, AppointmentStatusConfig } from '../../models/appointment.models';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { LocationsService } from '../../../settings/services/locations.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PageHeaderComponent],
  templateUrl: './appointment-list.html',
  styleUrls: ['./appointment-list.scss']
})
export class AppointmentListComponent implements OnInit, OnDestroy {
  private appointmentsService = inject(AppointmentsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();
  locationsService = inject(LocationsService);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Citas', route: '/appointments' }
  ];

  appointments = signal<AppointmentListItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  selectedDate = signal(new Date());
  filterStatus = signal<AppointmentStatus | ''>('');
  searchTerm = signal('');

  filteredAppointments = computed(() => {
    let result = this.appointments();
    
    const status = this.filterStatus();
    if (status) {
      result = result.filter(apt => apt.status === status);
    }
    
    const search = this.searchTerm().toLowerCase();
    if (search) {
      result = result.filter(apt => 
        apt.patientName.toLowerCase().includes(search) ||
        apt.reason.toLowerCase().includes(search)
      );
    }
    
    return result.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  });

  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: AppointmentStatus.Scheduled, label: 'Programadas' },
    { value: AppointmentStatus.Confirmed, label: 'Confirmadas' },
    { value: AppointmentStatus.Completed, label: 'Completadas' },
    { value: AppointmentStatus.Cancelled, label: 'Canceladas' },
    { value: AppointmentStatus.NoShow, label: 'No asistió' }
  ];

  AppointmentStatusConfig = AppointmentStatusConfig;

  ngOnInit(): void {
    this.loadAppointments();
    
    // Setup debounce for search with 300ms delay
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadAppointments(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.appointmentsService.getByDate(this.selectedDate()).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading appointments:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate.set(new Date(input.value + 'T00:00:00'));
    this.loadAppointments();
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterStatus.set(select.value as AppointmentStatus | '');
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  async completeAppointment(appointment: AppointmentListItem): Promise<void> {
    const confirmed = await this.notifications.confirm(`¿Completar cita con ${appointment.patientName}?`);
    if (!confirmed) return;

    this.appointmentsService.complete(appointment.id).subscribe({
      next: () => {
        this.notifications.success('Cita completada correctamente.');
        this.loadAppointments();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  async cancelAppointment(appointment: AppointmentListItem): Promise<void> {
    const confirmed = await this.notifications.confirm(`¿Cancelar cita con ${appointment.patientName}?`);
    if (!confirmed) return;

    this.appointmentsService.cancel(appointment.id).subscribe({
      next: () => {
        this.notifications.success('Cita cancelada correctamente.');
        this.loadAppointments();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  formatDateForInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getStatusConfig(status: AppointmentStatus) {
    return AppointmentStatusConfig[status];
  }
}
