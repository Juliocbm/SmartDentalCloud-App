import { Component, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { ElectronicSignatureService, SignatureResult } from '../../../core/services/electronic-signature.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.utils';

@Component({
  selector: 'app-signature-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './signature-modal.html',
  styleUrl: './signature-modal.scss'
})
export class SignatureModalComponent {
  private signatureService = inject(ElectronicSignatureService);

  entityType = input.required<string>();
  entityId = input.required<string>();
  documentTitle = input<string>('Documento clínico');

  signed = output<SignatureResult>();
  cancelled = output<void>();

  pin = signal('');
  reason = signal('');
  showPin = signal(false);
  signing = signal(false);
  error = signal<string | null>(null);

  canSign = computed(() => {
    return this.pin().length >= 6 && !this.signing();
  });

  onClose(): void {
    this.cancelled.emit();
  }

  toggleShowPin(): void {
    this.showPin.update(v => !v);
  }

  sign(): void {
    if (!this.canSign()) return;
    this.signing.set(true);
    this.error.set(null);

    this.signatureService.signDocument({
      entityType: this.entityType(),
      entityId: this.entityId(),
      pin: this.pin(),
      reason: this.reason().trim() || undefined
    }).subscribe({
      next: (result) => {
        this.signing.set(false);
        this.signed.emit(result);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err));
        this.signing.set(false);
        this.pin.set('');
      }
    });
  }
}
