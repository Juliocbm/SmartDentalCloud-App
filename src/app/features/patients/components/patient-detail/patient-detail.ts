import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PatientsService } from '../../services/patients.service';
import { Patient } from '../../models/patient.models';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss'
})
export class PatientDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientsService = inject(PatientsService);

  patient = signal<Patient | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'info' | 'medical' | 'dashboard' | 'history'>('info');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPatient(id);
    }
  }

  private loadPatient(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.patientsService.getById(id).subscribe({
      next: (patient) => {
        this.patient.set(patient);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading patient:', err);
        this.error.set('Error al cargar el paciente. Por favor intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  setActiveTab(tab: 'info' | 'medical' | 'dashboard' | 'history'): void {
    this.activeTab.set(tab);
  }

  toggleActive(): void {
    const patient = this.patient();
    if (!patient) return;

    const action = patient.isActive ? 'desactivar' : 'activar';
    
    if (confirm(`¿Está seguro de ${action} a ${patient.firstName} ${patient.lastName}?`)) {
      const operation = patient.isActive 
        ? this.patientsService.deactivate(patient.id)
        : this.patientsService.activate(patient.id);

      operation.subscribe({
        next: () => {
          this.loadPatient(patient.id);
        },
        error: (err) => {
          console.error(`Error al ${action} paciente:`, err);
          alert(`Error al ${action} el paciente. Por favor intente nuevamente.`);
        }
      });
    }
  }

  editPatient(): void {
    const patient = this.patient();
    if (patient) {
      this.router.navigate(['/patients', patient.id, 'edit']);
    }
  }

  getFullName(): string {
    const patient = this.patient();
    return patient ? `${patient.firstName} ${patient.lastName}`.trim() : '';
  }

  getAge(): string {
    const patient = this.patient();
    return patient && patient.age !== null ? `${patient.age} años` : 'N/A';
  }

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  hasAllergies(): boolean {
    const patient = this.patient();
    return !!(patient && patient.allergies && patient.allergies.trim().length > 0);
  }

  hasMedicalHistory(): boolean {
    const patient = this.patient();
    return !!(patient && (patient.allergies || patient.chronicDiseases || patient.currentMedications));
  }
}
