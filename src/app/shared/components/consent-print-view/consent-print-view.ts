import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal';
import { ElectronicSignatureService, SignatureResult } from '../../../core/services/electronic-signature.service';
import { InformedConsent } from '../../../features/patients/models/informed-consent.models';
import { getConsentTypeLabel, getConsentStatusLabel } from '../../../features/patients/models/informed-consent.models';
import { DateFormatService } from '../../../core/services/date-format.service';

@Component({
  selector: 'app-consent-print-view',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './consent-print-view.html',
  styleUrl: './consent-print-view.scss'
})
export class ConsentPrintViewComponent implements OnInit {
  private signatureService = inject(ElectronicSignatureService);

  consent = input.required<InformedConsent>();
  patientName = input.required<string>();
  clinicName = input<string>('');

  closed = output<void>();
  signatures = signal<SignatureResult[]>([]);

  getConsentTypeLabel = getConsentTypeLabel;
  getConsentStatusLabel = getConsentStatusLabel;

  ngOnInit(): void {
    const c = this.consent();
    if (c) {
      this.signatureService.getSignatures('InformedConsent', c.id).subscribe({
        next: (sigs) => this.signatures.set(sigs),
        error: () => this.signatures.set([])
      });
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  print(): void {
    window.print();
  }

  formatDate(date: string | null): string {
    return DateFormatService.dateTime(date);
  }
}
