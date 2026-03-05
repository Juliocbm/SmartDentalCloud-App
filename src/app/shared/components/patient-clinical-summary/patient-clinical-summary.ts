import { Component, input, signal, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientAllergiesService } from '../../../features/patients/services/patient-allergies.service';
import { PatientDiagnosesService } from '../../../features/patients/services/patient-diagnoses.service';
import { InformedConsentsService } from '../../../features/patients/services/informed-consents.service';
import { PatientAllergy } from '../../../features/patients/models/patient-allergy.models';
import { PatientDiagnosis } from '../../../features/patients/models/patient-diagnosis.models';

@Component({
  selector: 'app-patient-clinical-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-clinical-summary.html',
  styleUrl: './patient-clinical-summary.scss'
})
export class PatientClinicalSummaryComponent implements OnChanges {
  patientId = input<string | null>(null);
  bloodType = input<string | null>(null);
  compact = input(false);

  private allergiesService = inject(PatientAllergiesService);
  private diagnosesService = inject(PatientDiagnosesService);
  private consentsService = inject(InformedConsentsService);

  allergies = signal<PatientAllergy[]>([]);
  diagnoses = signal<PatientDiagnosis[]>([]);
  pendingConsentsCount = signal(0);
  loading = signal(false);

  get activeAllergiesCount(): number {
    return this.allergies().filter(a => a.isActive).length;
  }

  get severeAllergiesCount(): number {
    return this.allergies().filter(a => a.isActive && (a.severity === 'Severe' || a.severity === 'LifeThreatening')).length;
  }

  get activeDiagnosesCount(): number {
    return this.diagnoses().filter(p => p.status === 'Active').length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId']) {
      const pid = this.patientId();
      if (pid) {
        this.loadData(pid);
      }
    }
  }

  private loadData(patientId: string): void {
    this.loading.set(true);

    this.allergiesService.getByPatient(patientId, true).subscribe({
      next: (data) => this.allergies.set(data),
      error: () => {}
    });

    this.diagnosesService.getByPatient(patientId, 'Active').subscribe({
      next: (data) => {
        this.diagnoses.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.consentsService.getByPatient(patientId, 'Pending').subscribe({
      next: (consents) => this.pendingConsentsCount.set(consents.length),
      error: () => {}
    });
  }
}
