import { Component, inject, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { ElectronicSignatureService } from '../../../core/services/electronic-signature.service';
import { NotificationService } from '../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.utils';

@Component({
  selector: 'app-signature-pin-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './signature-pin-setup.html',
  styleUrl: './signature-pin-setup.scss'
})
export class SignaturePinSetupComponent {
  private signatureService = inject(ElectronicSignatureService);
  private notifications = inject(NotificationService);

  closed = output<void>();
  pinConfigured = output<void>();

  pin = signal('');
  confirmPin = signal('');
  showPin = signal(false);
  showConfirmPin = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  pinValid = computed(() => {
    const p = this.pin();
    if (p.length < 6) return false;
    if (!/[A-Z]/.test(p)) return false;
    if (!/[a-z]/.test(p)) return false;
    if (!/[0-9]/.test(p)) return false;
    return true;
  });

  pinsMatch = computed(() => {
    return this.pin().length > 0 && this.pin() === this.confirmPin();
  });

  canSubmit = computed(() => {
    return this.pinValid() && this.pinsMatch() && !this.saving();
  });

  onClose(): void {
    this.closed.emit();
  }

  toggleShowPin(): void {
    this.showPin.update(v => !v);
  }

  toggleShowConfirmPin(): void {
    this.showConfirmPin.update(v => !v);
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.saving.set(true);
    this.error.set(null);

    this.signatureService.setPin({
      pin: this.pin(),
      confirmPin: this.confirmPin()
    }).subscribe({
      next: () => {
        this.notifications.success('PIN de firma electrónica configurado correctamente');
        this.saving.set(false);
        this.pinConfigured.emit();
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }
}
