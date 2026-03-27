import { Component, OnInit, signal, computed, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientsService } from '../../services/patients.service';
import { PatientLedger, LedgerEntry } from '../../models/patient-dashboard.models';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-patient-ledger',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent],
  templateUrl: './patient-ledger.html',
  styleUrl: './patient-ledger.scss'
})
export class PatientLedgerComponent implements OnInit {
  @Input() patientId!: string;

  private patientsService = inject(PatientsService);
  private logger = inject(LoggingService);

  ledger = signal<PatientLedger | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  hasData = computed(() => (this.ledger()?.entries.length ?? 0) > 0);

  ngOnInit(): void {
    if (this.patientId) {
      this.loadLedger();
    }
  }

  private loadLedger(): void {
    this.loading.set(true);
    this.error.set(null);

    this.patientsService.getLedger(this.patientId).subscribe({
      next: (data) => {
        this.ledger.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading patient ledger:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  getEntryIcon(type: string): string {
    switch (type) {
      case 'Charge': return 'fa-solid fa-stethoscope';
      case 'Invoice': return 'fa-solid fa-file-invoice-dollar';
      case 'Payment': return 'fa-solid fa-money-bill-wave';
      default: return 'fa-solid fa-circle';
    }
  }

  getEntryClass(type: string): string {
    switch (type) {
      case 'Charge': return 'ledger-entry--charge';
      case 'Invoice': return 'ledger-entry--invoice';
      case 'Payment': return 'ledger-entry--payment';
      default: return '';
    }
  }

  getEntryTypeLabel(type: string): string {
    switch (type) {
      case 'Charge': return 'Cargo';
      case 'Invoice': return 'Factura';
      case 'Payment': return 'Pago';
      default: return type;
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  formatDate(date: Date | string): string {
    return DateFormatService.shortDate(date);
  }
}
