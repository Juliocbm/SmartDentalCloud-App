import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Point, CalibrationData } from '../models/cephalometry.models';
import { distance } from '../utils/ceph-math.util';

@Injectable({ providedIn: 'root' })
export class CephalometryCalibrationService {

  private calibrationSubject = new BehaviorSubject<CalibrationData>({
    point1: null,
    point2: null,
    knownMm: 20,
    mmPerPx: null,
  });

  calibration$: Observable<CalibrationData> = this.calibrationSubject.asObservable();

  get calibration(): CalibrationData {
    return this.calibrationSubject.value;
  }

  get mmPerPx(): number | null {
    return this.calibrationSubject.value.mmPerPx;
  }

  get isCalibrated(): boolean {
    return this.calibrationSubject.value.mmPerPx != null;
  }

  get scaleLabel(): string {
    const cal = this.calibration;
    if (!cal.mmPerPx) return 'Sin calibrar';
    return `Escala: ${(1 / cal.mmPerPx).toFixed(2)} px/mm · ${cal.mmPerPx.toFixed(4)} mm/px`;
  }

  /** Set the known real-world distance in mm for the calibration reference. */
  setKnownMm(mm: number): void {
    const cal = this.calibration;
    this.calibrationSubject.next({ ...cal, knownMm: mm });
    this.tryCalibrate();
  }

  /** Add a calibration click point. After 2 points + knownMm, calibration is computed. */
  addPoint(pt: Point): boolean {
    const cal = this.calibration;
    if (!cal.point1) {
      this.calibrationSubject.next({ ...cal, point1: pt, point2: null, mmPerPx: null });
      return false;
    }
    this.calibrationSubject.next({ ...cal, point2: pt });
    return this.tryCalibrate();
  }

  /** Attempt to compute mm/px from the two calibration points. */
  private tryCalibrate(): boolean {
    const cal = this.calibrationSubject.value;
    if (!cal.point1 || !cal.point2 || cal.knownMm <= 0) return false;
    const px = distance(cal.point1, cal.point2);
    if (px <= 0) return false;
    const mmPerPx = cal.knownMm / px;
    this.calibrationSubject.next({ ...cal, mmPerPx });
    return true;
  }

  /** Convert a pixel distance to millimeters. Returns NaN if not calibrated. */
  pxToMm(px: number): number {
    const factor = this.calibration.mmPerPx;
    return factor ? px * factor : NaN;
  }

  /** Reset calibration state. */
  reset(): void {
    this.calibrationSubject.next({
      point1: null,
      point2: null,
      knownMm: this.calibration.knownMm,
      mmPerPx: null,
    });
  }
}
