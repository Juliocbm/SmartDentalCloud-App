import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
export class PatientListComponent implements OnInit, OnDestroy {
  private patientsService = inject(PatientsService);
  private searchSubject = new Subject<string>();

  patients = signal<Patient[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);
  
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pacientes' }
  ];

  // Exponer Math para el template
  Math = Math;

  ngOnInit(): void {
    this.loadPatients();
    
    // Setup debounce for search with 300ms delay
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
      this.loadPatients();
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadPatients(): void {
    this.loading.set(true);
    this.error.set(null);

    const status = this.filterStatus();
    const isActive = status === 'all' ? undefined : status === 'active';

    this.patientsService.getAll(
      this.currentPage(),
      this.pageSize(),
      this.searchTerm() || undefined,
      isActive
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

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.filterStatus.set(value);
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
