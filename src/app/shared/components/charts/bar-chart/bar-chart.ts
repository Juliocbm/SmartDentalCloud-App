import { Component, Input, inject, effect, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartData, ChartOptions } from 'chart.js';
import { ChartConfigService } from '../../../../core/services/chart-config.service';
import { ChartDataItem } from '../chart.models';

/**
 * Componente reutilizable para gráficos de Barras
 * Usa Chart.js directamente (compatible con Angular zoneless)
 */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bar-chart.html',
  styleUrls: ['./bar-chart.scss']
})
export class BarChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  private chartConfig = inject(ChartConfigService);
  private chart: Chart | null = null;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  /** Datos del gráfico */
  @Input() data: ChartDataItem[] = [];
  
  /** Título opcional */
  @Input() title = '';
  
  /** Barras horizontales */
  @Input() horizontal = false;
  
  /** Mostrar valores en barras */
  @Input() showValues = false;
  
  /** Altura del contenedor */
  @Input() height = '300px';

  constructor() {
    // Detectar cambios de tema y actualizar el gráfico
    effect(() => {
      this.chartConfig.colors();
      this.updateChart();
    });
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['data'] || changes['horizontal'])) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    if (!this.chartCanvas?.nativeElement || this.data.length === 0) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: this.getChartData(),
      options: this.getChartOptions()
    });
  }

  private updateChart(): void {
    if (!this.chart) {
      this.createChart();
      return;
    }

    this.chart.data = this.getChartData();
    this.chart.options = this.getChartOptions();
    this.chart.update();
  }

  private getChartData(): ChartData {
    const colors = this.chartConfig.colors();
    
    return {
      labels: this.data.map(item => item.label),
      datasets: [{
        data: this.data.map(item => item.value),
        backgroundColor: this.data.map((item, i) => item.color || colors[i % colors.length]),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 40
      }]
    };
  }

  private getChartOptions(): ChartOptions {
    return this.chartConfig.getBarOptions(this.horizontal) as ChartOptions;
  }
}
