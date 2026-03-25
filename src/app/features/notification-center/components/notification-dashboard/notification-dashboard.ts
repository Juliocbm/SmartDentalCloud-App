import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ModalService } from '../../../../shared/services/modal.service';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { NotificationCenterService } from '../../services/notification-center.service';
import { NotificationDetailModalComponent } from '../notification-detail-modal/notification-detail-modal';
import { SendNotificationModalComponent } from '../send-notification-modal/send-notification-modal';
import {
  NotificationQueueItem,
  NotificationStats,
  PaginatedResult,
  NOTIFICATION_STATUS_CONFIG,
  CHANNEL_CONFIG,
  NOTIFICATION_TYPE_LABELS,
  PRIORITY_CONFIG,
} from '../../models/notification-center.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-notification-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './notification-dashboard.html',
  styleUrl: './notification-dashboard.scss'
})
export class NotificationDashboardComponent implements OnInit, OnDestroy {
  private notificationCenterService = inject(NotificationCenterService);
  private modalService = inject(ModalService);
  private notifications = inject(NotificationService);
  permissionService = inject(PermissionService);

  // Expose for template
  DateFormatService = DateFormatService;

  // State
  stats = signal<NotificationStats | null>(null);
  items = signal<NotificationQueueItem[]>([]);
  loading = signal(false);
  statsLoading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  pageNumber = signal(1);
  pageSize = signal(15);
  totalPages = signal(0);
  totalCount = signal(0);
  hasPreviousPage = signal(false);
  hasNextPage = signal(false);

  // Filters
  filterChannel = signal('');
  filterStatus = signal('');
  filterType = signal('');
  searchTerm = signal('');

  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Constants for template
  STATUS_CONFIG = NOTIFICATION_STATUS_CONFIG;
  CHANNEL_CONFIG = CHANNEL_CONFIG;
  TYPE_LABELS = NOTIFICATION_TYPE_LABELS;
  PRIORITY_CONFIG = PRIORITY_CONFIG;
  PERMISSIONS = PERMISSIONS;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Centro de Notificaciones' }
  ];

  // Computed
  canManage = computed(() => this.permissionService.hasPermission(PERMISSIONS.NotificationsManage));
  failedCount = computed(() => this.stats()?.failed ?? 0);

  hasActiveFilters = computed(() =>
    this.filterChannel() !== '' || this.filterStatus() !== '' || this.filterType() !== '' || this.searchTerm() !== ''
  );

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.pageNumber.set(1);
      this.loadQueue();
    });

    this.loadStats();
    this.loadQueue();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats(): void {
    this.statsLoading.set(true);
    this.notificationCenterService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.statsLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading stats', err);
        this.statsLoading.set(false);
      }
    });
  }

  loadQueue(): void {
    this.loading.set(true);
    this.error.set(null);

    this.notificationCenterService.getQueue(
      this.pageNumber(),
      this.pageSize(),
      this.filterChannel() || undefined,
      this.filterStatus() || undefined,
      this.filterType() || undefined,
      undefined,
      undefined,
      this.searchTerm() || undefined
    ).subscribe({
      next: (data: PaginatedResult<NotificationQueueItem>) => {
        this.items.set(data.items);
        this.totalPages.set(data.totalPages);
        this.totalCount.set(data.totalCount);
        this.hasPreviousPage.set(data.hasPreviousPage);
        this.hasNextPage.set(data.hasNextPage);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err, 'Error al cargar la cola de notificaciones'));
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.pageNumber.set(1);
    this.loadQueue();
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pageNumber.set(page);
    this.loadQueue();
  }

  getPaginationPages(): number[] {
    const total = this.totalPages();
    const current = this.pageNumber();
    const maxVisible = 5;
    const pages: number[] = [];
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  refresh(): void {
    this.loadStats();
    this.loadQueue();
  }

  // Actions
  viewDetail(item: NotificationQueueItem): void {
    this.modalService.open(NotificationDetailModalComponent, {
      data: { notificationId: item.id },
    }).afterClosed().subscribe((action: string | undefined) => {
      if (action) this.refresh();
    });
  }

  sendNow(item: NotificationQueueItem): void {
    this.notificationCenterService.sendNow(item.id).subscribe({
      next: () => this.refresh(),
      error: (err) => this.notifications.error(getApiErrorMessage(err, 'Error al enviar la notificación'))
    });
  }

  retryItem(item: NotificationQueueItem): void {
    this.notificationCenterService.retry(item.id).subscribe({
      next: () => this.refresh(),
      error: (err) => this.notifications.error(getApiErrorMessage(err, 'Error al reintentar la notificación'))
    });
  }

  cancelItem(item: NotificationQueueItem): void {
    this.notificationCenterService.cancel(item.id).subscribe({
      next: () => this.refresh(),
      error: (err) => this.notifications.error(getApiErrorMessage(err, 'Error al cancelar la notificación'))
    });
  }

  bulkRetry(): void {
    this.notificationCenterService.bulkRetry().subscribe({
      next: () => this.refresh(),
      error: (err) => this.notifications.error(getApiErrorMessage(err, 'Error al reintentar las notificaciones'))
    });
  }

  openSendModal(): void {
    this.modalService.open(SendNotificationModalComponent, {}).afterClosed().subscribe((created: boolean | undefined) => {
      if (created) this.refresh();
    });
  }

  // Helpers
  getStatusConfig(status: string) {
    return this.STATUS_CONFIG[status] ?? { label: status, cssClass: 'badge-neutral', icon: 'fa-question' };
  }

  getChannelConfig(channel: string) {
    return this.CHANNEL_CONFIG[channel] ?? { label: channel, icon: 'fa-solid fa-circle', cssClass: '' };
  }

  getTypeLabel(type: string | null): string {
    return type ? (this.TYPE_LABELS[type] ?? type) : '—';
  }

  getPriorityConfig(priority: number) {
    return this.PRIORITY_CONFIG[priority] ?? { label: 'Normal', cssClass: 'badge-neutral' };
  }

  getRecipient(item: NotificationQueueItem): string {
    if (item.channel === 'Email') return item.recipientEmail ?? '—';
    return item.recipientPhone ?? '—';
  }
}
