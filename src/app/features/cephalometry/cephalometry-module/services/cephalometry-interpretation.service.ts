import { Injectable } from '@angular/core';
import {
  SteinerResults,
  BjorkResults,
  SoftTissueResults,
  ExtendedResults,
  AllNorms,
  PatientData,
  Interpretation,
} from '../models/cephalometry.models';
import { CLINICAL_TOLERANCES } from '../constants/norms.const';

@Injectable({ providedIn: 'root' })
export class CephalometryInterpretationService {

  /** Tolerance-based interpretation of a single value. */
  private interp(value: number, mean: number, units: string, enabled: boolean = true): Interpretation {
    if (!enabled || Number.isNaN(value)) return '—';
    const unitKey = units.includes('°') ? '°' : units.includes('mm') ? 'mm' : units.includes('%') ? '%' : null;
    if (!unitKey) return '—';
    const tol = CLINICAL_TOLERANCES[unitKey];
    if (tol == null) return '—';
    const d = value - mean;
    if (Math.abs(d) <= tol) return 'normal';
    return d > 0 ? 'mayor' : 'menor';
  }

  /** Map interpretation to a word triple: [mayor, normal, menor]. */
  private word(
    value: number, mean: number, units: string,
    hi: string, mid: string, lo: string
  ): string {
    const i = this.interp(value, mean, units);
    if (i === 'mayor') return hi;
    if (i === 'menor') return lo;
    if (i === 'normal') return mid;
    return 'indeterminado';
  }

  /** Generate Steiner-based narrative. */
  private steinerNarrative(
    s: SteinerResults, n: AllNorms, mmPerPx: number | null, patient: PatientData
  ): string {
    const sexLabel = patient.sex === 'M' ? 'masculino' : patient.sex === 'F' ? 'femenino' : '';

    const snaTxt = this.word(s.SNA, n.steiner.SNA.mean, '°', 'protruido', 'normal', 'retruido');
    const snbTxt = this.word(s.SNB, n.steiner.SNB.mean, '°', 'protruida', 'normal', 'retruida');

    const anbInterp = this.interp(s.ANB, n.steiner.ANB.mean, '°');
    const anbClass = anbInterp === 'mayor' ? 'Clase II'
      : anbInterp === 'menor' ? 'Clase III'
      : anbInterp === 'normal' ? 'Clase I'
      : 'indeterminado';

    const growthTxt = this.word(s.SN_GoGn, n.steiner.SN_GoGn.mean, '°',
      'hiperdivergente', 'normodivergente', 'hipodivergente');

    const u1degTxt = this.word(s.U1_NA_deg, n.steiner.U1_NA_deg.mean, '°',
      'proinclinados', 'normales', 'retroinclinados');
    const calibrated = mmPerPx != null;
    const u1mmTxt = calibrated
      ? this.word(s.U1_NA_mm, n.steiner.U1_NA_mm.mean, 'mm', 'protrusión', 'normal', 'retrusión')
      : 'indeterminado';
    const l1degTxt = this.word(s.L1_NB_deg, n.steiner.L1_NB_deg.mean, '°',
      'proinclinados', 'normales', 'retroinclinados');
    const l1mmTxt = calibrated
      ? this.word(s.L1_NB_mm, n.steiner.L1_NB_mm.mean, 'mm', 'protruidos', 'normales', 'retruídos')
      : 'indeterminado';
    const interTxt = this.word(s.Interincisal, n.steiner.Interincisal.mean, '°',
      'retroinclinación incisiva', 'normal', 'biprotrusión incisiva');

    return `Paciente ${sexLabel ? `(${sexLabel}) ` : ''}de ${patient.age || '—'} años, `
      + `presenta maxilar superior: ${snaTxt}, y la mandíbula: ${snbTxt}. `
      + `Presenta una relación esqueletal de tipo: ${anbClass}. `
      + `El paciente tiene un crecimiento craneofacial de tipo: ${growthTxt}. `
      + `Dentalmente encontramos a los incisivos superiores con una angulación: ${u1degTxt}, `
      + `y una posición: ${u1mmTxt}. Los incisivos inferiores con una angulación: ${l1degTxt}, `
      + `y una posición: ${l1mmTxt}. La relación interincisal: ${interTxt}`;
  }

  /** Generate soft tissue narrative. */
  private softTissueNarrative(soft: SoftTissueResults, n: AllNorms, mmPerPx: number | null): string {
    const calibrated = mmPerPx != null;
    const lipsTxt = calibrated
      ? this.word(soft.ELine_Li_mm, n.soft.ELine_Li_mm.mean, 'mm',
          'protrusión labial', 'normal', 'retrusión labial')
      : 'indeterminado';
    return `y los labios en posición: ${lipsTxt}.`;
  }

  /** Generate extended analysis narrative. */
  private extendedNarrative(ext: ExtendedResults, n: AllNorms): string {
    const parts: string[] = [];

    const impaState = this.interp(ext.IMPA, n.extended.IMPA.mean, '°');
    if (impaState === 'menor')
      parts.push('Los incisivos inferiores están retroinclinados respecto al plano mandibular (IMPA disminuido).');
    else if (impaState === 'mayor')
      parts.push('Los incisivos inferiores presentan proinclinación (IMPA aumentado), sugiriendo compensación dental anterior.');
    else if (impaState === 'normal')
      parts.push('El eje de los incisivos inferiores (IMPA) se encuentra dentro de los valores normales.');

    const witsState = this.interp(ext.Wits, n.extended.Wits.mean, 'mm');
    if (witsState === 'menor')
      parts.push('El valor de Wits negativo indica una tendencia a relación Clase III esquelética.');
    else if (witsState === 'mayor')
      parts.push('El valor de Wits positivo sugiere una tendencia a relación Clase II esquelética.');
    else if (witsState === 'normal')
      parts.push('El valor de Wits se encuentra dentro del rango normal, compatible con una relación esquelética Clase I.');

    const oclsnState = this.interp(ext.Ocl_SN, n.extended.Ocl_SN.mean, '°');
    if (oclsnState === 'menor')
      parts.push('El plano oclusal se encuentra más plano respecto a la base craneal, asociado con patrones hipodivergentes.');
    else if (oclsnState === 'mayor')
      parts.push('El plano oclusal se muestra más inclinado respecto a la base craneal, común en pacientes hiperdivergentes.');
    else if (oclsnState === 'normal')
      parts.push('El plano oclusal presenta una inclinación dentro de los límites normales respecto a la base craneal.');

    const facialState = this.interp(ext.Facial_Angle, n.extended.Facial_Angle.mean, '°');
    if (facialState === 'menor')
      parts.push('El eje facial disminuido refleja un patrón de crecimiento más vertical o tendencia dolicofacial.');
    else if (facialState === 'mayor')
      parts.push('El eje facial aumentado indica un patrón de crecimiento más horizontal o tendencia braquifacial.');
    else if (facialState === 'normal')
      parts.push('El eje facial se mantiene dentro del rango normal de crecimiento craneofacial.');

    const u1snState = this.interp(ext.U1_SN, n.extended.U1_SN.mean, '°');
    if (u1snState === 'menor')
      parts.push('Los incisivos superiores están retroinclinados respecto al plano SN.');
    else if (u1snState === 'mayor')
      parts.push('Los incisivos superiores se encuentran proinclinados respecto al plano SN.');
    else if (u1snState === 'normal')
      parts.push('La inclinación de los incisivos superiores respecto al plano SN es adecuada.');

    return parts.join(' ');
  }

  // ---------------------------------------------------------------------------
  // Public: full clinical summary
  // ---------------------------------------------------------------------------
  generateSummary(
    steiner: SteinerResults,
    bjork: BjorkResults,
    soft: SoftTissueResults,
    extended: ExtendedResults,
    mmPerPx: number | null,
    patient: PatientData,
    norms: AllNorms,
  ): string {
    const steinerText = this.steinerNarrative(steiner, norms, mmPerPx, patient);
    const softText = this.softTissueNarrative(soft, norms, mmPerPx);
    const extText = this.extendedNarrative(extended, norms);
    return `${steinerText} ${softText} ${extText}`;
  }
}
