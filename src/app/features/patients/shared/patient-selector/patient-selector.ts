import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { PatientsService } from '../../services/patients.service';
import { Patient } from '../../models/patient.models';

@Component({
  selector: 'app-patient-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-selector.html',
  styleUrl: './patient-selector.scss'
})
export class PatientSelectorComponent implements OnInit {
  private patientsService = inject(PatientsService);

  @Input() selectedPatientId: string | null = null;
  @Input() placeholder = 'Seleccionar paciente...';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error: string | null = null;

  @Output() patientSelected = new EventEmitter<Patient | null>();

  searchControl = new FormControl('');
  patients = signal<Patient[]>([]);
  loading = signal(false);
  showDropdown = signal(false);
  selectedPatient = signal<Patient | null>(null);

  ngOnInit(): void {
    this.setupSearch();
    this.loadSelectedPatient();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(search => {
          if (!search || search.length < 2) {
            this.patients.set([]);
            return of([]);
          }
          
          this.loading.set(true);
          return this.patientsService.searchSimple({ search, limit: 10 });
        })
      )
      .subscribe({
        next: (patients) => {
          this.patients.set(patients);
          this.loading.set(false);
          this.showDropdown.set(patients.length > 0);
        },
        error: (error) => {
          console.error('Error searching patients:', error);
          this.loading.set(false);
          this.patients.set([]);
        }
      });
  }

  private loadSelectedPatient(): void {
    if (this.selectedPatientId) {
      this.patientsService.getById(this.selectedPatientId).subscribe({
        next: (patient) => {
          this.selectedPatient.set(patient);
          this.searchControl.setValue(this.getPatientDisplayName(patient), { emitEvent: false });
        },
        error: (error) => {
          console.error('Error loading selected patient:', error);
        }
      });
    }
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.searchControl.setValue(this.getPatientDisplayName(patient), { emitEvent: false });
    this.showDropdown.set(false);
    this.patientSelected.emit(patient);
  }

  clearSelection(): void {
    this.selectedPatient.set(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.patients.set([]);
    this.showDropdown.set(false);
    this.patientSelected.emit(null);
  }

  onFocus(): void {
    if (this.patients().length > 0) {
      this.showDropdown.set(true);
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }

  getPatientDisplayName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName}`.trim();
  }

  getPatientAge(patient: Patient): string {
    return patient.age !== null ? `${patient.age} años` : '';
  }

  getPatientContact(patient: Patient): string {
    if (patient.phoneNumber) return patient.phoneNumber;
    if (patient.email) return patient.email;
    return 'Sin contacto';
  }
}
