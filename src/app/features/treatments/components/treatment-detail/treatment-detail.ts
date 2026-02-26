import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TreatmentsService } from '../../services/treatments.service';
import { Treatment, TreatmentStatus, TREATMENT_STATUS_CONFIG } from '../../models/treatment.models';
import { TreatmentFollowUp } from '../../models/treatment-followup.models';
import { TreatmentMaterial } from '../../models/treatment-material.models';
import { TreatmentSession, SESSION_STATUS_CONFIG } from '../../models/treatment-session.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { ModalService } from '../../../../shared/services/modal.service';
import { FollowUpFormModalComponent, FollowUpFormModalData } from '../followup-form-modal/followup-form-modal';
import { MaterialFormModalComponent, MaterialFormModalData } from '../material-form-modal/material-form-modal';
import { SessionFormModalComponent, SessionFormModalData } from '../session-form-modal/session-form-modal';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-treatment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent],
  templateUrl: './treatment-detail.html',
  styleUrl: './treatment-detail.scss'
})
export class TreatmentDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private treatmentsService = inject(TreatmentsService);
  private logger = inject(LoggingService);
  private location = inject(Location);
  private notifications = inject(NotificationService);
  private modalService = inject(ModalService);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Tratamientos', route: '/treatments' },
    { label: 'Detalle' }
  ];

  // Tabs
  activeTab = signal<'general' | 'followups' | 'materials' | 'sessions'>('general');

  // State
  treatment = signal<Treatment | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Follow-ups state
  followUps = signal<TreatmentFollowUp[]>([]);
  followUpsLoading = signal(false);

  // Materials state
  materials = signal<TreatmentMaterial[]>([]);
  materialsLoading = signal(false);

  // Sessions state
  sessions = signal<TreatmentSession[]>([]);
  sessionsLoading = signal(false);

  // Constants
  TreatmentStatus = TreatmentStatus;
  TREATMENT_STATUS_CONFIG = TREATMENT_STATUS_CONFIG;
  SESSION_STATUS_CONFIG = SESSION_STATUS_CONFIG;

  setActiveTab(tab: 'general' | 'followups' | 'materials' | 'sessions'): void {
    this.activeTab.set(tab);
  }

  ngOnInit(): void {
    const treatmentId = this.route.snapshot.paramMap.get('id');
    if (treatmentId) {
      this.loadTreatment(treatmentId);
    }
  }

  private loadTreatment(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.treatmentsService.getById(id).subscribe({
      next: (data) => {
        this.treatment.set(data);
        this.loading.set(false);
        this.loadFollowUps(id);
        this.loadMaterials(id);
        this.loadSessions(id);
      },
      error: (err) => {
        this.logger.error('Error loading treatment:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  // === Follow-ups ===

  private loadFollowUps(treatmentId: string): void {
    this.followUpsLoading.set(true);
    this.treatmentsService.getFollowUps(treatmentId).subscribe({
      next: (data) => {
        const parsed = data.map(f => ({
          ...f,
          date: new Date(f.date),
          createdAt: new Date(f.createdAt)
        }));
        parsed.sort((a, b) => b.date.getTime() - a.date.getTime());
        this.followUps.set(parsed);
        this.followUpsLoading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar seguimientos'));
        this.followUpsLoading.set(false);
      }
    });
  }

  openFollowUpModal(): void {
    const treatmentId = this.treatment()?.id;
    if (!treatmentId) return;

    const ref = this.modalService.open<FollowUpFormModalData, boolean>(
      FollowUpFormModalComponent,
      { data: { treatmentId } }
    );

    ref.afterClosed().subscribe(result => {
      if (result) this.loadFollowUps(treatmentId);
    });
  }

  deleteFollowUp(followUpId: string): void {
    const treatmentId = this.treatment()?.id;
    if (!treatmentId) return;

    this.treatmentsService.deleteFollowUp(treatmentId, followUpId).subscribe({
      next: () => this.loadFollowUps(treatmentId)
    });
  }

  // === Materials ===

  private loadMaterials(treatmentId: string): void {
    this.materialsLoading.set(true);
    this.treatmentsService.getMaterials(treatmentId).subscribe({
      next: (data) => {
        this.materials.set(data);
        this.materialsLoading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar materiales'));
        this.materialsLoading.set(false);
      }
    });
  }

  openMaterialModal(): void {
    const treatmentId = this.treatment()?.id;
    if (!treatmentId) return;

    const ref = this.modalService.open<MaterialFormModalData, boolean>(
      MaterialFormModalComponent,
      { data: { treatmentId } }
    );

    ref.afterClosed().subscribe(result => {
      if (result) this.loadMaterials(treatmentId);
    });
  }

  deleteMaterial(materialId: string): void {
    const treatmentId = this.treatment()?.id;
    if (!treatmentId) return;

    this.treatmentsService.deleteMaterial(treatmentId, materialId).subscribe({
      next: () => this.loadMaterials(treatmentId)
    });
  }

  getMaterialsTotalCost(): number {
    return this.materials().reduce((sum, m) => sum + m.totalCost, 0);
  }

  // === Sessions ===

  private loadSessions(treatmentId: string): void {
    this.sessionsLoading.set(true);
    this.treatmentsService.getSessions(treatmentId).subscribe({
      next: (data) => {
        const parsed = data.map(s => ({
          ...s,
          date: new Date(s.date),
          createdAt: new Date(s.createdAt)
        }));
        parsed.sort((a, b) => a.sessionNumber - b.sessionNumber);
        this.sessions.set(parsed);
        this.sessionsLoading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar sesiones'));
        this.sessionsLoading.set(false);
      }
    });
  }

  getNextSessionNumber(): number {
    const max = this.sessions().reduce((m, s) => Math.max(m, s.sessionNumber), 0);
    return max + 1;
  }

  openSessionModal(): void {
    const treatment = this.treatment();
    if (!treatment) return;

    const ref = this.modalService.open<SessionFormModalData, boolean>(
      SessionFormModalComponent,
      {
        data: {
          treatmentId: treatment.id,
          patientId: treatment.patientId,
          nextSessionNumber: this.getNextSessionNumber()
        }
      }
    );

    ref.afterClosed().subscribe(result => {
      if (result) this.loadSessions(treatment.id);
    });
  }

  getSessionStatusConfig(status: string) {
    return SESSION_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  formatDateShort(date: Date | string): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  getStatusConfig(status: TreatmentStatus) {
    return TREATMENT_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  }

  formatDateTime(date: Date | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatCurrency(value: number | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  goBack(): void {
    this.location.back();
  }
}
