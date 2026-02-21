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
import { NotificationService } from '../../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';


@Component({
  selector: 'app-prescription-form',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
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
  items = signal<CreatePrescriptionItemRequest[]>([
    this.createEmptyItem()
  ]);

  // Pre-selected patient from query params
  private preselectedPatientId: string | null = null;

  ngOnInit(): void {
    this.preselectedPatientId = this.route.snapshot.queryParamMap.get('patientId');
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
      error: () => {
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
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.patientSearch.set('');
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

  addItem(): void {
    this.items.update(items => [...items, this.createEmptyItem()]);
  }

  removeItem(index: number): void {
    if (this.items().length <= 1) return;
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  updateItem(index: number, field: keyof CreatePrescriptionItemRequest, value: string | number): void {
    this.items.update(items => {
      const updated = [...items];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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
      error: () => {
        this.notifications.error('Error al crear la receta. Por favor intente nuevamente.');
        this.saving.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
