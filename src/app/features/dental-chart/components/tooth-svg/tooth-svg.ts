import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ToothStatus,
  ToothSurface,
  TOOTH_STATUS_CONFIG,
  TOOTH_ANATOMY,
  SURFACE_CONDITION_COLORS,
  getToothAnatomyType,
  getToothJaw,
  ToothShape
} from '../../models/dental-chart.models';
import { TOOTH_SVG_DATA, ToothPathData } from '../../models/tooth-paths';

@Component({
  selector: 'app-tooth-svg',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooth-svg.html',
  styleUrl: './tooth-svg.scss'
})
export class ToothSvgComponent {
  // Inputs
  fdi = input.required<string>();
  status = input<ToothStatus>('Healthy');
  surfaces = input<Record<string, string | null>>({});
  conditions = input<string[]>([]);
  selected = input<boolean>(false);
  hovered = input<boolean>(false);

  // Outputs
  toothClick = output<string>();
  toothHover = output<string | null>();

  // Computed: tooth anatomy shape (fallback for generic rendering)
  jaw = computed<'upper' | 'lower'>(() => getToothJaw(this.fdi()));

  shape = computed<ToothShape>(() => {
    const type = getToothAnatomyType(this.fdi());
    const jawPos = this.jaw();
    return TOOTH_ANATOMY[type][jawPos];
  });

  // Realistic SVG data (primary teeth 51-85 → permanent equivalents 11-45)
  toothData = computed<ToothPathData | null>(() => {
    const fdi = this.fdi();
    const num = parseInt(fdi, 10);
    const key = num >= 51 && num <= 85 ? String(num - 40) : fdi;
    return TOOTH_SVG_DATA[key] ?? null;
  });
  viewBox = computed(() => this.toothData()?.vb ?? '0 0 40 50');
  tw = computed(() => this.toothData()?.w ?? 40);
  th = computed(() => this.toothData()?.h ?? 50);

  // Overlay positioning helpers (scale to any viewBox)
  cx = computed(() => this.tw() / 2);
  crownCY = computed(() => this.jaw() === 'upper' ? this.th() * 0.68 : this.th() * 0.25);
  rootCY = computed(() => this.jaw() === 'upper' ? this.th() * 0.15 : this.th() * 0.85);
  overlayR = computed(() => this.tw() * 0.1);

  // Computed: crown fill color
  crownColor = computed(() => {
    const s = this.status();
    if (s === 'Missing' || s === 'Extracted') return '#E8E8E8';
    return TOOTH_STATUS_CONFIG[s]?.color ?? '#E0E0E0';
  });

  // Shadow fill: status-based tint for the silhouette layer
  shadowFill = computed(() => {
    const s = this.status();
    if (s === 'Healthy') return '#B7B7B9';
    if (s === 'Missing' || s === 'Extracted') return '#D5D5D5';
    return TOOTH_STATUS_CONFIG[s]?.color ?? '#B7B7B9';
  });

  // Computed: whether tooth is absent (missing/extracted)
  isAbsent = computed(() => {
    const s = this.status();
    return s === 'Missing' || s === 'Extracted';
  });

  // Computed: whether tooth is implant
  isImplant = computed(() => this.status() === 'Implant');

  // Computed: has any surface condition
  hasSurfaceConditions = computed(() => {
    const s = this.surfaces();
    return Object.values(s).some(v => v != null);
  });

  // Get surface condition color for mini diagram
  getSurfaceColor(surface: ToothSurface): string {
    const condition = this.surfaces()[surface];
    if (!condition) return 'var(--odonto-surface-empty, #F0F0F0)';
    return SURFACE_CONDITION_COLORS[condition] ?? '#FFB74D';
  }

  // Interaction handlers
  onClick(): void {
    this.toothClick.emit(this.fdi());
  }

  onMouseEnter(): void {
    this.toothHover.emit(this.fdi());
  }

  onMouseLeave(): void {
    this.toothHover.emit(null);
  }
}
