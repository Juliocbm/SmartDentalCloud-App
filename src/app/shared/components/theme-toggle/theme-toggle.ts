import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.html',
  styleUrls: ['./theme-toggle.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  private readonly labels: Record<string, string> = {
    light: 'Tema: Claro',
    warm: 'Tema: Cálido',
    dark: 'Tema: Oscuro'
  };

  themeLabel = computed(() => this.labels[this.themeService.currentTheme()] ?? 'Cambiar tema');

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
