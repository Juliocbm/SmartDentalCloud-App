import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PatientsService } from '../../services/patients.service';
import { PatientClinicalExportDto } from '../../models/patient.models';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-clinical-export',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './clinical-export.html',
  styleUrl: './clinical-export.scss'
})
export class ClinicalExportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private patientsService = inject(PatientsService);

  patientId = '';
  breadcrumbItems: BreadcrumbItem[] = [];

  // Options
  includeAllergies = signal(true);
  includeProblems = signal(true);
  includeTreatments = signal(true);
  includePrescriptions = signal(true);
  fromDate = signal('');
  toDate = signal('');

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  exportData = signal<PatientClinicalExportDto | null>(null);
  showOptions = signal(true);

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') || '';
    this.breadcrumbItems = [
      { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
      { label: 'Pacientes', route: '/patients' },
      { label: 'Detalle', route: `/patients/${this.patientId}` },
      { label: 'Resumen Clínico' }
    ];
  }

  generateExport(): void {
    this.loading.set(true);
    this.error.set(null);

    this.patientsService.getClinicalExport(this.patientId, {
      includeAllergies: this.includeAllergies(),
      includeProblems: this.includeProblems(),
      includeTreatments: this.includeTreatments(),
      includePrescriptions: this.includePrescriptions(),
      fromDate: this.fromDate() || undefined,
      toDate: this.toDate() || undefined
    }).subscribe({
      next: (data) => {
        this.exportData.set(data);
        this.loading.set(false);
        this.showOptions.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  printExport(): void {
    window.print();
  }

  resetOptions(): void {
    this.exportData.set(null);
    this.showOptions.set(true);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric'
    }).format(new Date(dateStr));
  }

  formatShortDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(dateStr));
  }

  getPatientAge(dob: string | null): string {
    if (!dob) return '—';
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return `${age} años`;
  }

  getSeverityClass(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'severe': case 'severa': return 'badge-danger';
      case 'moderate': case 'moderada': return 'badge-warning';
      case 'mild': case 'leve': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': case 'completado': return 'badge-success';
      case 'inprogress': case 'in_progress': case 'en progreso': return 'badge-warning';
      case 'active': case 'activo': return 'badge-info';
      case 'cancelled': case 'cancelado': return 'badge-danger';
      case 'resolved': case 'resuelto': return 'badge-success';
      default: return 'badge-secondary';
    }
  }
}
