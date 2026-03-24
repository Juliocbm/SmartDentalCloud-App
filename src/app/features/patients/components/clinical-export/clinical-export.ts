import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PatientsService } from '../../services/patients.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { NotificationService } from '../../../../core/services/notification.service';
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
  private notifications = inject(NotificationService);

  patientId = '';
  breadcrumbItems: BreadcrumbItem[] = [];

  // Options
  includeAllergies = signal(true);
  includeDiagnoses = signal(true);
  includeTreatments = signal(true);
  includePrescriptions = signal(true);
  fromDate = signal('');
  toDate = signal('');

  // State
  loading = signal(false);
  error = signal<string | null>(null);

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

    this.patientsService.downloadClinicalExportPdf(this.patientId, {
      includeAllergies: this.includeAllergies(),
      includeDiagnoses: this.includeDiagnoses(),
      includeTreatments: this.includeTreatments(),
      includePrescriptions: this.includePrescriptions(),
      fromDate: this.fromDate() || undefined,
      toDate: this.toDate() || undefined
    }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err));
        this.notifications.error('Error al generar el resumen clínico');
        this.loading.set(false);
      }
    });
  }
}
