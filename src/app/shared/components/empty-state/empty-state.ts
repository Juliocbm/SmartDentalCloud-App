import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type EmptyStateType = 'empty' | 'no-results' | 'error' | 'success' | 'informative';
export type EmptyStateSize = 'default' | 'sm';

const DEFAULT_ICONS: Record<EmptyStateType, string> = {
  'empty':       'fa-inbox',
  'no-results':  'fa-filter-circle-xmark',
  'error':       'fa-exclamation-triangle',
  'success':     'fa-circle-check',
  'informative': 'fa-circle-info'
};

const DEFAULT_TITLES: Record<EmptyStateType, string> = {
  'empty':       'Sin registros',
  'no-results':  'Sin resultados',
  'error':       'Error al cargar',
  'success':     'Todo en orden',
  'informative': ''
};

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmptyStateComponent {
  @Input() type: EmptyStateType = 'empty';
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() icon: string = '';
  @Input() size: EmptyStateSize = 'default';

  @Input() showAction: boolean = false;
  @Input() actionLabel: string = '';
  @Input() actionIcon: string = '';
  @Input() actionType: 'link' | 'button' = 'button';
  @Input() actionRoute: string = '';
  @Input() actionStyleClass: string = 'btn btn-es-action';

  @Output() actionClick = new EventEmitter<void>();

  get resolvedIcon(): string {
    return this.icon || DEFAULT_ICONS[this.type];
  }

  get resolvedTitle(): string {
    return this.title || DEFAULT_TITLES[this.type];
  }
}
