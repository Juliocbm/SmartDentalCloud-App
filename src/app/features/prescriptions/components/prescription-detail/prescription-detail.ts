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
import { SettingsService } from '../../../settings/services/settings.service';
import { TenantSettings } from '../../../settings/models/settings.models';

@Component({
  selector: 'app-prescription-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent],
  templateUrl: './prescription-detail.html',
  styleUrl: './prescription-detail.scss'
})
export class PrescriptionDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private prescriptionsService = inject(PrescriptionsService);
  private settingsService = inject(SettingsService);
  private location = inject(Location);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Recetas', route: '/prescriptions' },
    { label: 'Detalle' }
  ];

  // State
  prescription = signal<Prescription | null>(null);
  clinicSettings = signal<TenantSettings | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPrescription(id);
    }
    this.loadClinicSettings();
  }

  private loadClinicSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: (data) => this.clinicSettings.set(data),
      error: () => {} // Non-blocking: print will use fallbacks
    });
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
      },
      error: () => {
        this.error.set('Error al cargar la receta. Por favor intente nuevamente.');
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
    window.print();
  }
}
