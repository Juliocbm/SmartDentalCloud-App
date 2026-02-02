import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PatientsService } from '../../services/patients.service';
import { Patient } from '../../models/patient.models';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss'
})
export class PatientListComponent implements OnInit {
  private patientsService = inject(PatientsService);

  patients = signal<Patient[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);
  
  searchTerm = signal('');
  filterActive = signal<boolean | null>(null);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pacientes' }
  ];

  // Exponer Math para el template
  Math = Math;

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading.set(true);
    this.error.set(null);

    this.patientsService.getAll(
      this.currentPage(),
      this.pageSize(),
      this.searchTerm() || undefined
    ).subscribe({
      next: (response) => {
        this.patients.set(response.items);
        this.totalItems.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.error.set('Error al cargar pacientes. Por favor intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadPatients();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPatients();
    }
  }

  toggleActive(patient: Patient): void {
    const action = patient.isActive ? 'desactivar' : 'activar';
    
    if (confirm(`¿Está seguro de ${action} a ${patient.firstName} ${patient.lastName}?`)) {
      const operation = patient.isActive 
        ? this.patientsService.deactivate(patient.id)
        : this.patientsService.activate(patient.id);

      operation.subscribe({
        next: () => {
          this.loadPatients();
        },
        error: (err) => {
          console.error(`Error al ${action} paciente:`, err);
          alert(`Error al ${action} el paciente. Por favor intente nuevamente.`);
        }
      });
    }
  }

  deletePatient(patient: Patient): void {
    if (confirm(`¿Está seguro de eliminar a ${patient.firstName} ${patient.lastName}? Esta acción no se puede deshacer.`)) {
      this.patientsService.delete(patient.id).subscribe({
        next: () => {
          this.loadPatients();
        },
        error: (err) => {
          console.error('Error deleting patient:', err);
          alert('Error al eliminar el paciente. Por favor intente nuevamente.');
        }
      });
    }
  }

  getFullName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName}`.trim();
  }

  getAge(patient: Patient): string {
    return patient.age !== null ? `${patient.age} años` : 'N/A';
  }

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  hasAllergies(patient: Patient): boolean {
    return !!patient.allergies && patient.allergies.trim().length > 0;
  }

  hasMedicalHistory(patient: Patient): boolean {
    return !!(patient.allergies || patient.chronicDiseases || patient.currentMedications);
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const current = this.currentPage();
    const total = this.totalPages();
    
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
