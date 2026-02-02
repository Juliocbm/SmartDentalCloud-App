import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
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
  styleUrls: ['./modal.scss']
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showCloseButton: boolean = true;
  @Input() closeOnBackdrop: boolean = true;

  @Output() closed = new EventEmitter<void>();

  onBackdropClick(event: Event): void {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
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
