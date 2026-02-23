import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TreatmentPlansService } from '../../services/treatment-plans.service';
import {
  TreatmentPlan,
  TreatmentPlanStatus,
  ItemStatus,
  TREATMENT_PLAN_STATUS_CONFIG,
  ITEM_PRIORITY_CONFIG,
  ITEM_STATUS_CONFIG
} from '../../models/treatment-plan.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';

@Component({
  selector: 'app-treatment-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent],
  templateUrl: './treatment-plan-detail.html',
  styleUrl: './treatment-plan-detail.scss'
})
export class TreatmentPlanDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private plansService = inject(TreatmentPlansService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private location = inject(Location);

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

  // Constants
  TreatmentPlanStatus = TreatmentPlanStatus;
  ItemStatus = ItemStatus;

  ngOnInit(): void {
    const planId = this.route.snapshot.paramMap.get('id');
    if (planId) {
      this.loadPlan(planId);
    }
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
        this.error.set('Error al cargar el plan de tratamiento.');
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
        this.notifications.error('Error al aprobar el plan de tratamiento.');
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
        this.notifications.error('Error al rechazar el plan de tratamiento.');
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
        this.notifications.error('Error al iniciar el plan de tratamiento.');
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
        this.notifications.error('Error al actualizar el procedimiento.');
        this.itemActionLoading.set(null);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
