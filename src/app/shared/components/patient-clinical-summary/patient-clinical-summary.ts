import { Component, input, signal, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientAllergiesService } from '../../../features/patients/services/patient-allergies.service';
import { PatientProblemsService } from '../../../features/patients/services/patient-problems.service';
import { InformedConsentsService } from '../../../features/patients/services/informed-consents.service';
import { PatientAllergy } from '../../../features/patients/models/patient-allergy.models';
import { PatientProblem } from '../../../features/patients/models/patient-problem.models';

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
  private problemsService = inject(PatientProblemsService);
  private consentsService = inject(InformedConsentsService);

  allergies = signal<PatientAllergy[]>([]);
  problems = signal<PatientProblem[]>([]);
  pendingConsentsCount = signal(0);
  loading = signal(false);

  get activeAllergiesCount(): number {
    return this.allergies().filter(a => a.isActive).length;
  }

  get severeAllergiesCount(): number {
    return this.allergies().filter(a => a.isActive && (a.severity === 'Severe' || a.severity === 'LifeThreatening')).length;
  }

  get activeProblemsCount(): number {
    return this.problems().filter(p => p.status === 'Active').length;
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

    this.problemsService.getByPatient(patientId, 'Active').subscribe({
      next: (data) => {
        this.problems.set(data);
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
