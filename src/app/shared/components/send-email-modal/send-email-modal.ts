import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';

@Component({
  selector: 'app-send-email-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './send-email-modal.html',
  styleUrl: './send-email-modal.scss'
})
export class SendEmailModalComponent {
  // Inputs
  title = input<string>('Enviar por Email');
  subtitle = input<string>('Selecciona a dónde enviar el documento:');
  icon = input<string>('fa-envelope');
  patientEmail = input<string | null>(null);
  sending = input<boolean>(false);

  // Outputs
  send = output<string>();
  closed = output<void>();

  // Internal state
  emailOption = signal<'patient' | 'custom'>('patient');
  customEmail = signal('');

  selectedEmail = computed(() => {
    return this.emailOption() === 'patient'
      ? (this.patientEmail() ?? '')
      : this.customEmail().trim();
  });

  isEmailValid = computed(() => {
    const email = this.selectedEmail();
    return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  });

  onOpen(): void {
    this.emailOption.set(this.patientEmail() ? 'patient' : 'custom');
    this.customEmail.set('');
  }

  onClose(): void {
    this.closed.emit();
  }

  onConfirm(): void {
    if (this.isEmailValid()) {
      this.send.emit(this.selectedEmail());
    }
  }
}
