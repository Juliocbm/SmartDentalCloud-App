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
import { DateRangePickerComponent, DateRange } from '../../../../shared/components/date-range-picker/date-range-picker';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PageHeaderComponent, DateRangePickerComponent],
  templateUrl: './appointment-list.html',
  styleUrls: ['./appointment-list.scss']
})
export class AppointmentListComponent implements OnInit, OnDestroy {
  private appointmentsService = inject(AppointmentsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();
  locationsService = inject(LocationsService);
  permissionService = inject(PermissionService);
  PERMISSIONS = PERMISSIONS;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Citas', route: '/appointments' }
  ];

  appointments = signal<AppointmentListItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  startDate = signal(this.formatDate(new Date()));
  endDate = signal(this.formatDate(this.addDays(new Date(), 7)));
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
    
    const start = new Date(this.startDate() + 'T00:00:00');
    const end = new Date(this.endDate() + 'T23:59:59');
    this.appointmentsService.getByRange(start, end).subscribe({
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

  onRangeChange(range: DateRange | null): void {
    if (range) {
      this.startDate.set(range.start);
      this.endDate.set(range.end);
    } else {
      const today = this.formatDate(new Date());
      this.startDate.set(today);
      this.endDate.set(this.formatDate(this.addDays(new Date(), 7)));
    }
    this.loadAppointments();
  }

  showToday(): void {
    const today = this.formatDate(new Date());
    this.startDate.set(today);
    this.endDate.set(today);
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

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getStatusConfig(status: AppointmentStatus) {
    return AppointmentStatusConfig[status];
  }
}
