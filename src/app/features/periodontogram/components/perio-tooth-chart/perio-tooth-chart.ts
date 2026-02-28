import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TOOTH_SVG_DATA } from '../../../../shared/models/tooth-svg-data';
import type { ToothPathData } from '../../../../shared/models/tooth-svg-data';
import { getToothJaw, getToothAnatomyType, TOOTH_NAMES } from '../../../../shared/models/fdi-tooth-layout';
import {
  EditableTooth,
  EditableSite,
  UPPER_TEETH_ORDER,
  LOWER_TEETH_ORDER
} from '../../models/periodontogram.models';

/**
 * Constants for SVG layout.
 * Each tooth occupies a fixed-width column in the chart.
 */
const TOOTH_COL_WIDTH = 36;
const TOOTH_RENDER_HEIGHT = 52;  // Rendered height of each tooth
const CHART_PADDING_LEFT = 0;
const CHART_PADDING_TOP = 6;
const MARGIN_AREA_HEIGHT = 30;   // Space above/below teeth for gingival/root area
const CEJ_OFFSET_RATIO = 0.30;  // CEJ is ~30% into the tooth from the root end
const GRID_LINE_SPACING = 5;    // px between horizontal grid lines (~2mm)
const GRID_LINE_COUNT = 8;      // number of horizontal reference lines
const SITE_OFFSETS = [0.2, 0.5, 0.8]; // Mesial, Central, Distal relative X within column

@Component({
  selector: 'app-perio-tooth-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perio-tooth-chart.html',
  styleUrl: './perio-tooth-chart.scss'
})
export class PerioToothChartComponent {
  @Input({ required: true }) teeth!: EditableTooth[];
  @Input() selectedTooth = signal<string | null>(null);
  @Input() surface: 'buccal' | 'lingual' = 'buccal';
  @Input() jaw: 'upper' | 'lower' = 'upper';
  @Output() toothSelected = new EventEmitter<string>();

  TOOTH_NAMES = TOOTH_NAMES;

  // Computed chart dimensions
  get teethOrder(): string[] {
    return this.jaw === 'upper' ? UPPER_TEETH_ORDER : LOWER_TEETH_ORDER;
  }

  get chartWidth(): number {
    return CHART_PADDING_LEFT * 2 + this.teethOrder.length * TOOTH_COL_WIDTH;
  }

  get chartHeight(): number {
    return MARGIN_AREA_HEIGHT + TOOTH_RENDER_HEIGHT + MARGIN_AREA_HEIGHT + CHART_PADDING_TOP * 2;
  }

  get viewBox(): string {
    return `0 0 ${this.chartWidth} ${this.chartHeight}`;
  }

  // Y positions
  get toothTopY(): number {
    return CHART_PADDING_TOP + MARGIN_AREA_HEIGHT;
  }

  get toothBottomY(): number {
    return this.toothTopY + TOOTH_RENDER_HEIGHT;
  }

  // Baseline Y for gingival margin (at cemento-enamel junction level)
  // Positioned ~30% into the tooth from the root end, not at the edge
  get gingivalBaselineY(): number {
    if (this.jaw === 'upper') {
      return this.toothBottomY - TOOTH_RENDER_HEIGHT * CEJ_OFFSET_RATIO;
    }
    return this.toothTopY + TOOTH_RENDER_HEIGHT * CEJ_OFFSET_RATIO;
  }

  // Horizontal grid lines in the root area (behind the teeth)
  getGridLineYs(): number[] {
    const lines: number[] = [];
    const baseY = this.gingivalBaselineY;
    for (let i = 1; i <= GRID_LINE_COUNT; i++) {
      if (this.jaw === 'upper') {
        lines.push(baseY - i * GRID_LINE_SPACING);
      } else {
        lines.push(baseY + i * GRID_LINE_SPACING);
      }
    }
    return lines;
  }

  // ======= Tooth positioning =======

  getToothX(index: number): number {
    return CHART_PADDING_LEFT + index * TOOTH_COL_WIDTH;
  }

  getToothCenterX(index: number): number {
    return this.getToothX(index) + TOOTH_COL_WIDTH / 2;
  }

  getSiteX(toothIndex: number, siteIndex: number): number {
    return this.getToothX(toothIndex) + TOOTH_COL_WIDTH * SITE_OFFSETS[siteIndex];
  }

  getToothByNumber(tn: string): EditableTooth | undefined {
    return this.teeth?.find(t => t.toothNumber === tn);
  }

  // ======= Tooth SVG data =======

  getToothData(tn: string): ToothPathData | null {
    return TOOTH_SVG_DATA[tn] ?? null;
  }

  getToothTransform(index: number): string {
    const tn = this.teethOrder[index];
    const td = this.getToothData(tn);
    if (!td) return '';

    // Scale each tooth based on its actual viewBox dimensions
    const scaleX = (TOOTH_COL_WIDTH - 2) / td.w; // -2 for tiny gap between teeth
    const scaleY = TOOTH_RENDER_HEIGHT / td.h;
    const scale = Math.min(scaleX, scaleY); // uniform scale to preserve proportions

    // Center tooth horizontally within its column
    const renderedW = td.w * scale;
    const renderedH = td.h * scale;
    const offsetX = this.getToothX(index) + (TOOTH_COL_WIDTH - renderedW) / 2;

    // Align bottom of tooth to toothBottomY (roots at top for upper, crown at top for lower)
    const offsetY = this.toothTopY + (TOOTH_RENDER_HEIGHT - renderedH) / 2;

    return `translate(${offsetX}, ${offsetY}) scale(${scale})`;
  }

  // ======= Tooth fill based on max PD severity =======

  getToothFill(tooth: EditableTooth): string {
    if (tooth.isMissing) return '#E8E8E8';
    const sites = this.surface === 'buccal' ? tooth.buccalSites : tooth.lingualSites;
    const pds = sites.filter(s => s.pd != null).map(s => s.pd!);
    if (!pds.length) return '#FDFDFD';
    const maxPD = Math.max(...pds);
    if (maxPD <= 3) return '#E8F5E9';
    if (maxPD <= 5) return '#FFF8E1';
    return '#FFEBEE';
  }

  getShadowFill(tooth: EditableTooth): string {
    if (tooth.isMissing) return '#D5D5D5';
    return '#B7B7B9';
  }

  // ======= Smooth spline helper (Catmull-Rom → cubic Bézier) =======

  private pointsToSmoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return '';
    if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;

    const t = 0.35; // tension (0 = sharp, 1 = very smooth)
    let d = `M${pts[0].x},${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) * t / 3;
      const cp1y = p1.y + (p2.y - p0.y) * t / 3;
      const cp2x = p2.x - (p3.x - p1.x) * t / 3;
      const cp2y = p2.y - (p3.y - p1.y) * t / 3;

      d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y}`;
    }
    return d;
  }

  // ======= Gingival margin polyline =======

  private getGMPoints(): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    const order = this.teethOrder;
    for (let ti = 0; ti < order.length; ti++) {
      const tooth = this.getToothByNumber(order[ti]);
      if (!tooth || tooth.isMissing) continue;
      const sites = this.surface === 'buccal' ? tooth.buccalSites : tooth.lingualSites;
      for (let si = 0; si < 3; si++) {
        pts.push({ x: this.getSiteX(ti, si), y: this.gmToY(sites[si]?.gm) });
      }
    }
    return pts;
  }

  private getPDPoints(): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    const order = this.teethOrder;
    for (let ti = 0; ti < order.length; ti++) {
      const tooth = this.getToothByNumber(order[ti]);
      if (!tooth || tooth.isMissing) continue;
      const sites = this.surface === 'buccal' ? tooth.buccalSites : tooth.lingualSites;
      for (let si = 0; si < 3; si++) {
        const site = sites[si];
        pts.push({ x: this.getSiteX(ti, si), y: this.pdToY(site?.pd, site?.gm) });
      }
    }
    return pts;
  }

  getGingivalMarginPath(): string {
    return this.pointsToSmoothPath(this.getGMPoints());
  }

  // ======= Probing depth polyline (blue line) =======

  getProbingDepthPath(): string {
    return this.pointsToSmoothPath(this.getPDPoints());
  }

  // ======= Pocket depth shading (area between GM line and PD) =======

  getPocketPath(): string {
    const gmPts = this.getGMPoints();
    const pdPts = this.getPDPoints();
    if (gmPts.length < 2) return '';

    const forward = this.pointsToSmoothPath(gmPts);
    const reversePts = pdPts.slice().reverse();
    // Build reverse curve starting with L to first reverse point, then smooth
    const revPath = this.pointsToSmoothPath(reversePts);
    // Replace the M command of the reverse path with L to connect the shapes
    const revSegment = revPath.replace(/^M/, 'L');
    return `${forward} ${revSegment} Z`;
  }

  // ======= BOP dots =======

  getBOPDots(): { x: number; y: number; suppuration: boolean }[] {
    const dots: { x: number; y: number; suppuration: boolean }[] = [];
    const order = this.teethOrder;

    for (let ti = 0; ti < order.length; ti++) {
      const tooth = this.getToothByNumber(order[ti]);
      if (!tooth || tooth.isMissing) continue;

      const sites = this.surface === 'buccal' ? tooth.buccalSites : tooth.lingualSites;
      for (let si = 0; si < 3; si++) {
        const site = sites[si];
        if (!site) continue;
        if (site.bleeding || site.suppuration) {
          const x = this.getSiteX(ti, si);
          const y = this.gmToY(site.gm) + (this.jaw === 'upper' ? -5 : 5);
          dots.push({ x, y, suppuration: site.suppuration });
        }
      }
    }
    return dots;
  }

  // ======= Furcation markers =======

  getFurcationMarkers(): { x: number; y: number; grade: number }[] {
    const markers: { x: number; y: number; grade: number }[] = [];
    const order = this.teethOrder;

    for (let ti = 0; ti < order.length; ti++) {
      const tooth = this.getToothByNumber(order[ti]);
      if (!tooth || tooth.isMissing) continue;
      if (!tooth.furcation || tooth.furcation <= 0) continue;

      const type = getToothAnatomyType(tooth.toothNumber);
      if (type !== 'first-molar' && type !== 'second-molar' && type !== 'third-molar') continue;

      const x = this.getToothCenterX(ti);
      const y = this.jaw === 'upper'
        ? this.toothBottomY - TOOTH_RENDER_HEIGHT * 0.15
        : this.toothTopY + TOOTH_RENDER_HEIGHT * 0.15;
      markers.push({ x, y, grade: tooth.furcation });
    }
    return markers;
  }

  getFurcationSymbol(grade: number): string {
    if (grade === 1) return '▲';
    if (grade === 2) return '◆';
    if (grade === 3) return '■';
    return '';
  }

  getFurcationColor(grade: number): string {
    if (grade === 1) return '#43A047';
    if (grade === 2) return '#FB8C00';
    if (grade === 3) return '#E53935';
    return '#757575';
  }

  // ======= Mobility labels =======

  getMobilityLabels(): { x: number; y: number; value: number }[] {
    const labels: { x: number; y: number; value: number }[] = [];
    const order = this.teethOrder;

    for (let ti = 0; ti < order.length; ti++) {
      const tooth = this.getToothByNumber(order[ti]);
      if (!tooth || tooth.isMissing) continue;
      if (tooth.mobility == null || tooth.mobility <= 0) continue;

      const x = this.getToothCenterX(ti);
      const y = this.jaw === 'upper'
        ? this.toothTopY - 4
        : this.toothBottomY + 12;
      labels.push({ x, y, value: tooth.mobility });
    }
    return labels;
  }

  getMobilityColor(value: number): string {
    if (value === 1) return '#43A047';
    if (value === 2) return '#FB8C00';
    return '#E53935';
  }

  // ======= Y-coordinate helpers =======

  /**
   * Convert gingival margin (mm) to SVG Y coordinate.
   * GM > 0 = hyperplasia (above CEJ), GM < 0 = recession (below CEJ).
   * Upper jaw: more negative GM → higher Y (further from tooth).
   * Lower jaw: more negative GM → lower Y (further from tooth).
   */
  private gmToY(gm: number | null): number {
    const mm = gm ?? 0;
    const pxPerMm = 2.5;

    if (this.jaw === 'upper') {
      return this.gingivalBaselineY + mm * pxPerMm; // recession = negative = goes up
    }
    return this.gingivalBaselineY - mm * pxPerMm; // recession = negative = goes down
  }

  /**
   * Convert PD relative to GM to SVG Y coordinate.
   * PD goes deeper into the pocket (away from the gingival margin toward root).
   */
  private pdToY(pd: number | null, gm: number | null): number {
    const gmY = this.gmToY(gm);
    const depth = pd ?? 0;
    const pxPerMm = 2.5;

    if (this.jaw === 'upper') {
      return gmY - depth * pxPerMm; // PD goes upward (toward root) in upper jaw
    }
    return gmY + depth * pxPerMm; // PD goes downward (toward root) in lower jaw
  }

  // ======= Tooth number labels =======

  getToothNumberY(): number {
    if (this.jaw === 'upper') {
      return this.toothBottomY + MARGIN_AREA_HEIGHT - 8;
    }
    return this.toothTopY - MARGIN_AREA_HEIGHT + 14;
  }

  // ======= Interaction =======

  onToothClick(tn: string): void {
    this.toothSelected.emit(tn);
  }

  isSelected(tn: string): boolean {
    return this.selectedTooth() === tn;
  }

  // ======= Midline =======

  get midlineX(): number {
    return CHART_PADDING_LEFT + 8 * TOOTH_COL_WIDTH;
  }
}
