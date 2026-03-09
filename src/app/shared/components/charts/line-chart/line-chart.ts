import { Component, Input, inject, effect, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartData, ChartOptions } from 'chart.js';
import { ChartConfigService } from '../../../../core/services/chart-config.service';
import { LineDataset } from '../chart.models';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-chart.html',
  styleUrls: ['./line-chart.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  private chartConfig = inject(ChartConfigService);
  private chart: Chart<'line'> | null = null;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() labels: string[] = [];
  @Input() datasets: LineDataset[] = [];
  @Input() title = '';
  @Input() showLegend = true;
  @Input() height = '300px';

  constructor() {
    effect(() => {
      this.chartConfig.colors();
      this.updateChart();
    });
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['labels'] || changes['datasets'] || changes['showLegend'])) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    if (!this.chartCanvas?.nativeElement || this.labels.length === 0 || this.datasets.length === 0) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    this.chart = new Chart(ctx, {
      type: 'line',
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

  private getChartData(): ChartData<'line'> {
    const colors = this.chartConfig.colors();

    return {
      labels: this.labels,
      datasets: this.datasets.map((ds, index) => {
        const baseColor = ds.color || colors[index % colors.length];
        const fill = ds.fill ?? false;

        return {
          label: ds.label,
          data: ds.data,
          borderColor: baseColor,
          backgroundColor: fill ? this.withAlpha(baseColor, 0.2) : baseColor,
          fill,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: baseColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5
        };
      })
    };
  }

  private getChartOptions(): ChartOptions<'line'> {
    return this.chartConfig.getLineOptions(this.showLegend) as ChartOptions<'line'>;
  }

  private withAlpha(color: string, alpha: number): string {
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const bigint = parseInt(hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    return color;
  }
}
