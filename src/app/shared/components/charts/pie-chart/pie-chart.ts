import { Component, Input, inject, effect, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartData, ChartOptions } from 'chart.js';
import { ChartConfigService } from '../../../../core/services/chart-config.service';
import { ChartDataItem } from '../chart.models';

/**
 * Componente reutilizable para gráficos Pie/Doughnut
 * Usa Chart.js directamente (compatible con Angular zoneless)
 */
@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pie-chart.html',
  styleUrls: ['./pie-chart.scss']
})
export class PieChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  private chartConfig = inject(ChartConfigService);
  private chart: Chart | null = null;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  /** Datos del gráfico */
  @Input() data: ChartDataItem[] = [];
  
  /** Título opcional */
  @Input() title = '';
  
  /** Mostrar leyenda */
  @Input() showLegend = true;
  
  /** Usar estilo doughnut */
  @Input() doughnut = false;
  
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
    if (this.chart && (changes['data'] || changes['doughnut'] || changes['showLegend'])) {
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
      type: this.doughnut ? 'doughnut' : 'pie',
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
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        hoverBorderColor: '#fff',
        hoverBorderWidth: 3
      }]
    };
  }

  private getChartOptions(): ChartOptions {
    return this.chartConfig.getPieOptions(this.showLegend) as ChartOptions;
  }
}
