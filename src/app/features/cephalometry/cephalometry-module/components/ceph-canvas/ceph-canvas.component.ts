import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Point,
  LandmarkKey,
  LandmarkMap,
  CalibrationData,
} from '../../models/cephalometry.models';
import { LANDMARKS } from '../../constants/landmarks.const';
import { arcPath, toFixedOrDash } from '../../utils/ceph-math.util';

@Component({
  selector: 'ceph-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ceph-canvas.component.html',
  styleUrls: ['./ceph-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CephCanvasComponent implements OnChanges {
  @Input() imageSrc: string | null = null;
  @Input() points: LandmarkMap = {};
  @Input() activeKey: LandmarkKey | null = null;
  @Input() showOverlay = true;
  @Input() calibration: CalibrationData = { point1: null, point2: null, knownMm: 20, mmPerPx: null };
  @Input() calibMode = false;
  @Input() placingMode = true;

  // Analysis values for overlay labels
  @Input() SNA = NaN;
  @Input() SNB = NaN;
  @Input() ANB = NaN;
  @Input() Saddle_NSAr = NaN;
  @Input() Articular_SArGo = NaN;
  @Input() Gonial_ArGoMe = NaN;

  @Output() canvasClick = new EventEmitter<Point>();
  @Output() pointDragged = new EventEmitter<{ key: LandmarkKey; point: Point }>();
  @Output() imageLoaded = new EventEmitter<HTMLImageElement>();

  @ViewChild('imgEl') imgRef!: ElementRef<HTMLImageElement>;

  readonly landmarks = LANDMARKS;

  private dragInfo: { key: LandmarkKey; offset: Point } | null = null;

  get statusMessage(): string {
    if (!this.imageSrc) return 'Cargue una radiografía';
    if (!this.calibration.mmPerPx) return 'Ahora realice la calibración';
    if (this.placingMode && this.activeKey) {
      const lm = LANDMARKS.find(l => l.key === this.activeKey);
      return `Marcando punto: ${lm?.label || this.activeKey}`;
    }
    if (this.placingMode && !this.activeKey) return 'Análisis terminado — puede exportar los resultados';
    return 'Seleccione o mueva puntos para ajustar el trazado';
  }

  get statusClass(): string {
    if (!this.imageSrc) return 'status-idle';
    if (!this.calibration.mmPerPx) return 'status-calibrate';
    if (this.placingMode && this.activeKey) return 'status-placing';
    if (this.placingMode && !this.activeKey) return 'status-done';
    return 'status-idle';
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Could trigger re-render logic if needed
  }

  onImageLoad(): void {
    if (this.imgRef?.nativeElement) {
      this.imageLoaded.emit(this.imgRef.nativeElement);
    }
  }

  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const pt: Point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    this.canvasClick.emit(pt);
  }

  onPointMouseDown(key: LandmarkKey, event: MouseEvent): void {
    event.stopPropagation();
    const svg = (event.target as SVGElement).closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const p = this.points[key];
    if (!p) return;
    this.dragInfo = { key, offset: { x: x - p.x, y: y - p.y } };

    const onMove = (e: MouseEvent) => {
      if (!this.dragInfo) return;
      const svgRect = svg.getBoundingClientRect();
      const nx = e.clientX - svgRect.left - this.dragInfo.offset.x;
      const ny = e.clientY - svgRect.top - this.dragInfo.offset.y;
      this.pointDragged.emit({ key: this.dragInfo.key, point: { x: nx, y: ny } });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      this.dragInfo = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // SVG helpers called from template
  hasPoint(key: LandmarkKey): boolean {
    return Boolean(this.points[key]);
  }

  getArcPath(vertexKey: LandmarkKey, arm1Key: LandmarkKey, arm2Key: LandmarkKey): string {
    const v = this.points[vertexKey];
    const p1 = this.points[arm1Key];
    const p2 = this.points[arm2Key];
    if (!v || !p1 || !p2) return '';
    return arcPath(v, p1, p2);
  }

  fmt(n: number): string {
    return toFixedOrDash(n);
  }

  trackByKey(_: number, lm: { key: string }): string {
    return lm.key;
  }
}
