import { Injectable } from '@angular/core';
import {
  MeasureResult,
  PatientData,
  LandmarkMap,
  LandmarkKey,
  Point,
} from '../models/cephalometry.models';
import { LANDMARKS } from '../constants/landmarks.const';
import {
  toFixedOrDash,
  arcPath,
  distance,
} from '../utils/ceph-math.util';

@Injectable({ providedIn: 'root' })
export class CephalometryExportService {

  // ---------------------------------------------------------------------------
  // CSV
  // ---------------------------------------------------------------------------
  exportCSV(measures: MeasureResult[], patient: PatientData): void {
    const header = ['Medida', 'Valor', 'Norma', 'Unidades', 'z-score', 'Interpretación'];
    const rows = measures.map(m => [
      m.label,
      toFixedOrDash(m.value),
      toFixedOrDash(m.norm.mean),
      m.units,
      toFixedOrDash(m.zScore),
      m.interpretation,
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\r\n');
    this.triggerDownload(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `cefalo_${patient.name || 'paciente'}.csv`
    );
  }

  // ---------------------------------------------------------------------------
  // JSON (points + calibration — for reimport)
  // ---------------------------------------------------------------------------
  exportJSON(points: LandmarkMap, mmPerPx: number | null): void {
    const blob = new Blob(
      [JSON.stringify({ points, mmPerPx }, null, 2)],
      { type: 'application/json' }
    );
    this.triggerDownload(blob, 'cefalo_trazado.json');
  }

  importJSON(file: File): Promise<{ points: LandmarkMap; mmPerPx: number | null }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result));
          resolve({
            points: data.points || {},
            mmPerPx: typeof data.mmPerPx === 'number' ? data.mmPerPx : null,
          });
        } catch {
          reject(new Error('JSON inválido'));
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  }

  // ---------------------------------------------------------------------------
  // PNG — render traced radiograph onto a canvas
  // ---------------------------------------------------------------------------
  async exportTracePNG(
    imgEl: HTMLImageElement,
    points: LandmarkMap,
    fixedScale: { sx: number; sy: number } | null,
  ): Promise<void> {
    const canvas = await this.renderTraceCanvas(imgEl, points, fixedScale);
    if (!canvas) return;
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png'));
    if (blob) {
      this.triggerDownload(blob, 'cefalometria.png');
    }
  }

  /** Build the trace canvas (radiograph + lines + points). Can also be used for PDF. */
  async renderTraceCanvas(
    imgEl: HTMLImageElement,
    points: LandmarkMap,
    fixedScale: { sx: number; sy: number } | null,
  ): Promise<HTMLCanvasElement | null> {
    if (!imgEl || !imgEl.complete) return null;

    const natW = imgEl.naturalWidth;
    const natH = imgEl.naturalHeight;
    const renW = imgEl.width || imgEl.getBoundingClientRect().width;
    const renH = imgEl.height || imgEl.getBoundingClientRect().height;
    if (!natW || !natH || !renW || !renH) return null;

    const sx = fixedScale?.sx ?? (natW / renW);
    const sy = fixedScale?.sy ?? (natH / renH);
    const scaleFactor = Math.min(Math.max(natW / 1200, 1.2), 3);

    const canvas = document.createElement('canvas');
    canvas.width = natW;
    canvas.height = natH;
    const ctx = canvas.getContext('2d')!;

    // Background + image
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, natW, natH);
    ctx.drawImage(imgEl, 0, 0, natW, natH);

    // Scale points to natural resolution
    const P: Partial<Record<LandmarkKey, Point>> = {};
    LANDMARKS.forEach(({ key }) => {
      const pt = points[key];
      if (pt) P[key] = { x: pt.x * sx, y: pt.y * sy };
    });

    // Draw line helper
    const line = (a?: Point, b?: Point, color = '#38bdf8', width = 3, dash = false) => {
      if (!a || !b) return;
      ctx.save();
      if (dash) ctx.setLineDash([6, 4]);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    };

    // Structural lines (colorized)
    line(P.S, P.N, '#00b5ff', 5);
    line(P.N, P.A, '#00ff85', 5);
    line(P.N, P.B, '#ff7300', 5);
    line(P.Po, P.Or, '#cc33ff', 5, true);
    line(P.Go, P.Me, '#ff3d9a', 5, true);
    line(P.Go, P.Gn, '#00ffe1', 5);
    line(P.Prn, P.PgS, '#0077ff', 5, true);
    line(P.Oc1, P.Oc2, '#ffd500', 5, true);

    // Dental axes
    line(P.U1T, P.U1A, '#ffcc00', 4.5);
    line(P.L1T, P.L1A, '#00fff7', 4.5);
    line(P.N, P.B, '#ff006e', 4);
    line(P.N, P.A, '#ffb703', 4, true);

    // Facial axis
    line(P.Ba, P.N, '#3b82f6', 5, true);
    line(P.Pt, P.Gn, '#22d3ee', 5);

    // Arcs
    const drawArc = (v: Point, p1: Point, p2: Point, color: string, width = 5) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash([5, 4]);
      const path = new Path2D(arcPath(v, p1, p2, 40));
      ctx.stroke(path);
      ctx.restore();
    };

    if (P.N && P.S && P.Ar) drawArc(P.S, P.N, P.Ar, '#00ff99', 5);
    if (P.S && P.Ar && P.Go) drawArc(P.Ar, P.S, P.Go, '#ff4bfb', 5);
    if (P.Ar && P.Go && P.Me) drawArc(P.Go, P.Ar, P.Me, '#ff1744', 5);

    // Points
    Object.values(P).forEach(pt => {
      if (!pt) return;
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    return canvas;
  }

  // ---------------------------------------------------------------------------
  // Generic download trigger
  // ---------------------------------------------------------------------------
  triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
