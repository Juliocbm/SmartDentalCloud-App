import { Component, input, output, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente base para modales reutilizables.
 * Proporciona la estructura visual y comportamiento común de todos los modales.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrls: ['./modal.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
  title = input<string>('');
  subtitle = input<string | undefined>();
  icon = input<string | undefined>();
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  showCloseButton = input<boolean>(true);
  closeOnBackdrop = input<boolean>(true);

  closed = output<void>();

  onBackdropClick(event: Event): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.close();
  }
}
