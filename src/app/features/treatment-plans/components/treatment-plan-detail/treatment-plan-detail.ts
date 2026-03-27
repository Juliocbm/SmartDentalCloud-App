import { Component, OnInit, signal, computed, inject } from '@angular/core';
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
import { DateFormatService } from '../../../../core/services/date-format.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { SendEmailModalComponent } from '../../../../shared/components/send-email-modal/send-email-modal';
import { ServiceSelectComponent } from '../../../invoices/components/service-select/service-select';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select';
import { InvoiceFormContextService } from '../../../invoices/services/invoice-form-context.service';
import { PLAN_INVOICE_CONTEXT } from '../../../invoices/models/invoice-form-context.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-treatment-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent, AuditInfoComponent, ModalComponent, SendEmailModalComponent, ServiceSelectComponent, DatePickerComponent, FormSelectComponent, EmptyStateComponent],
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
  private invoiceContextService = inject(InvoiceFormContextService);
  permissionService = inject(PermissionService);

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
  cancelReason = signal('');
  showCancelModal = signal(false);

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
  priorityOptions: SelectOption[] = Object.values(ItemPriority).map(p => ({ value: p, label: p }));

  // Tab navigation
  activeTab = signal<'info' | 'procedures'>('info');

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
      estimatedDate: [''],
      toothNumber: [''],
      surface: [''],
      quadrant: [null]
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

  getBilledItemsCount(): number {
    return this.plan()?.items.filter(i => i.isBilled).length ?? 0;
  }

  getBilledTotal(): number {
    return this.plan()?.items.filter(i => i.isBilled).reduce((sum, i) => sum + (i.actualCost ?? i.estimatedCost), 0) ?? 0;
  }

  getUnbilledCompletedCount(): number {
    return this.plan()?.items.filter(i => i.status === ItemStatus.Completed && i.linkedTreatmentId && !i.isBilled).length ?? 0;
  }

  getUnbilledTotal(): number {
    return this.plan()?.items
      .filter(i => i.status === ItemStatus.Completed && i.linkedTreatmentId && !i.isBilled)
      .reduce((sum, i) => sum + (i.actualCost ?? i.estimatedCost), 0) ?? 0;
  }

  canBillCompletedItems(): boolean {
    const p = this.plan();
    if (!p) return false;
    const status = p.status;
    return (status === TreatmentPlanStatus.InProgress || status === TreatmentPlanStatus.Completed) &&
           this.getUnbilledCompletedCount() > 0;
  }

  canGenerateAdvanceInvoice(): boolean {
    return this.plan()?.status === TreatmentPlanStatus.Approved;
  }

  onBillCompletedItems(): void {
    const p = this.plan();
    if (!p) return;
    this.invoiceContextService.setContext(
      PLAN_INVOICE_CONTEXT(p.patientId, p.patientName || '', p.id)
    );
    this.router.navigate(['/invoices', 'new'], {
      queryParams: { treatmentPlanId: p.id }
    });
  }

  onGenerateAdvanceInvoice(): void {
    const p = this.plan();
    if (!p) return;
    this.invoiceContextService.setContext(
      PLAN_INVOICE_CONTEXT(p.patientId, p.patientName || '', p.id)
    );
    this.router.navigate(['/invoices', 'new'], {
      queryParams: { treatmentPlanId: p.id, mode: 'advance' }
    });
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

  canCancel(): boolean {
    const status = this.plan()?.status;
    return status !== TreatmentPlanStatus.Completed &&
           status !== TreatmentPlanStatus.Cancelled &&
           status !== undefined;
  }

  async onSubmitForApproval(): Promise<void> {
    const confirmed = await this.notifications.confirm('¿Está seguro de enviar este plan a aprobación?');
    if (!confirmed) return;

    this.actionLoading.set(true);
    const planId = this.plan()!.id;

    this.plansService.submitForApproval(planId).subscribe({
      next: () => {
        this.notifications.success('Plan enviado a aprobación exitosamente.');
        this.loadPlan(planId);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Error submitting plan for approval:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.actionLoading.set(false);
      }
    });
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

  onShowCancel(): void {
    this.cancelReason.set('');
    this.showCancelModal.set(true);
  }

  onCancelCancel(): void {
    this.showCancelModal.set(false);
  }

  onConfirmCancel(): void {
    const reason = this.cancelReason().trim();
    if (!reason) {
      this.notifications.error('Debe proporcionar una razón para la cancelación.');
      return;
    }

    this.actionLoading.set(true);
    this.showCancelModal.set(false);
    const planId = this.plan()!.id;

    this.plansService.cancel(planId, reason).subscribe({
      next: () => {
        this.notifications.success('Plan de tratamiento cancelado.');
        this.loadPlan(planId);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Error cancelling plan:', err);
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

  // ===== Item Progress Actions =====

  canExecuteItem(item: TreatmentPlanItem): boolean {
    const planStatus = this.plan()?.status;
    return item.status === ItemStatus.Pending &&
           !!item.serviceId &&
           !item.linkedTreatmentId &&
           (planStatus === TreatmentPlanStatus.Approved || planStatus === TreatmentPlanStatus.InProgress);
  }

  async onExecuteItem(item: TreatmentPlanItem): Promise<void> {
    const confirmed = await this.notifications.confirm(
      `¿Ejecutar el procedimiento "${item.description}"? Se creará un tratamiento vinculado.`
    );
    if (!confirmed) return;

    const planId = this.plan()?.id;
    if (!planId || this.itemActionLoading()) return;

    this.itemActionLoading.set(item.id);

    this.plansService.executeItem(planId, item.id, {
      startDate: new Date().toISOString()
    }).subscribe({
      next: (treatment) => {
        this.notifications.success(`Tratamiento creado y vinculado al procedimiento.`);
        this.loadPlan(planId);
        this.itemActionLoading.set(null);
      },
      error: (err) => {
        this.logger.error('Error executing plan item:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.itemActionLoading.set(null);
      }
    });
  }

  async onCancelItem(itemId: string): Promise<void> {
    const confirmed = await this.notifications.confirm('¿Cancelar este procedimiento? No se podrá ejecutar después.');
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
      estimatedDate: '',
      toothNumber: '',
      surface: '',
      quadrant: null
    });
    this.showItemModal.set(true);
  }

  onDuplicateItem(item: TreatmentPlanItem): void {
    this.editingItem.set(null);
    this.procForm.patchValue({
      serviceId: item.serviceId || '',
      description: item.description,
      notes: item.notes || '',
      priority: item.priority,
      estimatedCost: item.estimatedCost,
      discount: item.discount || 0,
      treatmentPhase: item.treatmentPhase || '',
      estimatedDate: '',
      toothNumber: item.toothNumber || '',
      surface: item.surface || '',
      quadrant: item.quadrant ?? null
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
      estimatedDate: item.estimatedDate ? new Date(item.estimatedDate).toISOString().split('T')[0] : '',
      toothNumber: item.toothNumber || '',
      surface: item.surface || '',
      quadrant: item.quadrant ?? null
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
      estimatedDate: formValue.estimatedDate || undefined,
      toothNumber: formValue.toothNumber || undefined,
      surface: formValue.surface || undefined,
      quadrant: formValue.quadrant || undefined
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

  setActiveTab(tab: 'info' | 'procedures'): void {
    this.activeTab.set(tab);
  }

  retryLoad(): void {
    const planId = this.route.snapshot.paramMap.get('id');
    if (planId) {
      this.loadPlan(planId);
    }
  }

  goBack(): void {
    this.location.back();
  }
}
