import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, output, computed } from '@angular/core';

export type FormAlertType = 'error' | 'warning' | 'success' | 'info';

/**
 * Componente reutilizable para banners de alerta en formularios.
 * Reemplaza el HTML duplicado de .alert .alert-{type} en 30+ templates.
 *
 * Uso:
 * ```html
 * <app-form-alert [message]="error()" (dismissed)="error.set(null)" />
 * <app-form-alert [message]="warning()" type="warning" [dismissible]="false" />
 * ```
 */
@Component({
  selector: 'app-form-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (message()) {
      <div class="alert alert-{{ type() }}" role="alert">
        <i class="fa-solid {{ icon() }} alert-icon"></i>
        <span class="alert-message">{{ message() }}</span>
        @if (dismissible()) {
          <button class="alert-close" type="button" (click)="dismissed.emit()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        }
      </div>
    }
  `
})
export class FormAlertComponent {
  message = input<string | null>(null);
  type = input<FormAlertType>('error');
  dismissible = input(true);
  dismissed = output<void>();

  icon = computed(() => {
    const icons: Record<FormAlertType, string> = {
      error: 'fa-circle-exclamation',
      warning: 'fa-triangle-exclamation',
      success: 'fa-circle-check',
      info: 'fa-circle-info'
    };
    return icons[this.type()];
  });
}
