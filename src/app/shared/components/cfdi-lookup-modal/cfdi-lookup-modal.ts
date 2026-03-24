import { Component, input, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ModalComponent } from '../modal/modal';
import { CfdiService } from '../../../features/invoices/services/cfdi.service';
import { Cfdi } from '../../../features/invoices/models/cfdi.models';
import { LoggingService } from '../../../core/services/logging.service';
import { ModalComponentBase } from '../../../shared/services/modal.service';

@Component({
  selector: 'app-cfdi-lookup-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './cfdi-lookup-modal.html',
  styleUrl: './cfdi-lookup-modal.scss'
})
export class CfdiLookupModalComponent implements OnInit, ModalComponentBase<void, Cfdi> {
  modalData?: void;
  modalRef?: import('../../../shared/services/modal.service').ModalRef<void, Cfdi>;
  modalConfig?: import('../../../shared/services/modal.service').ModalConfig<void>;
  private cfdiService = inject(CfdiService);
  private logger = inject(LoggingService);

  title = input<string>('Seleccionar CFDI Sustituto');
  subtitle = input<string>('Busca y selecciona el CFDI timbrado que sustituirá al que se está cancelando.');
  icon = input<string>('fa-file-invoice-dollar');
  excludeCfdiId = input<string | undefined>(undefined);

  searchTerm = signal('');
  allCfdis = signal<Cfdi[]>([]);
  filteredCfdis = signal<Cfdi[]>([]);
  loading = signal(true);
  selectedCfdi = signal<Cfdi | null>(null);

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadCfdis();

    this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.applyFilter();
    });
  }

  private loadCfdis(): void {
    this.loading.set(true);
    this.cfdiService.getCfdisForLookup({
      estado: 'Vigente',
      excludeCfdiId: this.excludeCfdiId()
    }).subscribe({
      next: (result) => {
        const items = result?.items ?? [];
        this.allCfdis.set(items);
        this.filteredCfdis.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading CFDIs for lookup:', err);
        this.allCfdis.set([]);
        this.filteredCfdis.set([]);
        this.loading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  private applyFilter(): void {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      this.filteredCfdis.set(this.allCfdis());
      return;
    }
    this.filteredCfdis.set(
      this.allCfdis().filter(c =>
        (c.receptorNombre?.toLowerCase().includes(term) ?? false) ||
        (c.receptorRfc?.toLowerCase().includes(term) ?? false) ||
        (c.uuid?.toLowerCase().includes(term) ?? false) ||
        (c.serie?.toLowerCase().includes(term) ?? false) ||
        (c.folio?.toLowerCase().includes(term) ?? false) ||
        this.formatFolio(c).toLowerCase().includes(term)
      )
    );
  }

  selectCfdi(cfdi: Cfdi): void {
    this.selectedCfdi.set(cfdi);
  }

  onClose(): void {
    this.modalRef?.close();
  }

  onConfirm(): void {
    const cfdi = this.selectedCfdi();
    if (cfdi) {
      this.modalRef?.close(cfdi);
    }
  }

  formatFolio(cfdi: Cfdi): string {
    const s = cfdi.serie ?? '';
    const f = cfdi.folio ?? '';
    return `${s}${f}`.trim();
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  trackByCfdiId(_: number, cfdi: Cfdi): string {
    return cfdi.id;
  }
}
