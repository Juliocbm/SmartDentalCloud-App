import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditLogService } from '../../services/audit-log.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import {
  AuditLogEntry,
  AUDIT_ACTION_CONFIG,
  AUDIT_ENTITY_TYPES,
  AUDIT_ACTIONS,
  DEFAULT_AUDIT_ACTION_CONFIG
} from '../../models/audit-log.models';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, DatePickerComponent],
  templateUrl: './audit-log-list.html',
  styleUrl: './audit-log-list.scss'
})
export class AuditLogListComponent implements OnInit {
  private auditService = inject(AuditLogService);

  logs = signal<AuditLogEntry[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filtros
  entityTypeFilter = signal('');
  actionFilter = signal('');
  startDateFilter = signal('');
  endDateFilter = signal('');

  // Paginación
  currentPage = signal(1);
  readonly pageSize = signal(15);

  // Detalle expandido
  expandedLogId = signal<string | null>(null);

  // Constantes para template
  readonly entityTypes = AUDIT_ENTITY_TYPES;
  readonly actions = AUDIT_ACTIONS;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Auditoría' }
  ];

  // Paginación computada
  totalPages = computed(() => Math.ceil(this.logs().length / this.pageSize()) || 1);

  paginatedLogs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.logs().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.error.set(null);
    this.currentPage.set(1);
    this.expandedLogId.set(null);

    this.auditService.getLogs({
      entityType: this.entityTypeFilter() || undefined,
      action: this.actionFilter() || undefined,
      startDate: this.startDateFilter() || undefined,
      endDate: this.endDateFilter() || undefined,
      pageSize: 200
    }).subscribe({
      next: (data) => { this.logs.set(data); this.loading.set(false); },
      error: (err) => { this.error.set(getApiErrorMessage(err)); this.loading.set(false); }
    });
  }

  onFilterChange(): void {
    this.loadLogs();
  }

  clearFilters(): void {
    this.entityTypeFilter.set('');
    this.actionFilter.set('');
    this.startDateFilter.set('');
    this.endDateFilter.set('');
    this.loadLogs();
  }

  hasActiveFilters(): boolean {
    return !!(this.entityTypeFilter() || this.actionFilter() || this.startDateFilter() || this.endDateFilter());
  }

  // Detalle expandible
  toggleDetail(logId: string): void {
    this.expandedLogId.set(this.expandedLogId() === logId ? null : logId);
  }

  isExpanded(logId: string): boolean {
    return this.expandedLogId() === logId;
  }

  hasDetail(log: AuditLogEntry): boolean {
    return !!(log.oldValues || log.newValues);
  }

  parseJson(jsonStr?: string): Record<string, unknown> | null {
    if (!jsonStr) return null;
    try { return JSON.parse(jsonStr); } catch { return null; }
  }

  getObjectKeys(obj: Record<string, unknown> | null): string[] {
    return obj ? Object.keys(obj) : [];
  }

  // Config de acción
  getActionConfig(action: string) {
    return AUDIT_ACTION_CONFIG[action] || DEFAULT_AUDIT_ACTION_CONFIG;
  }

  // Formato de fecha
  formatDateTime(date: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date(date));
  }

  // Paginación
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.expandedLogId.set(null);
    }
  }

  getPaginationPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
