import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../services/appointments.service';
import { AppointmentListItem, AppointmentStatus, AppointmentStatusConfig } from '../../models/appointment.models';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './appointment-list.html',
  styleUrls: ['./appointment-list.scss']
})
export class AppointmentListComponent implements OnInit {
  private appointmentsService = inject(AppointmentsService);

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
  }

  loadAppointments(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.appointmentsService.getByDate(this.selectedDate()).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.error.set('Error al cargar las citas');
        this.loading.set(false);
      }
    });
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate.set(new Date(input.value));
    this.loadAppointments();
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterStatus.set(select.value as AppointmentStatus | '');
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  completeAppointment(appointment: AppointmentListItem): void {
    if (!confirm(`¿Completar cita con ${appointment.patientName}?`)) {
      return;
    }

    this.appointmentsService.complete(appointment.id).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error completing appointment:', error);
        alert('Error al completar la cita');
      }
    });
  }

  cancelAppointment(appointment: AppointmentListItem): void {
    const reason = prompt(`Cancelar cita con ${appointment.patientName}. Motivo (opcional):`);
    if (reason === null) {
      return;
    }

    this.appointmentsService.cancel(appointment.id, reason).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error cancelling appointment:', error);
        alert('Error al cancelar la cita');
      }
    });
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getStatusConfig(status: AppointmentStatus) {
    return AppointmentStatusConfig[status];
  }
}
