import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ConsultationNotesService } from '../../services/consultation-notes.service';
import { ConsultationNote } from '../../models/consultation-note.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

type ViewMode = 'loading' | 'view' | 'edit' | 'create' | 'error';

@Component({
  selector: 'app-consultation-note-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PageHeaderComponent],
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

  // State
  mode = signal<ViewMode>('loading');
  note = signal<ConsultationNote | null>(null);
  saving = signal(false);
  error = signal<string | null>(null);
  appointmentId = signal('');

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
        this.mode.set('view');
      },
      error: (err) => {
        if (err.status === 404) {
          // No note exists — show creation form
          this.mode.set('create');
        } else {
          this.logger.error('Error loading consultation note:', err);
          this.error.set('Error al cargar la nota de consulta.');
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
        this.notifications.error(err.error?.message || 'Error al crear la nota de consulta.');
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
        this.notifications.error('Error al actualizar la nota de consulta.');
        this.saving.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/appointments', this.appointmentId()]);
  }

  formatDateTime(date: Date | undefined): string {
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
