import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ConsultationNotesService } from '../../services/consultation-notes.service';
import { ConsultationNote } from '../../models/consultation-note.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { AppointmentsService } from '../../../appointments/services/appointments.service';
import { PatientDiagnosesService } from '../../../patients/services/patient-diagnoses.service';
import { Cie10AutocompleteComponent } from '../../../../shared/components/cie10-autocomplete/cie10-autocomplete';
import { Cie10Code } from '../../../../core/services/cie10.service';

type ViewMode = 'loading' | 'view' | 'edit' | 'create' | 'error';

@Component({
  selector: 'app-consultation-note-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PageHeaderComponent, Cie10AutocompleteComponent],
  templateUrl: './consultation-note-view.html',
  styleUrl: './consultation-note-view.scss'
})
export class ConsultationNoteViewComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notesService = inject(ConsultationNotesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private location = inject(Location);
  private appointmentsService = inject(AppointmentsService);
  private diagnosesService = inject(PatientDiagnosesService);

  // State
  mode = signal<ViewMode>('loading');
  note = signal<ConsultationNote | null>(null);
  saving = signal(false);
  error = signal<string | null>(null);
  appointmentId = signal('');
  patientId = signal<string | null>(null);
  diagnosisRegistered = signal(false);
  registeringDiagnosis = signal(false);
  noteCie10Code = signal<string | null>(null);

  // Form
  form!: FormGroup;

  breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Citas', route: '/appointments' },
    { label: 'Nota Clínica' }
  ]);

  ngOnInit(): void {
    this.initForm();

    // Support both ':id/note' (appointments child) and ':appointmentId' (legacy) route params
    const aptId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('appointmentId');
    if (aptId) {
      this.appointmentId.set(aptId);
      this.loadAppointmentPatient(aptId);
      this.loadNote(aptId);
    } else {
      this.error.set('ID de cita no válido');
      this.mode.set('error');
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      chiefComplaint: [''],
      clinicalFindings: [''],
      diagnosis: [''],
      treatmentPlan: [''],
      notes: ['']
    });
  }

  private loadNote(appointmentId: string): void {
    this.mode.set('loading');

    this.notesService.getByAppointment(appointmentId).subscribe({
      next: (data) => {
        this.note.set(data);
        this.populateForm(data);
        if (data.patientDiagnosisId) {
          this.diagnosisRegistered.set(true);
        }
        this.mode.set('view');
      },
      error: (err) => {
        if (err.status === 404) {
          // No note exists — show creation form
          this.mode.set('create');
        } else {
          this.logger.error('Error loading consultation note:', err);
          this.error.set(getApiErrorMessage(err));
          this.mode.set('error');
        }
      }
    });
  }

  private populateForm(note: ConsultationNote): void {
    this.form.patchValue({
      chiefComplaint: note.chiefComplaint || '',
      clinicalFindings: note.clinicalFindings || '',
      diagnosis: note.diagnosis || '',
      treatmentPlan: note.treatmentPlan || '',
      notes: note.notes || ''
    });
    this.noteCie10Code.set(note.diagnosisCie10Code || null);
  }

  onEdit(): void {
    this.mode.set('edit');
  }

  onCancelEdit(): void {
    const currentNote = this.note();
    if (currentNote) {
      this.populateForm(currentNote);
    }
    this.mode.set('view');
  }

  onCreate(): void {
    this.saving.set(true);

    const formValue = this.form.value;
    this.notesService.create({
      appointmentId: this.appointmentId(),
      chiefComplaint: formValue.chiefComplaint || undefined,
      clinicalFindings: formValue.clinicalFindings || undefined,
      diagnosis: formValue.diagnosis || undefined,
      diagnosisCie10Code: this.noteCie10Code() || undefined,
      treatmentPlan: formValue.treatmentPlan || undefined,
      notes: formValue.notes || undefined
    }).subscribe({
      next: (created) => {
        this.note.set(created);
        this.notifications.success('Nota de consulta creada exitosamente.');
        this.mode.set('view');
        this.saving.set(false);
      },
      error: (err) => {
        this.logger.error('Error creating consultation note:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  onUpdate(): void {
    const currentNote = this.note();
    if (!currentNote) return;

    this.saving.set(true);

    const formValue = this.form.value;
    this.notesService.update(currentNote.id, {
      id: currentNote.id,
      chiefComplaint: formValue.chiefComplaint || undefined,
      clinicalFindings: formValue.clinicalFindings || undefined,
      diagnosis: formValue.diagnosis || undefined,
      diagnosisCie10Code: this.noteCie10Code() || undefined,
      treatmentPlan: formValue.treatmentPlan || undefined,
      notes: formValue.notes || undefined
    }).subscribe({
      next: () => {
        this.notifications.success('Nota de consulta actualizada.');
        this.loadNote(this.appointmentId());
        this.saving.set(false);
      },
      error: (err) => {
        this.logger.error('Error updating consultation note:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  onCie10Selected(code: Cie10Code | null): void {
    this.noteCie10Code.set(code?.code || null);
  }

  goBack(): void {
    this.location.back();
  }

  private loadAppointmentPatient(appointmentId: string): void {
    this.appointmentsService.getById(appointmentId).subscribe({
      next: (apt) => this.patientId.set(apt.patientId),
      error: () => {}
    });
  }

  registerAsDiagnosis(): void {
    const currentNote = this.note();
    const pid = this.patientId();
    if (!currentNote?.diagnosis || !pid) return;

    this.registeringDiagnosis.set(true);
    this.diagnosesService.create(pid, {
      description: currentNote.diagnosis,
      cie10Code: currentNote.diagnosisCie10Code || undefined,
      notes: `Registrado desde nota clínica de cita ${this.appointmentId()}`,
      appointmentId: this.appointmentId() || undefined
    }).subscribe({
      next: (created) => {
        // Link the created diagnosis back to the consultation note
        this.notesService.update(currentNote.id, {
          id: currentNote.id,
          chiefComplaint: currentNote.chiefComplaint || undefined,
          clinicalFindings: currentNote.clinicalFindings || undefined,
          diagnosis: currentNote.diagnosis || undefined,
          diagnosisCie10Code: currentNote.diagnosisCie10Code || undefined,
          patientDiagnosisId: created.id,
          treatmentPlan: currentNote.treatmentPlan || undefined,
          notes: currentNote.notes || undefined
        }).subscribe({
          next: () => {
            this.diagnosisRegistered.set(true);
            this.registeringDiagnosis.set(false);
            this.notifications.success('Diagnóstico registrado y vinculado a la nota clínica.');
            this.loadNote(this.appointmentId());
          },
          error: () => {
            this.diagnosisRegistered.set(true);
            this.registeringDiagnosis.set(false);
            this.notifications.success('Diagnóstico registrado en la lista de diagnósticos del paciente.');
          }
        });
      },
      error: (err) => {
        this.registeringDiagnosis.set(false);
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  formatDateTime(date: Date | undefined): string {
    return DateFormatService.dateTime(date);
  }
}
