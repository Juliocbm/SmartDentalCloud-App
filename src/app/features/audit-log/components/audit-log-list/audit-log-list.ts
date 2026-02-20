import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditLogService } from '../../services/audit-log.service';
import { AuditLogEntry, AUDIT_ACTION_CONFIG } from '../../models/audit-log.models';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './audit-log-list.html',
  styleUrl: './audit-log-list.scss'
})
export class AuditLogListComponent implements OnInit {
  private auditService = inject(AuditLogService);

  logs = signal<AuditLogEntry[]>([]);
  loading = signal(false);
  entityTypeFilter = signal('');
  actionFilter = signal('');

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Auditoría' }
  ];

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.auditService.getLogs({
      entityType: this.entityTypeFilter() || undefined,
      action: this.actionFilter() || undefined,
      pageSize: 50
    }).subscribe({
      next: (data) => { this.logs.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange(): void {
    this.loadLogs();
  }

  getActionConfig(action: string) {
    return AUDIT_ACTION_CONFIG[action] || { icon: 'fa-circle', class: 'badge-neutral' };
  }

  formatDateTime(date: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date(date));
  }
}
