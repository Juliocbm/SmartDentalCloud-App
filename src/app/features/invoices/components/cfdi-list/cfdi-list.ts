import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { CfdiService } from '../../services/cfdi.service';
import { Cfdi, CFDI_STATUS_CONFIG } from '../../models/cfdi.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-cfdi-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './cfdi-list.html',
  styleUrl: './cfdi-list.scss'
})
export class CfdiListComponent implements OnInit {
  private cfdiService = inject(CfdiService);
  private logger = inject(LoggingService);
  private notifications = inject(NotificationService);

  cfdis = signal<Cfdi[]>([]);
  filteredCfdis = signal<Cfdi[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  statusFilter = signal('');

  CFDI_STATUS_CONFIG = CFDI_STATUS_CONFIG;
  statusOptions = Object.keys(CFDI_STATUS_CONFIG);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Facturación', route: '/invoices' },
    { label: 'CFDIs' }
  ];

  ngOnInit(): void {
    this.loadCfdis();
  }

  private loadCfdis(): void {
    this.loading.set(true);
    this.cfdiService.getAll().subscribe({
      next: (data) => {
        this.cfdis.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading CFDIs:', err);
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let result = this.cfdis();
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();

    if (search) {
      result = result.filter(c =>
        (c.uuid?.toLowerCase().includes(search)) ||
        (c.folio?.toLowerCase().includes(search)) ||
        (c.receptorNombre?.toLowerCase().includes(search)) ||
        (c.receptorRfc?.toLowerCase().includes(search)) ||
        (c.emisorNombre?.toLowerCase().includes(search))
      );
    }

    if (status) {
      result = result.filter(c => c.estado === status);
    }

    this.filteredCfdis.set(result);
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  onStatusChange(status: string): void {
    this.statusFilter.set(status);
    this.applyFilters();
  }

  getStatusConfig(estado: string) {
    return CFDI_STATUS_CONFIG[estado] || { label: estado, class: 'badge-neutral', icon: 'fa-circle' };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date | string): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(date));
  }

  onDownloadXml(cfdi: Cfdi): void {
    this.cfdiService.downloadXml(cfdi.id).subscribe({
      next: (blob) => this.saveFile(blob, `${cfdi.serie || ''}${cfdi.folio || cfdi.id}.xml`, 'application/xml'),
      error: () => this.notifications.error('Error al descargar XML')
    });
  }

  onDownloadPdf(cfdi: Cfdi): void {
    this.cfdiService.downloadPdf(cfdi.id).subscribe({
      next: (blob) => this.saveFile(blob, `${cfdi.serie || ''}${cfdi.folio || cfdi.id}.pdf`, 'application/pdf'),
      error: () => this.notifications.error('Error al descargar PDF')
    });
  }

  private saveFile(blob: Blob, filename: string, type: string): void {
    const url = window.URL.createObjectURL(new Blob([blob], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
