import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentsService } from '../../services/appointments.service';
import { Appointment, AppointmentStatus, AppointmentStatusConfig } from '../../models/appointment.models';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-detail.html',
  styleUrls: ['./appointment-detail.scss']
})
export class AppointmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentsService = inject(AppointmentsService);

  appointment = signal<Appointment | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actionLoading = signal(false);

  AppointmentStatus = AppointmentStatus;
  statusConfig = AppointmentStatusConfig;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAppointment(id);
    } else {
      this.error.set('ID de cita no válido');
      this.loading.set(false);
    }
  }

  private loadAppointment(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.appointmentsService.getById(id).subscribe({
      next: (appointment) => {
        this.appointment.set(appointment);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.error.set('Error al cargar la cita');
        this.loading.set(false);
      }
    });
  }

  getStatusConfig(status: AppointmentStatus) {
    return this.statusConfig[status];
  }

  getDuration(): number {
    const apt = this.appointment();
    if (!apt) return 0;
    return Math.round((apt.endAt.getTime() - apt.startAt.getTime()) / (1000 * 60));
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canConfirm(): boolean {
    return this.appointment()?.status === AppointmentStatus.Scheduled;
  }

  canComplete(): boolean {
    const status = this.appointment()?.status;
    return status === AppointmentStatus.Scheduled || status === AppointmentStatus.Confirmed;
  }

  canCancel(): boolean {
    const status = this.appointment()?.status;
    return status === AppointmentStatus.Scheduled || status === AppointmentStatus.Confirmed;
  }

  canMarkNoShow(): boolean {
    const status = this.appointment()?.status;
    return status === AppointmentStatus.Scheduled || status === AppointmentStatus.Confirmed;
  }

  canReschedule(): boolean {
    const status = this.appointment()?.status;
    return status === AppointmentStatus.Scheduled || 
           status === AppointmentStatus.Confirmed || 
           status === AppointmentStatus.Cancelled;
  }

  onConfirm(): void {
    const apt = this.appointment();
    if (!apt || !this.canConfirm()) return;

    if (!confirm('¿Confirmar esta cita?')) return;

    this.actionLoading.set(true);
    this.appointmentsService.getById(apt.id).subscribe({
      next: (updated) => {
        this.appointment.set(updated);
        this.actionLoading.set(false);
      },
      error: (error) => {
        console.error('Error confirming appointment:', error);
        alert('Error al confirmar la cita');
        this.actionLoading.set(false);
      }
    });
  }

  onComplete(): void {
    const apt = this.appointment();
    if (!apt || !this.canComplete()) return;

    if (!confirm('¿Marcar esta cita como completada?')) return;

    this.actionLoading.set(true);
    this.appointmentsService.complete(apt.id).subscribe({
      next: () => {
        this.loadAppointment(apt.id);
        this.actionLoading.set(false);
      },
      error: (error) => {
        console.error('Error completing appointment:', error);
        alert('Error al completar la cita');
        this.actionLoading.set(false);
      }
    });
  }

  onCancel(): void {
    const apt = this.appointment();
    if (!apt || !this.canCancel()) return;

    const reason = prompt('Motivo de cancelación (opcional):');
    if (reason === null) return;

    this.actionLoading.set(true);
    this.appointmentsService.cancel(apt.id, reason || undefined).subscribe({
      next: () => {
        this.loadAppointment(apt.id);
        this.actionLoading.set(false);
      },
      error: (error) => {
        console.error('Error cancelling appointment:', error);
        alert('Error al cancelar la cita');
        this.actionLoading.set(false);
      }
    });
  }

  onMarkNoShow(): void {
    const apt = this.appointment();
    if (!apt || !this.canMarkNoShow()) return;

    if (!confirm('¿Marcar al paciente como "No se presentó"?')) return;

    this.actionLoading.set(true);
    this.appointmentsService.markAsNoShow(apt.id).subscribe({
      next: () => {
        this.loadAppointment(apt.id);
        this.actionLoading.set(false);
      },
      error: (error) => {
        console.error('Error marking no-show:', error);
        alert('Error al marcar como no show');
        this.actionLoading.set(false);
      }
    });
  }

  onEdit(): void {
    const apt = this.appointment();
    if (!apt) return;
    this.router.navigate(['/appointments', apt.id, 'edit']);
  }

  onViewPatient(): void {
    const apt = this.appointment();
    if (!apt) return;
    this.router.navigate(['/patients', apt.patientId]);
  }

  onBack(): void {
    this.router.navigate(['/appointments']);
  }
}
