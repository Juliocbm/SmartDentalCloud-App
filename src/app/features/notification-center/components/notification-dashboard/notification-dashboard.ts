import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, interval, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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
  allItems = signal<NotificationQueueItem[]>([]);
  filteredItems = signal<NotificationQueueItem[]>([]);
  loading = signal(false);
  statsLoading = signal(false);
  error = signal<string | null>(null);

  // Sorting
  sortColumn    = signal<string>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Filters
  filterChannel = signal('');
  filterStatus = signal('');
  filterType = signal('');
  searchTerm = signal('');

  // Pagination (client-side)
  currentPage = signal(1);
  pageSize = signal(15);

  totalPages = computed(() => Math.ceil(this.filteredItems().length / this.pageSize()) || 1);
  totalCount = computed(() => this.filteredItems().length);

  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredItems().slice(start, start + this.pageSize());
  });

  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private stopPolling$ = new Subject<void>();

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
      this.applyFilters();
    });

    this.loadStats();
    this.loadQueue();
  }

  ngOnDestroy(): void {
    this.stopPolling$.next();
    this.stopPolling$.complete();
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

    this.notificationCenterService.getQueue(1, 1000).subscribe({
      next: (data: PaginatedResult<NotificationQueueItem>) => {
        this.allItems.set(data.items);
        this.applyFilters();
        this.loading.set(false);
        if (this.hasSendingItems()) {
          this.startPolling();
        } else {
          this.stopPolling$.next();
        }
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err, 'Error al cargar la cola de notificaciones'));
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allItems()];

    // Search
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(item =>
        item.patientName?.toLowerCase().includes(search) ||
        item.recipientEmail?.toLowerCase().includes(search) ||
        item.recipientPhone?.toLowerCase().includes(search) ||
        item.subject?.toLowerCase().includes(search)
      );
    }

    // Channel filter
    const channel = this.filterChannel();
    if (channel) filtered = filtered.filter(item => item.channel === channel);

    // Status filter
    const status = this.filterStatus();
    if (status) filtered = filtered.filter(item => item.status === status);

    // Type filter
    const type = this.filterType();
    if (type) filtered = filtered.filter(item => item.notificationType === type);

    // Sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (col) {
      filtered.sort((a, b) => {
        let aVal: any;
        let bVal: any;
        switch (col) {
          case 'channel':          aVal = a.channel ?? '';                     bVal = b.channel ?? '';                     break;
          case 'notificationType': aVal = a.notificationType ?? '';            bVal = b.notificationType ?? '';            break;
          case 'patientName':      aVal = a.patientName?.toLowerCase() ?? '';  bVal = b.patientName?.toLowerCase() ?? '';  break;
          case 'subject':          aVal = a.subject?.toLowerCase() ?? '';      bVal = b.subject?.toLowerCase() ?? '';      break;
          case 'status':           aVal = a.status ?? '';                      bVal = b.status ?? '';                      break;
          case 'priority':         aVal = a.priority ?? 0;                     bVal = b.priority ?? 0;                     break;
          case 'createdAt':        aVal = new Date(a.createdAt).getTime();     bVal = new Date(b.createdAt).getTime();     break;
          default: return 0;
        }
        if (aVal < bVal) return dir === 'asc' ? -1 : 1;
        if (aVal > bVal) return dir === 'asc' ?  1 : -1;
        return 0;
      });
    }

    this.filteredItems.set(filtered);
    this.currentPage.set(1);
  }

  private hasSendingItems(): boolean {
    return this.allItems().some(item => item.status === 'Sending');
  }

  private startPolling(): void {
    this.stopPolling$.next();

    interval(5000).pipe(
      takeUntil(this.stopPolling$),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.loading()) return;

      this.notificationCenterService.getQueue(1, 1000).subscribe({
        next: (data: PaginatedResult<NotificationQueueItem>) => {
          this.allItems.set(data.items);
          this.applyFilters();
          if (!this.hasSendingItems()) {
            this.stopPolling$.next();
            this.loadStats();
          }
        },
        error: () => this.stopPolling$.next()
      });
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.applyFilters();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'fa-sort';
    return this.sortDirection() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPaginationPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
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
