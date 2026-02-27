import { Injectable } from '@angular/core';
import {
  LandmarkMap,
  LandmarkKey,
  Point,
  SteinerResults,
  BjorkResults,
  SoftTissueResults,
  ExtendedResults,
  FullAnalysisResults,
  MeasureResult,
  NormRange,
  Interpretation,
  AllNorms,
  PatientData,
} from '../models/cephalometry.models';
import { DEFAULT_NORMS, CLINICAL_TOLERANCES } from '../constants/norms.const';
import {
  angleBetween,
  angleBetweenLines,
  acuteAngleBetweenLines,
  pointLineDistanceSigned,
  projectPointOntoLine,
  distance,
  zScore,
  toFixedOrDash,
} from '../utils/ceph-math.util';
import { CephalometryInterpretationService } from './cephalometry-interpretation.service';

@Injectable({ providedIn: 'root' })
export class CephalometryAnalysisService {
  private norms: AllNorms = DEFAULT_NORMS;

  constructor(private interpretation: CephalometryInterpretationService) {}

  /** Override default norms (e.g. for different populations or age groups). */
  setNorms(norms: Partial<AllNorms>): void {
    this.norms = {
      steiner: { ...this.norms.steiner, ...norms.steiner },
      bjork: { ...this.norms.bjork, ...norms.bjork },
      soft: { ...this.norms.soft, ...norms.soft },
      extended: { ...this.norms.extended, ...norms.extended },
    };
  }

  getNorms(): AllNorms {
    return this.norms;
  }

  // ---------------------------------------------------------------------------
  // Helper: check if a landmark exists
  // ---------------------------------------------------------------------------
  private has(points: LandmarkMap, key: LandmarkKey): boolean {
    return Boolean(points[key]);
  }

  /** Convert px distance to mm using calibration factor. Returns NaN if uncalibrated. */
  private mm(px: number, mmPerPx: number | null): number {
    return mmPerPx ? px * mmPerPx : NaN;
  }

  // ---------------------------------------------------------------------------
  // Steiner Analysis
  // ---------------------------------------------------------------------------
  computeSteiner(points: LandmarkMap, mmPerPx: number | null): SteinerResults {
    const h = (k: LandmarkKey) => this.has(points, k);
    const p = points;

    const SNA = h('S') && h('N') && h('A')
      ? angleBetween(p.S!, p.N!, p.A!) : NaN;
    const SNB = h('S') && h('N') && h('B')
      ? angleBetween(p.S!, p.N!, p.B!) : NaN;
    const ANB = (!isNaN(SNA) && !isNaN(SNB)) ? SNA - SNB : NaN;
    const SN_GoGn = h('S') && h('N') && h('Go') && h('Gn')
      ? angleBetweenLines(p.S!, p.N!, p.Go!, p.Gn!) : NaN;

    const U1_axis: [Point, Point] | null =
      h('U1T') && h('U1A') ? [p.U1T!, p.U1A!] : null;
    const L1_axis: [Point, Point] | null =
      h('L1T') && h('L1A') ? [p.L1T!, p.L1A!] : null;

    const U1_NA_deg = U1_axis && h('N') && h('A')
      ? acuteAngleBetweenLines(U1_axis[0], U1_axis[1], p.N!, p.A!) : NaN;
    const U1_NA_mm = h('U1T') && h('N') && h('A')
      ? Math.abs(this.mm(pointLineDistanceSigned(p.U1T!, p.N!, p.A!), mmPerPx)) : NaN;
    const L1_NB_deg = L1_axis && h('N') && h('B')
      ? acuteAngleBetweenLines(L1_axis[0], L1_axis[1], p.N!, p.B!) : NaN;
    const L1_NB_mm = h('L1T') && h('N') && h('B')
      ? Math.abs(this.mm(pointLineDistanceSigned(p.L1T!, p.N!, p.B!), mmPerPx)) : NaN;
    const Interincisal = U1_axis && L1_axis
      ? angleBetweenLines(U1_axis[0], U1_axis[1], L1_axis[0], L1_axis[1]) : NaN;
    const Pg_NB_mm = h('Pg') && h('N') && h('B')
      ? this.mm(pointLineDistanceSigned(p.Pg!, p.N!, p.B!), mmPerPx) : NaN;

    return { SNA, SNB, ANB, SN_GoGn, U1_NA_deg, U1_NA_mm, L1_NB_deg, L1_NB_mm, Interincisal, Pg_NB_mm };
  }

  // ---------------------------------------------------------------------------
  // Björk–Jarabak Analysis
  // ---------------------------------------------------------------------------
  computeBjork(points: LandmarkMap): BjorkResults {
    const h = (k: LandmarkKey) => this.has(points, k);
    const p = points;

    const Saddle_NSAr = h('N') && h('S') && h('Ar')
      ? angleBetween(p.N!, p.S!, p.Ar!) : NaN;
    const Articular_SArGo = h('S') && h('Ar') && h('Go')
      ? angleBetween(p.S!, p.Ar!, p.Go!) : NaN;
    const Gonial_ArGoMe = h('Ar') && h('Go') && h('Me')
      ? angleBetween(p.Ar!, p.Go!, p.Me!) : NaN;
    const Sum_Bjork = (!isNaN(Saddle_NSAr) && !isNaN(Articular_SArGo) && !isNaN(Gonial_ArGoMe))
      ? Saddle_NSAr + Articular_SArGo + Gonial_ArGoMe : NaN;
    const Jarabak_Ratio = h('S') && h('Go') && h('N') && h('Me')
      ? (distance(p.S!, p.Go!) / distance(p.N!, p.Me!)) * 100 : NaN;

    return { Saddle_NSAr, Articular_SArGo, Gonial_ArGoMe, Sum_Bjork, Jarabak_Ratio };
  }

  // ---------------------------------------------------------------------------
  // Soft Tissue (E-line / Ricketts)
  // ---------------------------------------------------------------------------
  computeSoftTissue(points: LandmarkMap, mmPerPx: number | null): SoftTissueResults {
    const h = (k: LandmarkKey) => this.has(points, k);
    const p = points;

    const ELine_Li_mm = h('Li') && h('Prn') && h('PgS')
      ? this.mm(pointLineDistanceSigned(p.Li!, p.Prn!, p.PgS!), mmPerPx) : NaN;

    return { ELine_Li_mm };
  }

  // ---------------------------------------------------------------------------
  // Extended Analysis (IMPA, Wits, Ocl-SN, Facial Angle, U1-SN)
  // ---------------------------------------------------------------------------
  computeExtended(points: LandmarkMap, mmPerPx: number | null): ExtendedResults {
    const h = (k: LandmarkKey) => this.has(points, k);
    const p = points;

    const IMPA = h('L1T') && h('L1A') && h('Go') && h('Gn')
      ? angleBetweenLines(p.L1T!, p.L1A!, p.Go!, p.Gn!) : NaN;

    // Wits appraisal
    let Wits = NaN;
    if (h('A') && h('B') && h('Oc1') && h('Oc2')) {
      const AO = projectPointOntoLine(p.A!, p.Oc1!, p.Oc2!);
      const BO = projectPointOntoLine(p.B!, p.Oc1!, p.Oc2!);
      const vx = p.Oc2!.x - p.Oc1!.x;
      const vy = p.Oc2!.y - p.Oc1!.y;
      const vlen = Math.hypot(vx, vy);
      if (vlen > 0) {
        const proj = ((BO.x - AO.x) * vx + (BO.y - AO.y) * vy) / vlen;
        const sign = proj >= 0 ? 1 : -1;
        const distPx = Math.abs(proj);
        const distMm = mmPerPx ? distPx * mmPerPx : distPx;
        Wits = sign * distMm;
      }
    }

    // Occlusal plane – SN
    let Ocl_SN = NaN;
    const hasOcclusal = h('Oc1') && h('Oc2');
    const P1 = hasOcclusal ? p.Oc1! : (h('Po') ? p.Po! : null);
    const P2 = hasOcclusal ? p.Oc2! : (h('Or') ? p.Or! : null);
    if (P1 && P2 && h('S') && h('N')) {
      Ocl_SN = angleBetweenLines(P1, P2, p.S!, p.N!);
    }

    // Facial Angle (Downs/Ricketts) — supplementary angle
    const Facial_Angle = h('Ba') && h('N') && h('Pt') && h('Gn')
      ? 180 - angleBetweenLines(p.Ba!, p.N!, p.Pt!, p.Gn!) : NaN;

    // U1–SN
    const U1_SN = h('U1T') && h('U1A') && h('S') && h('N')
      ? angleBetweenLines(p.U1T!, p.U1A!, p.S!, p.N!) : NaN;

    return { IMPA, Wits, Ocl_SN, Facial_Angle, U1_SN };
  }

  // ---------------------------------------------------------------------------
  // Tolerance-based interpretation
  // ---------------------------------------------------------------------------
  interpretValue(value: number, mean: number, units: string, enabled: boolean = true): Interpretation {
    if (!enabled || Number.isNaN(value)) return '—';
    const unitKey = units.includes('°') ? '°' : units.includes('mm') ? 'mm' : units.includes('%') ? '%' : null;
    if (!unitKey) return '—';
    const tol = CLINICAL_TOLERANCES[unitKey];
    if (tol == null) return '—';
    const d = value - mean;
    if (Math.abs(d) <= tol) return 'normal';
    return d > 0 ? 'mayor' : 'menor';
  }

  // ---------------------------------------------------------------------------
  // Build full measures table
  // ---------------------------------------------------------------------------
  buildMeasures(
    steiner: SteinerResults,
    bjork: BjorkResults,
    soft: SoftTissueResults,
    extended: ExtendedResults,
    mmPerPx: number | null,
    config: { steiner: boolean; bjork: boolean; extended: boolean }
  ): MeasureResult[] {
    const n = this.norms;
    const calibrated = mmPerPx != null;

    const row = (
      key: string, label: string, value: number, units: string,
      norm: NormRange, zEnabled: boolean = true
    ): MeasureResult => ({
      key, label, value, units, norm,
      zScore: zEnabled ? zScore(value, norm.mean, norm.sd) : NaN,
      interpretation: this.interpretValue(value, norm.mean, units, zEnabled),
    });

    const measures: MeasureResult[] = [];

    if (config.steiner) {
      measures.push(
        row('SNA', 'SNA', steiner.SNA, '°', n.steiner.SNA),
        row('SNB', 'SNB', steiner.SNB, '°', n.steiner.SNB),
        row('ANB', 'ANB', steiner.ANB, '°', n.steiner.ANB),
        row('SN_GoGn', 'SN–GoGn', steiner.SN_GoGn, '°', n.steiner.SN_GoGn),
        row('U1_NA_deg', 'U1–NA (°)', steiner.U1_NA_deg, '°', n.steiner.U1_NA_deg),
        row('U1_NA_mm', 'U1–NA (mm)', steiner.U1_NA_mm, calibrated ? 'mm' : 'px', n.steiner.U1_NA_mm, calibrated),
        row('L1_NB_deg', 'L1–NB (°)', steiner.L1_NB_deg, '°', n.steiner.L1_NB_deg),
        row('L1_NB_mm', 'L1–NB (mm)', steiner.L1_NB_mm, calibrated ? 'mm' : 'px', n.steiner.L1_NB_mm, calibrated),
        row('Interincisal', 'Interincisal', steiner.Interincisal, '°', n.steiner.Interincisal),
        row('Pg_NB_mm', 'Pg–NB (±)', steiner.Pg_NB_mm, calibrated ? 'mm' : 'px', n.steiner.Pg_NB_mm, calibrated),
      );
    }

    if (config.bjork) {
      measures.push(
        row('Saddle_NSAr', 'Silla (N–S–Ar)', bjork.Saddle_NSAr, '°', n.bjork.Saddle_NSAr),
        row('Articular_SArGo', 'Articular (S–Ar–Go)', bjork.Articular_SArGo, '°', n.bjork.Articular_SArGo),
        row('Gonial_ArGoMe', 'Gonial (Ar–Go–Me)', bjork.Gonial_ArGoMe, '°', n.bjork.Gonial_ArGoMe),
        row('Sum_Bjork', 'Suma Björk', bjork.Sum_Bjork, '°', n.bjork.Sum_Bjork),
        row('Jarabak_Ratio', 'Jarabak % (S–Go/N–Me)', bjork.Jarabak_Ratio, '%', n.bjork.Jarabak_Ratio),
      );
    }

    if (config.extended) {
      measures.push(
        row('IMPA', 'IMPA (°)', extended.IMPA, '°', n.extended.IMPA),
        row('Wits', 'Wits (mm)', extended.Wits, 'mm', n.extended.Wits),
        row('Ocl_SN', 'Plano Oclusal–SN (°)', extended.Ocl_SN, '°', n.extended.Ocl_SN),
        row('Facial_Angle', 'Eje Facial (°)', extended.Facial_Angle, '°', n.extended.Facial_Angle),
        row('U1_SN', 'U1–SN (°)', extended.U1_SN, '°', n.extended.U1_SN),
      );
    }

    // Soft tissue (always included)
    measures.push(
      row('ELine_Li_mm', 'Labio inf–E-line (±)', soft.ELine_Li_mm, calibrated ? 'mm' : 'px', n.soft.ELine_Li_mm, calibrated),
    );

    return measures;
  }

  // ---------------------------------------------------------------------------
  // Full analysis pipeline
  // ---------------------------------------------------------------------------
  analyze(
    points: LandmarkMap,
    mmPerPx: number | null,
    patient: PatientData,
    config: { steiner: boolean; bjork: boolean; extended: boolean }
  ): FullAnalysisResults {
    const steiner = this.computeSteiner(points, mmPerPx);
    const bjork = this.computeBjork(points);
    const soft = this.computeSoftTissue(points, mmPerPx);
    const extended = this.computeExtended(points, mmPerPx);

    const measures = this.buildMeasures(steiner, bjork, soft, extended, mmPerPx, config);

    const clinicalSummary = this.interpretation.generateSummary(
      steiner, bjork, soft, extended, mmPerPx, patient, this.norms
    );

    return { steiner, bjork, soft, extended, measures, clinicalSummary };
  }
}
