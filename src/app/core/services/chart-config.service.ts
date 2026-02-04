import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { ThemeService } from './theme.service';
import { ChartOptions } from 'chart.js';

/**
 * Servicio de configuración global para Charts
 * Centraliza colores, opciones y soporte de temas para todos los gráficos
 */
@Injectable({ providedIn: 'root' })
export class ChartConfigService {
  private themeService = inject(ThemeService);

  /** Signal que se actualiza cuando cambia el tema */
  private themeVersion = signal(0);

  constructor() {
    // Detectar cambios de tema y forzar recálculo de colores
    effect(() => {
      this.themeService.currentTheme();
      this.themeVersion.update(v => v + 1);
    });
  }

  /** Paleta de colores reactiva al tema actual */
  colors = computed(() => {
    this.themeVersion(); // Dependency para recálculo
    return this.getColorsFromCSS();
  });

  /** Obtiene colores desde las variables CSS */
  private getColorsFromCSS(): string[] {
    const root = document.documentElement;
    const style = getComputedStyle(root);

    return [
      style.getPropertyValue('--chart-color-1').trim() || '#3b82f6',
      style.getPropertyValue('--chart-color-2').trim() || '#10b981',
      style.getPropertyValue('--chart-color-3').trim() || '#f59e0b',
      style.getPropertyValue('--chart-color-4').trim() || '#ef4444',
      style.getPropertyValue('--chart-color-5').trim() || '#8b5cf6',
      style.getPropertyValue('--chart-color-6').trim() || '#06b6d4',
      style.getPropertyValue('--chart-color-7').trim() || '#ec4899',
      style.getPropertyValue('--chart-color-8').trim() || '#84cc16',
    ];
  }

  /** Obtiene color de texto según el tema */
  getTextColor(): string {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    return style.getPropertyValue('--chart-text-color').trim() || '#64748b';
  }

  /** Obtiene color de grid según el tema */
  getGridColor(): string {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    return style.getPropertyValue('--chart-grid-color').trim() || '#e2e8f0';
  }

  /** Configuración base para Pie/Doughnut charts */
  getPieOptions(showLegend = true): ChartOptions<'pie' | 'doughnut'> {
    const textColor = this.getTextColor();

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            font: { size: 12, family: 'inherit' },
            color: textColor
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 4
        }
      }
    };
  }

  /** Configuración base para Bar charts */
  getBarOptions(horizontal = false): ChartOptions<'bar'> {
    const textColor = this.getTextColor();
    const gridColor = this.getGridColor();

    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? 'y' : 'x',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: { 
            display: !horizontal,
            color: gridColor
          },
          ticks: { 
            font: { size: 11 },
            color: textColor
          },
          border: { display: false }
        },
        y: {
          grid: { 
            display: horizontal,
            color: gridColor
          },
          ticks: { 
            font: { size: 11 },
            color: textColor
          },
          border: { display: false }
        }
      }
    };
  }

  /** Configuración base para Line charts */
  getLineOptions(showLegend = true): ChartOptions<'line'> {
    const textColor = this.getTextColor();
    const gridColor = this.getGridColor();

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 16,
            font: { size: 12 },
            color: textColor
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          cornerRadius: 8,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { 
            font: { size: 11 },
            color: textColor
          },
          border: { display: false }
        },
        y: {
          grid: { color: gridColor },
          ticks: { 
            font: { size: 11 },
            color: textColor
          },
          border: { display: false },
          beginAtZero: true
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };
  }
}
