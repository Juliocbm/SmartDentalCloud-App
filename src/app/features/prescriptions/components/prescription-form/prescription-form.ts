import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PrescriptionsService } from '../../services/prescriptions.service';
import {
  CreatePrescriptionRequest,
  CreatePrescriptionItemRequest,
  ROUTE_OPTIONS,
  FREQUENCY_OPTIONS,
  DURATION_OPTIONS
} from '../../models/prescription.models';
import { PatientsService } from '../../../patients/services/patients.service';
import { Patient } from '../../../patients/models/patient.models';
import { AppointmentsService } from '../../../appointments/services/appointments.service';
import { AppointmentListItem, AppointmentStatus } from '../../../appointments/models/appointment.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { AuthService } from '../../../../core/services/auth.service';
import { ConsultationNotesService } from '../../../consultation-notes/services/consultation-notes.service';
import { ConsultationNote } from '../../../consultation-notes/models/consultation-note.models';
import { PatientAllergiesService } from '../../../patients/services/patient-allergies.service';
import { AllergyAlert } from '../../../patients/models/patient-allergy.models';
import { AllergyAlertBannerComponent } from '../../../../shared/components/allergy-alert-banner/allergy-alert-banner';
import { FormSelectComponent } from '../../../../shared/components/form-select/form-select';

@Component({
  selector: 'app-prescription-form',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, AllergyAlertBannerComponent, FormSelectComponent],
  templateUrl: './prescription-form.html',
  styleUrl: './prescription-form.scss'
})
export class PrescriptionFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private prescriptionsService = inject(PrescriptionsService);
  private patientsService = inject(PatientsService);
  private notifications = inject(NotificationService);
  private allergiesService = inject(PatientAllergiesService);
  private appointmentsService = inject(AppointmentsService);
  private authService = inject(AuthService);
  private notesService = inject(ConsultationNotesService);

  currentUserName = signal<string>('');

  // Allergy alerts
  allergyAlerts = signal<AllergyAlert[]>([]);

  // State
  saving = signal(false);
  loadingPatients = signal(false);
  patients = signal<Patient[]>([]);
  patientSearch = signal('');
  filteredPatients = signal<Patient[]>([]);
  showPatientDropdown = signal(false);

  // Options
  ROUTE_OPTIONS = ROUTE_OPTIONS;
  FREQUENCY_OPTIONS = FREQUENCY_OPTIONS;
  DURATION_OPTIONS = DURATION_OPTIONS;

  // Form model
  selectedPatient = signal<Patient | null>(null);
  diagnosis = signal('');
  notes = signal('');
  items = signal<CreatePrescriptionItemRequest[]>([]);

  // Appointment linking
  patientAppointments = signal<AppointmentListItem[]>([]);
  selectedAppointmentId = signal<string | null>(null);
  loadingAppointments = signal(false);

  // Consultation note linking
  linkedNote = signal<ConsultationNote | null>(null);
  selectedConsultationNoteId = signal<string | null>(null);
  loadingNote = signal(false);

  // Medication Modal State
  showMedModal = signal(false);
  editingMedIndex = signal<number | null>(null);
  medForm = signal<CreatePrescriptionItemRequest>(this.createEmptyItem());

  // Pre-selected from query params
  private preselectedPatientId: string | null = null;
  private preselectedAppointmentId: string | null = null;

  ngOnInit(): void {
    this.preselectedPatientId = this.route.snapshot.queryParamMap.get('patientId');
    this.preselectedAppointmentId = this.route.snapshot.queryParamMap.get('appointmentId');
    this.currentUserName.set(this.authService.getCurrentUser()?.name || '');
    this.loadPatients();
  }

  private loadPatients(): void {
    this.loadingPatients.set(true);
    this.patientsService.getAll(1, 200, undefined, true).subscribe({
      next: (data) => {
        this.patients.set(data.items);
        this.loadingPatients.set(false);

        if (this.preselectedPatientId) {
          const patient = data.items.find(p => p.id === this.preselectedPatientId);
          if (patient) {
            this.selectPatient(patient);
          }
        }
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar pacientes'));
        this.loadingPatients.set(false);
      }
    });
  }

  onPatientSearchChange(term: string): void {
    this.patientSearch.set(term);
    if (term.trim().length < 2) {
      this.filteredPatients.set([]);
      this.showPatientDropdown.set(false);
      return;
    }

    const search = term.toLowerCase();
    const filtered = this.patients().filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      return fullName.includes(search) || (p.email && p.email.toLowerCase().includes(search));
    }).slice(0, 10);

    this.filteredPatients.set(filtered);
    this.showPatientDropdown.set(filtered.length > 0);
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.patientSearch.set(`${patient.firstName} ${patient.lastName}`);
    this.showPatientDropdown.set(false);
    this.loadAllergyAlerts(patient.id);
    this.loadPatientAppointments(patient.id);
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.patientSearch.set('');
    this.allergyAlerts.set([]);
    this.patientAppointments.set([]);
    this.selectedAppointmentId.set(null);
    this.linkedNote.set(null);
    this.selectedConsultationNoteId.set(null);
  }

  onAppointmentChange(appointmentId: string | null): void {
    this.selectedAppointmentId.set(appointmentId);
    this.linkedNote.set(null);
    this.selectedConsultationNoteId.set(null);

    if (appointmentId) {
      this.loadConsultationNote(appointmentId);
    }
  }

  private loadConsultationNote(appointmentId: string): void {
    this.loadingNote.set(true);
    this.notesService.getByAppointment(appointmentId).subscribe({
      next: (note) => {
        this.linkedNote.set(note);
        this.selectedConsultationNoteId.set(note.id);
        if (note.diagnosis && !this.diagnosis().trim()) {
          this.diagnosis.set(note.diagnosis);
        }
        this.loadingNote.set(false);
      },
      error: () => {
        this.linkedNote.set(null);
        this.loadingNote.set(false);
      }
    });
  }

  private loadPatientAppointments(patientId: string): void {
    this.loadingAppointments.set(true);
    this.appointmentsService.getByPatient(patientId).subscribe({
      next: (appointments) => {
        const eligible = appointments.filter(
          a => a.status === AppointmentStatus.Completed || a.status === AppointmentStatus.Confirmed
        );
        this.patientAppointments.set(eligible);
        this.loadingAppointments.set(false);

        if (this.preselectedAppointmentId) {
          const exists = eligible.find(a => a.id === this.preselectedAppointmentId);
          if (exists) {
            this.selectedAppointmentId.set(this.preselectedAppointmentId);
          }
          this.preselectedAppointmentId = null;
        }
      },
      error: () => {
        this.loadingAppointments.set(false);
      }
    });
  }

  private loadAllergyAlerts(patientId: string): void {
    this.allergiesService.getAlerts(patientId).subscribe({
      next: (alerts) => this.allergyAlerts.set(alerts),
      error: () => {}
    });
  }

  // === Medication Items ===

  private createEmptyItem(): CreatePrescriptionItemRequest {
    return {
      medicationName: '',
      activeIngredient: '',
      presentation: '',
      dosage: '',
      quantity: 1,
      frequency: '',
      duration: '',
      route: 'Oral',
      instructions: ''
    };
  }

  openAddMedModal(): void {
    this.editingMedIndex.set(null);
    this.medForm.set(this.createEmptyItem());
    this.showMedModal.set(true);
  }

  openEditMedModal(index: number): void {
    this.editingMedIndex.set(index);
    this.medForm.set({ ...this.items()[index] });
    this.showMedModal.set(true);
  }

  confirmMedModal(): void {
    const med = this.medForm();
    if (!this.isMedValid(med)) return;

    const index = this.editingMedIndex();
    if (index !== null) {
      this.items.update(items => {
        const updated = [...items];
        updated[index] = { ...med };
        return updated;
      });
    } else {
      this.items.update(items => [...items, { ...med }]);
    }
    this.closeMedModal();
  }

  closeMedModal(): void {
    this.showMedModal.set(false);
    this.editingMedIndex.set(null);
  }

  removeMed(index: number): void {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  updateMedField(field: keyof CreatePrescriptionItemRequest, value: string | number): void {
    this.medForm.update(med => ({ ...med, [field]: value }));
  }

  isMedValid(med: CreatePrescriptionItemRequest): boolean {
    return med.medicationName.trim() !== '' &&
      med.dosage.trim() !== '' &&
      med.frequency.trim() !== '' &&
      med.duration.trim() !== '' &&
      med.quantity > 0;
  }

  get isEditingMed(): boolean {
    return this.editingMedIndex() !== null;
  }

  // === Validation ===

  isFormValid(): boolean {
    if (!this.selectedPatient()) return false;
    if (this.items().length === 0) return false;

    return this.items().every(item =>
      item.medicationName.trim() !== '' &&
      item.dosage.trim() !== '' &&
      item.frequency.trim() !== '' &&
      item.duration.trim() !== '' &&
      item.quantity > 0
    );
  }

  // === Submit ===

  onSubmit(): void {
    if (!this.isFormValid() || this.saving()) return;

    this.saving.set(true);

    const request: CreatePrescriptionRequest = {
      patientId: this.selectedPatient()!.id,
      appointmentId: this.selectedAppointmentId() || undefined,
      consultationNoteId: this.selectedConsultationNoteId() || undefined,
      issuedAt: new Date().toISOString(),
      diagnosis: this.diagnosis().trim() || undefined,
      notes: this.notes().trim() || undefined,
      items: this.items().map(item => ({
        ...item,
        medicationName: item.medicationName.trim(),
        activeIngredient: item.activeIngredient?.trim() || undefined,
        presentation: item.presentation?.trim() || undefined,
        dosage: item.dosage.trim(),
        frequency: item.frequency.trim(),
        duration: item.duration.trim(),
        route: item.route?.trim() || undefined,
        instructions: item.instructions?.trim() || undefined
      }))
    };

    this.prescriptionsService.create(request).subscribe({
      next: (result) => {
        this.notifications.success('Receta creada exitosamente');
        this.router.navigate(['/prescriptions', result.id]);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
