import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PrescriptionsService } from '../../services/prescriptions.service';
import {
  Prescription,
  PrescriptionStatus,
  PRESCRIPTION_STATUS_CONFIG
} from '../../models/prescription.models';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { SendEmailModalComponent } from '../../../../shared/components/send-email-modal/send-email-modal';
import { PatientsService } from '../../../patients/services/patients.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-prescription-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent, SendEmailModalComponent],
  templateUrl: './prescription-detail.html',
  styleUrl: './prescription-detail.scss'
})
export class PrescriptionDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private prescriptionsService = inject(PrescriptionsService);
  private patientsService = inject(PatientsService);
  private notifications = inject(NotificationService);
  private location = inject(Location);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Recetas', route: '/prescriptions' },
    { label: 'Detalle' }
  ];

  // State
  prescription = signal<Prescription | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  printLoading = signal(false);

  // Email Modal State
  showEmailModal = signal(false);
  patientEmail = signal<string | null>(null);
  sendingEmail = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPrescription(id);
    }
  }

  private loadPrescription(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.prescriptionsService.getById(id).subscribe({
      next: (data) => {
        this.prescription.set({
          ...data,
          issuedAt: new Date(data.issuedAt),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
        });
        this.loading.set(false);
        this.loadPatientEmail(data.patientId);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  getStatusConfig(status: string) {
    return PRESCRIPTION_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  isExpired(): boolean {
    const p = this.prescription();
    return !!p &&
      p.status === PrescriptionStatus.Active &&
      !!p.expiresAt &&
      new Date(p.expiresAt) < new Date();
  }

  formatDate(date: Date | string): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  }

  formatDateShort(date: Date | string): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  goBack(): void {
    this.location.back();
  }

  printPrescription(): void {
    const rx = this.prescription();
    if (!rx) return;
    this.printLoading.set(true);
    this.prescriptionsService.downloadPdf(rx.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.printLoading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.printLoading.set(false);
      }
    });
  }

  // Email
  private loadPatientEmail(patientId: string): void {
    this.patientsService.getById(patientId).subscribe({
      next: (patient) => this.patientEmail.set(patient.email || null),
      error: () => this.patientEmail.set(null)
    });
  }

  openEmailModal(): void {
    this.sendingEmail.set(false);
    this.showEmailModal.set(true);
  }

  closeEmailModal(): void {
    this.showEmailModal.set(false);
  }

  onSendEmail(email: string): void {
    const rx = this.prescription();
    if (!rx) return;

    this.sendingEmail.set(true);
    this.prescriptionsService.sendEmail(rx.id, { email }).subscribe({
      next: () => {
        this.notifications.success(`Receta enviada a ${email}`);
        this.sendingEmail.set(false);
        this.showEmailModal.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.sendingEmail.set(false);
      }
    });
  }
}
