import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { PatientsService } from '../../services/patients.service';
import { Patient, MergeResultDto } from '../../models/patient.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert';

@Component({
  selector: 'app-patient-merge',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, FormAlertComponent],
  templateUrl: './patient-merge.html',
  styleUrl: './patient-merge.scss'
})
export class PatientMergeComponent implements OnInit {
  private patientsService = inject(PatientsService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pacientes', route: '/patients' },
    { label: 'Fusionar Pacientes' }
  ];

  // Wizard step: 1=select, 2=review, 3=result
  step = signal(1);

  // Patient search
  primarySearch$ = new Subject<string>();
  duplicateSearch$ = new Subject<string>();
  primaryResults = signal<Patient[]>([]);
  duplicateResults = signal<Patient[]>([]);
  primarySearchText = signal('');
  duplicateSearchText = signal('');

  // Selected patients
  primaryPatient = signal<Patient | null>(null);
  duplicatePatient = signal<Patient | null>(null);

  // Options
  mergeMedicalHistory = signal(true);
  mergeFiscalData = signal(false);

  // Execution
  merging = signal(false);
  mergeResult = signal<MergeResultDto | null>(null);
  mergeError = signal<string | null>(null);

  ngOnInit(): void {
    this.primarySearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => term.length >= 2
        ? this.patientsService.searchSimple({ search: term, limit: 8 })
        : of([]))
    ).subscribe(results => this.primaryResults.set(results));

    this.duplicateSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => term.length >= 2
        ? this.patientsService.searchSimple({ search: term, limit: 8 })
        : of([]))
    ).subscribe(results => this.duplicateResults.set(results));
  }

  onPrimarySearch(term: string): void {
    this.primarySearchText.set(term);
    this.primarySearch$.next(term);
  }

  onDuplicateSearch(term: string): void {
    this.duplicateSearchText.set(term);
    this.duplicateSearch$.next(term);
  }

  selectPrimary(patient: Patient): void {
    this.primaryPatient.set(patient);
    this.primaryResults.set([]);
    this.primarySearchText.set('');
  }

  selectDuplicate(patient: Patient): void {
    this.duplicatePatient.set(patient);
    this.duplicateResults.set([]);
    this.duplicateSearchText.set('');
  }

  clearPrimary(): void {
    this.primaryPatient.set(null);
  }

  clearDuplicate(): void {
    this.duplicatePatient.set(null);
  }

  swapPatients(): void {
    const primary = this.primaryPatient();
    const duplicate = this.duplicatePatient();
    this.primaryPatient.set(duplicate);
    this.duplicatePatient.set(primary);
  }

  canProceedToStep2(): boolean {
    const p = this.primaryPatient();
    const d = this.duplicatePatient();
    return !!p && !!d && p.id !== d.id;
  }

  goToStep2(): void {
    if (this.canProceedToStep2()) {
      this.step.set(2);
    }
  }

  goBackToStep1(): void {
    this.step.set(1);
  }

  executeMerge(): void {
    const primary = this.primaryPatient();
    const duplicate = this.duplicatePatient();
    if (!primary || !duplicate) return;

    this.merging.set(true);
    this.mergeError.set(null);

    this.patientsService.mergePatients({
      primaryPatientId: primary.id,
      duplicatePatientId: duplicate.id,
      mergeMedicalHistory: this.mergeMedicalHistory(),
      mergeFiscalData: this.mergeFiscalData()
    }).subscribe({
      next: (result) => {
        this.mergeResult.set(result);
        this.merging.set(false);
        this.step.set(3);
        this.notification.success('Pacientes fusionados exitosamente');
      },
      error: (err) => {
        this.mergeError.set(getApiErrorMessage(err));
        this.merging.set(false);
      }
    });
  }

  getTotalMerged(): number {
    const r = this.mergeResult();
    if (!r) return 0;
    return r.appointmentsMerged + r.treatmentsMerged + r.notesMerged +
      r.prescriptionsMerged + r.allergiesMerged + r.consentsMerged +
      r.problemsMerged + r.invoicesMerged;
  }

  goToPrimaryPatient(): void {
    const p = this.primaryPatient();
    if (p) this.router.navigate(['/patients', p.id]);
  }

  formatDate(date: Date | null): string {
    return DateFormatService.mediumDate(date);
  }
}
