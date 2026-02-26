import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TreatmentPlansService } from '../../services/treatment-plans.service';
import {
  TreatmentPlan,
  TreatmentPlanItem,
  TreatmentPlanStatus,
  ItemStatus,
  ItemPriority,
  TREATMENT_PLAN_STATUS_CONFIG,
  ITEM_PRIORITY_CONFIG,
  ITEM_STATUS_CONFIG,
  AddPlanItemRequest,
  UpdatePlanItemRequest
} from '../../models/treatment-plan.models';
import { DentalService } from '../../../invoices/models/service.models';
import { PatientsService } from '../../../patients/services/patients.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { SendEmailModalComponent } from '../../../../shared/components/send-email-modal/send-email-modal';
import { ServiceSelectComponent } from '../../../invoices/components/service-select/service-select';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-treatment-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent, AuditInfoComponent, ModalComponent, SendEmailModalComponent, ServiceSelectComponent, DatePickerComponent],
  templateUrl: './treatment-plan-detail.html',
  styleUrl: './treatment-plan-detail.scss'
})
export class TreatmentPlanDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private plansService = inject(TreatmentPlansService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private location = inject(Location);
  private patientsService = inject(PatientsService);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Planes de Tratamiento', route: '/treatment-plans' },
    { label: 'Detalle' }
  ];

  // State
  plan = signal<TreatmentPlan | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  actionLoading = signal(false);
  itemActionLoading = signal<string | null>(null);
  rejectReason = signal('');
  showRejectModal = signal(false);

  // Email modal state
  showEmailModal = signal(false);
  patientEmail = signal<string | null>(null);
  sendingEmail = signal(false);
  printLoading = signal(false);

  // Item modal state
  showItemModal = signal(false);
  editingItem = signal<TreatmentPlanItem | null>(null);
  itemSaving = signal(false);
  procForm!: FormGroup;
  priorityOptions = Object.values(ItemPriority);

  // Constants
  TreatmentPlanStatus = TreatmentPlanStatus;
  ItemStatus = ItemStatus;

  ngOnInit(): void {
    this.initProcForm();
    const planId = this.route.snapshot.paramMap.get('id');
    if (planId) {
      this.loadPlan(planId);
    }
  }

  private initProcForm(): void {
    this.procForm = this.fb.group({
      serviceId: [''],
      description: ['', Validators.required],
      notes: [''],
      priority: [ItemPriority.Medium],
      estimatedCost: [0, [Validators.required, Validators.min(0)]],
      discount: [0, Validators.min(0)],
      treatmentPhase: [''],
      estimatedDate: ['']
    });
  }

  private loadPlan(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.plansService.getById(id).subscribe({
      next: (data) => {
        this.plan.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading treatment plan:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  getStatusConfig(status: string) {
    return TREATMENT_PLAN_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  getItemPriorityConfig(priority: string) {
    return ITEM_PRIORITY_CONFIG[priority] || { label: priority, class: 'badge-neutral', icon: 'fa-circle' };
  }

  getItemStatusConfig(status: string) {
    return ITEM_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  getProgressPercentage(): number {
    const p = this.plan();
    if (!p || p.totalItems === 0) return 0;
    return Math.round((p.completedItems / p.totalItems) * 100);
  }

  canEdit(): boolean {
    const status = this.plan()?.status;
    return status !== TreatmentPlanStatus.Completed &&
           status !== TreatmentPlanStatus.Cancelled &&
           status !== undefined;
  }

  canApprove(): boolean {
    const status = this.plan()?.status;
    return status === TreatmentPlanStatus.Draft || status === TreatmentPlanStatus.PendingApproval;
  }

  canReject(): boolean {
    const status = this.plan()?.status;
    return status === TreatmentPlanStatus.Draft || status === TreatmentPlanStatus.PendingApproval;
  }

  canStart(): boolean {
    return this.plan()?.status === TreatmentPlanStatus.Approved;
  }

  canComplete(): boolean {
    const p = this.plan();
    return p?.status === TreatmentPlanStatus.InProgress && this.getProgressPercentage() >= 100;
  }

  async onApprove(): Promise<void> {
    const confirmed = await this.notifications.confirm('¿Está seguro de aprobar este plan de tratamiento?');
    if (!confirmed) return;

    this.actionLoading.set(true);
    const planId = this.plan()!.id;

    this.plansService.approve(planId).subscribe({
      next: () => {
        this.notifications.success('Plan de tratamiento aprobado exitosamente.');
        this.loadPlan(planId);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Error approving plan:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.actionLoading.set(false);
      }
    });
  }

  onShowReject(): void {
    this.rejectReason.set('');
    this.showRejectModal.set(true);
  }

  onCancelReject(): void {
    this.showRejectModal.set(false);
  }

  onConfirmReject(): void {
    const reason = this.rejectReason().trim();
    if (!reason) {
      this.notifications.error('Debe proporcionar una razón para el rechazo.');
      return;
    }

    this.actionLoading.set(true);
    this.showRejectModal.set(false);
    const planId = this.plan()!.id;

    this.plansService.reject(planId, reason).subscribe({
      next: () => {
        this.notifications.success('Plan de tratamiento rechazado.');
        this.loadPlan(planId);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Error rejecting plan:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.actionLoading.set(false);
      }
    });
  }

  async onStart(): Promise<void> {
    const confirmed = await this.notifications.confirm('¿Está seguro de iniciar este plan de tratamiento?');
    if (!confirmed) return;

    this.actionLoading.set(true);
    const planId = this.plan()!.id;

    this.plansService.start(planId).subscribe({
      next: () => {
        this.notifications.success('Plan de tratamiento iniciado.');
        this.loadPlan(planId);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Error starting plan:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.actionLoading.set(false);
      }
    });
  }

  async onComplete(): Promise<void> {
    const confirmed = await this.notifications.confirm('¿Marcar este plan de tratamiento como completado?');
    if (!confirmed) return;

    this.actionLoading.set(true);
    const planId = this.plan()!.id;

    this.plansService.complete(planId).subscribe({
      next: () => {
        this.notifications.success('Plan de tratamiento completado exitosamente.');
        this.loadPlan(planId);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Error completing plan:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.actionLoading.set(false);
      }
    });
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

  // ===== Item Progress Actions =====

  canStartItem(itemStatus: string): boolean {
    return itemStatus === ItemStatus.Pending;
  }

  canCompleteItem(itemStatus: string): boolean {
    return itemStatus === ItemStatus.Pending || itemStatus === ItemStatus.InProgress;
  }

  canCancelItem(itemStatus: string): boolean {
    return itemStatus !== ItemStatus.Completed && itemStatus !== ItemStatus.Cancelled;
  }

  async onStartItem(itemId: string): Promise<void> {
    await this.updateItemStatus(itemId, ItemStatus.InProgress);
  }

  async onCompleteItem(itemId: string): Promise<void> {
    const confirmed = await this.notifications.confirm('¿Marcar este procedimiento como completado?');
    if (!confirmed) return;
    await this.updateItemStatus(itemId, ItemStatus.Completed);
  }

  async onCancelItem(itemId: string): Promise<void> {
    const confirmed = await this.notifications.confirm('¿Cancelar este procedimiento?');
    if (!confirmed) return;
    await this.updateItemStatus(itemId, ItemStatus.Cancelled);
  }

  private async updateItemStatus(itemId: string, status: string): Promise<void> {
    const planId = this.plan()?.id;
    if (!planId || this.itemActionLoading()) return;

    this.itemActionLoading.set(itemId);

    this.plansService.updateItemProgress(planId, itemId, { status }).subscribe({
      next: () => {
        this.notifications.success('Procedimiento actualizado.');
        this.loadPlan(planId);
        this.itemActionLoading.set(null);
      },
      error: (err) => {
        this.logger.error('Error updating item progress:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.itemActionLoading.set(null);
      }
    });
  }

  // ===== Item Management =====

  canManageItems(): boolean {
    const status = this.plan()?.status;
    return status === TreatmentPlanStatus.Draft ||
           status === TreatmentPlanStatus.PendingApproval ||
           status === TreatmentPlanStatus.Approved ||
           status === TreatmentPlanStatus.InProgress;
  }

  canEditItem(item: TreatmentPlanItem): boolean {
    return this.canManageItems() &&
           item.status !== ItemStatus.Completed &&
           item.status !== ItemStatus.Cancelled;
  }

  canDeleteItem(item: TreatmentPlanItem): boolean {
    return this.canManageItems() && item.status === ItemStatus.Pending;
  }

  openAddItemModal(): void {
    this.editingItem.set(null);
    this.procForm.reset({
      serviceId: '',
      description: '',
      notes: '',
      priority: ItemPriority.Medium,
      estimatedCost: 0,
      discount: 0,
      treatmentPhase: '',
      estimatedDate: ''
    });
    this.showItemModal.set(true);
  }

  openEditItemModal(item: TreatmentPlanItem): void {
    this.editingItem.set(item);
    this.procForm.patchValue({
      serviceId: item.serviceId || '',
      description: item.description,
      notes: item.notes || '',
      priority: item.priority,
      estimatedCost: item.estimatedCost,
      discount: item.discount || 0,
      treatmentPhase: item.treatmentPhase || '',
      estimatedDate: item.estimatedDate ? new Date(item.estimatedDate).toISOString().split('T')[0] : ''
    });
    this.showItemModal.set(true);
  }

  closeItemModal(): void {
    this.showItemModal.set(false);
    this.editingItem.set(null);
  }

  onItemServiceSelected(service: DentalService | null): void {
    if (service) {
      this.procForm.patchValue({
        serviceId: service.id,
        description: this.procForm.get('description')?.value || service.name,
        estimatedCost: service.cost || 0
      });
    } else {
      this.procForm.patchValue({ serviceId: '' });
    }
  }

  isProcFieldInvalid(fieldName: string): boolean {
    const field = this.procForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  get procNetCost(): number {
    const cost = this.procForm.get('estimatedCost')?.value || 0;
    const discount = this.procForm.get('discount')?.value || 0;
    return cost - discount;
  }

  get isEditingItem(): boolean {
    return this.editingItem() !== null;
  }

  confirmItemModal(): void {
    if (this.procForm.invalid) {
      this.procForm.markAllAsTouched();
      return;
    }

    const planId = this.plan()?.id;
    if (!planId) return;

    this.itemSaving.set(true);
    const formValue = this.procForm.value;

    const request: AddPlanItemRequest = {
      serviceId: formValue.serviceId || undefined,
      description: formValue.description,
      notes: formValue.notes || undefined,
      priority: formValue.priority,
      estimatedCost: formValue.estimatedCost,
      discount: formValue.discount || undefined,
      treatmentPhase: formValue.treatmentPhase || undefined,
      estimatedDate: formValue.estimatedDate || undefined
    };

    const editing = this.editingItem();

    if (editing) {
      this.plansService.updateItem(planId, editing.id, request as UpdatePlanItemRequest).subscribe({
        next: () => {
          this.notifications.success('Procedimiento actualizado exitosamente.');
          this.closeItemModal();
          this.loadPlan(planId);
          this.itemSaving.set(false);
        },
        error: (err) => {
          this.logger.error('Error updating item:', err);
          this.notifications.error(getApiErrorMessage(err));
          this.itemSaving.set(false);
        }
      });
    } else {
      this.plansService.addItem(planId, request).subscribe({
        next: () => {
          this.notifications.success('Procedimiento agregado exitosamente.');
          this.closeItemModal();
          this.loadPlan(planId);
          this.itemSaving.set(false);
        },
        error: (err) => {
          this.logger.error('Error adding item:', err);
          this.notifications.error(getApiErrorMessage(err));
          this.itemSaving.set(false);
        }
      });
    }
  }

  async onDeleteItem(item: TreatmentPlanItem): Promise<void> {
    const confirmed = await this.notifications.confirm(
      `¿Eliminar el procedimiento "${item.description}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    const planId = this.plan()?.id;
    if (!planId) return;

    this.itemActionLoading.set(item.id);

    this.plansService.deleteItem(planId, item.id).subscribe({
      next: () => {
        this.notifications.success('Procedimiento eliminado exitosamente.');
        this.loadPlan(planId);
        this.itemActionLoading.set(null);
      },
      error: (err) => {
        this.logger.error('Error deleting item:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.itemActionLoading.set(null);
      }
    });
  }

  // ===== Email & Print =====

  openEmailModal(): void {
    const p = this.plan();
    if (!p) return;
    this.patientEmail.set(null);
    this.showEmailModal.set(true);
    this.patientsService.getById(p.patientId).subscribe({
      next: (patient) => this.patientEmail.set(patient.email || null),
      error: () => this.patientEmail.set(null)
    });
  }

  onSendEmail(email: string): void {
    const p = this.plan();
    if (!p) return;
    this.sendingEmail.set(true);
    this.plansService.sendEmail(p.id, email).subscribe({
      next: () => {
        this.notifications.success(`Plan de tratamiento enviado a ${email}`);
        this.showEmailModal.set(false);
        this.sendingEmail.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.sendingEmail.set(false);
      }
    });
  }

  onPrint(): void {
    const p = this.plan();
    if (!p) return;
    this.printLoading.set(true);
    this.plansService.downloadPdf(p.id).subscribe({
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

  goBack(): void {
    this.location.back();
  }
}
