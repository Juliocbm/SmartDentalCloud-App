import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TreatmentsService } from '../../services/treatments.service';
import { Treatment, TreatmentStatus, TREATMENT_STATUS_CONFIG, UpdateTreatmentRequest } from '../../models/treatment.models';
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
import { DateFormatService } from '../../../../core/services/date-format.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { NotificationService } from '../../../../core/services/notification.service';
import { PatientAllergiesService } from '../../../patients/services/patient-allergies.service';
import { AllergyAlert } from '../../../patients/models/patient-allergy.models';
import { AllergyAlertBannerComponent } from '../../../../shared/components/allergy-alert-banner/allergy-alert-banner';
import { PatientClinicalSummaryComponent } from '../../../../shared/components/patient-clinical-summary/patient-clinical-summary';
import { InformedConsentsService, ConsentCheck } from '../../../patients/services/informed-consents.service';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { NavigationStateService } from '../../../../core/services/navigation-state.service';
import { InvoiceFormContextService } from '../../../invoices/services/invoice-form-context.service';
import { TREATMENT_INVOICE_CONTEXT } from '../../../invoices/models/invoice-form-context.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-treatment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent, AllergyAlertBannerComponent, PatientClinicalSummaryComponent, EmptyStateComponent],
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
  private allergiesService = inject(PatientAllergiesService);
  private consentsService = inject(InformedConsentsService);
  private navigationState = inject(NavigationStateService);
  private invoiceContextService = inject(InvoiceFormContextService);
  permissionService = inject(PermissionService);

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
  actionLoading = signal(false);

  // Follow-ups state
  followUps = signal<TreatmentFollowUp[]>([]);
  followUpsLoading = signal(false);

  // Materials state
  materials = signal<TreatmentMaterial[]>([]);
  materialsLoading = signal(false);

  // Sessions state
  sessions = signal<TreatmentSession[]>([]);
  sessionsLoading = signal(false);

  // Allergy alerts
  allergyAlerts = signal<AllergyAlert[]>([]);

  // Consent check
  consentCheck = signal<ConsentCheck | null>(null);

  // Constants
  TreatmentStatus = TreatmentStatus;
  TREATMENT_STATUS_CONFIG = TREATMENT_STATUS_CONFIG;
  SESSION_STATUS_CONFIG = SESSION_STATUS_CONFIG;

  setActiveTab(tab: 'general' | 'followups' | 'materials' | 'sessions'): void {
    this.activeTab.set(tab);
    this.navigationState.saveState(this.router.url, tab);
  }

  ngOnInit(): void {
    const treatmentId = this.route.snapshot.paramMap.get('id');
    if (treatmentId) {
      this.loadTreatment(treatmentId);
    }

    const savedTab = this.navigationState.getSavedTab(this.router.url);
    if (savedTab) {
      this.setActiveTab(savedTab as any);
    }
  }

  private loadTreatment(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.treatmentsService.getById(id).subscribe({
      next: (data) => {
        this.treatment.set(data);
        this.loading.set(false);
        this.loadAllergyAlerts(data.patientId);
        this.loadConsentCheck(data.patientId, id);
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

  private loadAllergyAlerts(patientId: string): void {
    this.allergiesService.getAlerts(patientId).subscribe({
      next: (alerts) => this.allergyAlerts.set(alerts),
      error: () => {}
    });
  }

  private loadConsentCheck(patientId: string, treatmentId: string): void {
    this.consentsService.checkConsent(patientId, { treatmentId }).subscribe({
      next: (check) => this.consentCheck.set(check),
      error: () => {}
    });
  }

  // === Status Actions ===

  canComplete(): boolean {
    const s = this.treatment()?.status;
    return s === TreatmentStatus.InProgress || s === TreatmentStatus.OnHold;
  }

  canCancel(): boolean {
    const s = this.treatment()?.status;
    return s === TreatmentStatus.InProgress || s === TreatmentStatus.OnHold;
  }

  canPutOnHold(): boolean {
    return this.treatment()?.status === TreatmentStatus.InProgress;
  }

  canResume(): boolean {
    return this.treatment()?.status === TreatmentStatus.OnHold;
  }

  async onCompleteTreatment(): Promise<void> {
    const confirmed = await this.notifications.confirm('¿Marcar este tratamiento como completado?');
    if (!confirmed) return;
    this.changeStatus(TreatmentStatus.Completed);
  }

  async onCancelTreatment(): Promise<void> {
    const confirmed = await this.notifications.confirm('¿Cancelar este tratamiento? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    this.changeStatus(TreatmentStatus.Cancelled);
  }

  onPutOnHold(): void {
    this.changeStatus(TreatmentStatus.OnHold);
  }

  onResumeTreatment(): void {
    this.changeStatus(TreatmentStatus.InProgress);
  }

  private changeStatus(newStatus: TreatmentStatus): void {
    const t = this.treatment();
    if (!t || this.actionLoading()) return;

    this.actionLoading.set(true);

    const request: UpdateTreatmentRequest = {
      id: t.id,
      patientId: t.patientId,
      serviceId: t.serviceId,
      startDate: new Date(t.startDate).toISOString(),
      endDate: t.endDate ? new Date(t.endDate).toISOString() : undefined,
      toothNumber: t.toothNumber,
      surface: t.surface,
      quadrant: t.quadrant,
      isMultipleTooth: t.isMultipleTooth,
      status: newStatus,
      duration: t.duration,
      notes: t.notes
    };

    this.treatmentsService.update(t.id, request).subscribe({
      next: () => {
        const labels: Record<string, string> = {
          [TreatmentStatus.Completed]: 'Tratamiento completado exitosamente.',
          [TreatmentStatus.Cancelled]: 'Tratamiento cancelado.',
          [TreatmentStatus.OnHold]: 'Tratamiento puesto en espera.',
          [TreatmentStatus.InProgress]: 'Tratamiento reanudado.'
        };
        this.notifications.success(labels[newStatus] || 'Estado actualizado.');
        this.loadTreatment(t.id);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Error changing treatment status:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.actionLoading.set(false);
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
    return DateFormatService.shortDate(date);
  }

  getStatusConfig(status: TreatmentStatus) {
    return TREATMENT_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  formatDate(date: Date | undefined): string {
    return DateFormatService.longDate(date);
  }

  formatDateTime(date: Date | undefined): string {
    return DateFormatService.dateTime(date);
  }

  formatCurrency(value: number | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  onGenerateInvoice(): void {
    const t = this.treatment();
    if (!t) return;
    this.invoiceContextService.setContext(
      TREATMENT_INVOICE_CONTEXT(t.patientId, t.patientName || '', t.id)
    );
    this.router.navigate(['/invoices', 'new']);
  }

  async onDelete(): Promise<void> {
    const t = this.treatment();
    if (!t || this.actionLoading()) return;

    const confirmed = await this.notifications.confirm(
      '¿Eliminar este tratamiento? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    this.actionLoading.set(true);
    this.treatmentsService.delete(t.id).subscribe({
      next: () => {
        this.notifications.success('Tratamiento eliminado exitosamente');
        this.router.navigate(['/treatments']);
      },
      error: (err) => {
        this.logger.error('Error deleting treatment:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.actionLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
