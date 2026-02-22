import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, of, map } from 'rxjs';
import { PatientsService } from '../../../features/patients/services/patients.service';
import { PatientSearchResult } from '../../../features/patients/models/patient.models';
import { LoggingService } from '../../../core/services/logging.service';

@Component({
  selector: 'app-patient-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-autocomplete.html',
  styleUrl: './patient-autocomplete.scss'
})
export class PatientAutocompleteComponent implements OnChanges {
  private patientsService = inject(PatientsService);
  private logger = inject(LoggingService);

  @Input() selectedPatientId: string | null = null;
  @Input() selectedPatientName: string | null = null;
  @Input() placeholder = 'Buscar paciente...';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error: string | null = null;

  @Output() patientSelected = new EventEmitter<PatientSearchResult | null>();

  searchControl = new FormControl('');
  patients = signal<PatientSearchResult[]>([]);
  loading = signal(false);
  showDropdown = signal(false);
  selectedPatient = signal<PatientSearchResult | null>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedPatientId'] && this.selectedPatientId && this.selectedPatientName) {
      this.selectedPatient.set({
        id: this.selectedPatientId,
        name: this.selectedPatientName,
        email: '',
        phone: ''
      });
      this.searchControl.setValue(this.selectedPatientName, { emitEvent: false });
    }
  }

  constructor() {
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
          return this.patientsService.searchSimple({ search, limit: 10 }).pipe(
            map(patients => patients.map(p => ({
              id: p.id,
              name: `${p.firstName} ${p.lastName}`,
              email: p.email || '',
              phone: p.phoneNumber || ''
            })))
          );
        })
      )
      .subscribe({
        next: (results) => {
          this.patients.set(results);
          this.loading.set(false);
          this.showDropdown.set(results.length > 0);
        },
        error: (error) => {
          this.logger.error('Error searching patients:', error);
          this.loading.set(false);
          this.patients.set([]);
        }
      });
  }

  selectPatient(patient: PatientSearchResult) {
    this.selectedPatient.set(patient);
    this.searchControl.setValue(patient.name, { emitEvent: false });
    this.showDropdown.set(false);
    this.patientSelected.emit(patient);
  }

  clearSelection() {
    this.selectedPatient.set(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.patients.set([]);
    this.showDropdown.set(false);
    this.patientSelected.emit(null);
  }

  onFocus() {
    if (this.patients().length > 0) {
      this.showDropdown.set(true);
    }
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }
}
