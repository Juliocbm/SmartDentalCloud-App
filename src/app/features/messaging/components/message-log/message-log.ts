import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { MessagingService } from '../../services/messaging.service';
import { MessageLog, MessageLogPaginated, MESSAGE_STATUS_CONFIG } from '../../models/messaging.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { DateFormatService } from '../../../../core/services/date-format.service';

@Component({
  selector: 'app-message-log',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './message-log.html',
  styleUrl: './message-log.scss'
})
export class MessageLogComponent implements OnInit {
  private messagingService = inject(MessagingService);

  messages = signal<MessageLog[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  pageNumber = signal(1);
  pageSize = signal(20);
  totalPages = signal(0);
  totalCount = signal(0);
  hasPreviousPage = signal(false);
  hasNextPage = signal(false);

  // Filters
  filterChannel = signal('');
  filterStatus = signal('');

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Mensajería' }
  ];

  STATUS_CONFIG = MESSAGE_STATUS_CONFIG;

  ngOnInit(): void {
    this.loadMessages();
  }

  private loadMessages(): void {
    this.loading.set(true);
    this.error.set(null);

    this.messagingService.getMessageLog(
      this.pageNumber(),
      this.pageSize(),
      undefined,
      this.filterChannel() || undefined,
      this.filterStatus() || undefined
    ).subscribe({
      next: (data: MessageLogPaginated) => {
        this.messages.set(data.items);
        this.totalPages.set(data.totalPages);
        this.totalCount.set(data.totalCount);
        this.hasPreviousPage.set(data.hasPreviousPage);
        this.hasNextPage.set(data.hasNextPage);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err, 'Error al cargar historial de mensajes'));
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.pageNumber.set(1);
    this.loadMessages();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pageNumber.set(page);
    this.loadMessages();
  }

  getStatusConfig(status: string): { label: string; cssClass: string; icon: string } {
    return this.STATUS_CONFIG[status] || { label: status, cssClass: 'badge-secondary', icon: 'fa-circle' };
  }

  getChannelIcon(channel: string): string {
    const icons: Record<string, string> = {
      WhatsApp: 'fa-brands fa-whatsapp',
      SMS: 'fa-solid fa-comment-sms',
      Email: 'fa-solid fa-envelope',
    };
    return icons[channel] || 'fa-solid fa-message';
  }

  getChannelClass(channel: string): string {
    const classes: Record<string, string> = {
      WhatsApp: 'channel-whatsapp',
      SMS: 'channel-sms',
      Email: 'channel-email',
    };
    return classes[channel] || '';
  }

  formatDate(date: string | null): string {
    return DateFormatService.dateTime(date);
  }

  formatDateShort(date: string | null): string {
    return DateFormatService.shortDate(date);
  }

  truncateMessage(body: string, maxLength = 80): string {
    if (body.length <= maxLength) return body;
    return body.substring(0, maxLength) + '…';
  }
}
