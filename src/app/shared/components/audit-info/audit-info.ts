import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal';

@Component({
  selector: 'app-audit-info',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './audit-info.html',
  styleUrl: './audit-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditInfoComponent {
  visible = input<boolean>(false);
  createdAt = input<Date | string | null | undefined>(null);
  createdByName = input<string | null | undefined>(null);
  updatedAt = input<Date | string | null | undefined>(null);
  updatedByName = input<string | null | undefined>(null);

  closed = output<void>();

  close(): void {
    this.closed.emit();
  }
}
