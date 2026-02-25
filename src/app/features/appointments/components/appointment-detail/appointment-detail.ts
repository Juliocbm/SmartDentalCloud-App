import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppointmentsService } from '../../services/appointments.service';
import { Appointment, AppointmentStatus, AppointmentStatusConfig } from '../../models/appointment.models';
import { ConsultationNotesService } from '../../../consultation-notes/services/consultation-notes.service';
import { ConsultationNote } from '../../../consultation-notes/models/consultation-note.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { LocationsService } from '../../../settings/services/locations.service';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent],
  templateUrl: './appointment-detail.html',
  styleUrls: ['./appointment-detail.scss']
})
export class AppointmentDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentsService = inject(AppointmentsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private notesService = inject(ConsultationNotesService);
  private location = inject(Location);
  locationsService = inject(LocationsService);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Citas', route: '/appointments' },
    { label: 'Detalle' }
  ];

  appointment = signal<Appointment | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actionLoading = signal(false);

  // Consultation Note state
  consultationNote = signal<ConsultationNote | null>(null);
  noteLoading = signal(false);
  noteExists = signal(false);

  AppointmentStatus = AppointmentStatus;
  statusConfig = AppointmentStatusConfig;

  appointmentSubtitle = computed(() => {
    const apt = this.appointment();
    if (!apt) return '';
    const date = new Date(apt.startAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = new Date(apt.startAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    return `${date}, ${time}`;
  });

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
        // Load consultation note if appointment is completed
        if (appointment.status === AppointmentStatus.Completed) {
          this.loadConsultationNote(appointment.id);
        }
      },
      error: (error) => {
        this.logger.error('Error loading appointment:', error);
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

  async onConfirm(): Promise<void> {
    const apt = this.appointment();
    if (!apt || !this.canConfirm()) return;

    const confirmed = await this.notifications.confirm('¿Confirmar esta cita?');
    if (!confirmed) return;

    this.actionLoading.set(true);
    this.appointmentsService.confirm(apt.id).subscribe({
      next: () => {
        this.notifications.success('Cita confirmada correctamente.');
        this.loadAppointment(apt.id);
        this.actionLoading.set(false);
      },
      error: () => {
        this.notifications.error('Error al confirmar la cita.');
        this.actionLoading.set(false);
      }
    });
  }

  async onComplete(): Promise<void> {
    const apt = this.appointment();
    if (!apt || !this.canComplete()) return;

    const confirmed = await this.notifications.confirm('¿Marcar esta cita como completada?');
    if (!confirmed) return;

    this.actionLoading.set(true);
    this.appointmentsService.complete(apt.id).subscribe({
      next: () => {
        this.notifications.success('Cita completada correctamente.');
        this.loadAppointment(apt.id);
        this.actionLoading.set(false);
      },
      error: () => {
        this.notifications.error('Error al completar la cita.');
        this.actionLoading.set(false);
      }
    });
  }

  async onCancel(): Promise<void> {
    const apt = this.appointment();
    if (!apt || !this.canCancel()) return;

    const confirmed = await this.notifications.confirm('¿Cancelar esta cita?');
    if (!confirmed) return;

    this.actionLoading.set(true);
    this.appointmentsService.cancel(apt.id).subscribe({
      next: () => {
        this.notifications.success('Cita cancelada correctamente.');
        this.loadAppointment(apt.id);
        this.actionLoading.set(false);
      },
      error: () => {
        this.notifications.error('Error al cancelar la cita.');
        this.actionLoading.set(false);
      }
    });
  }

  async onMarkNoShow(): Promise<void> {
    const apt = this.appointment();
    if (!apt || !this.canMarkNoShow()) return;

    const confirmed = await this.notifications.confirm('¿Marcar al paciente como "No se presentó"?');
    if (!confirmed) return;

    this.actionLoading.set(true);
    this.appointmentsService.markAsNoShow(apt.id).subscribe({
      next: () => {
        this.notifications.success('Cita marcada como no show.');
        this.loadAppointment(apt.id);
        this.actionLoading.set(false);
      },
      error: () => {
        this.notifications.error('Error al marcar como no show.');
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

  onViewDoctor(): void {
    const apt = this.appointment();
    if (!apt?.userId) return;
    this.router.navigate(['/users', apt.userId]);
  }

  onBack(): void {
    this.location.back();
  }

  private loadConsultationNote(appointmentId: string): void {
    this.noteLoading.set(true);
    this.notesService.getByAppointment(appointmentId).subscribe({
      next: (note) => {
        this.consultationNote.set(note);
        this.noteExists.set(true);
        this.noteLoading.set(false);
      },
      error: (err) => {
        if (err.status === 404) {
          this.noteExists.set(false);
        }
        this.noteLoading.set(false);
      }
    });
  }

  formatNoteDateTime(date: Date | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }
}
