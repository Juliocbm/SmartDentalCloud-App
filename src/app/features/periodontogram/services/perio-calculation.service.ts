import { Injectable } from '@angular/core';
import type { PeriodontogramSiteMeasurement, PeriodontogramTooth } from '../models/periodontogram.models';

/**
 * Servicio de cálculos frontend para periodontograma.
 * Replica lógica del backend PeriodontalAnalysisService para preview en tiempo real.
 */
@Injectable({ providedIn: 'root' })
export class PerioCalculationService {

  /**
   * Calcula CAL: PD + |GM| si recesión, PD - GM si hiperplasia
   */
  calculateCAL(probingDepth: number | null, gingivalMargin: number | null): number | null {
    if (probingDepth == null) return null;
    if (gingivalMargin == null) return probingDepth;

    if (gingivalMargin > 0) {
      return Math.max(0, probingDepth - gingivalMargin);
    }
    return probingDepth + Math.abs(gingivalMargin);
  }

  /**
   * Calcula % BOP (Bleeding on Probing)
   */
  calculateBOP(sites: PeriodontogramSiteMeasurement[]): number | null {
    if (!sites.length) return null;
    const bleedingCount = sites.filter(s => s.bleeding).length;
    return Math.round((bleedingCount / sites.length) * 10000) / 100;
  }

  /**
   * Calcula promedio de profundidad de sondaje
   */
  calculateAveragePD(sites: PeriodontogramSiteMeasurement[]): number | null {
    const values = sites
      .filter(s => s.probingDepth != null)
      .map(s => s.probingDepth!);
    if (!values.length) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }

  /**
   * Calcula promedio de CAL
   */
  calculateAverageCAL(sites: PeriodontogramSiteMeasurement[]): number | null {
    const values = sites
      .filter(s => s.clinicalAttachmentLevel != null)
      .map(s => s.clinicalAttachmentLevel!);
    if (!values.length) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }

  /**
   * Color de profundidad de sondaje según severidad
   */
  getPDColor(pd: number | null): string {
    if (pd == null) return 'var(--color-text-muted)';
    if (pd <= 3) return 'var(--color-success)';
    if (pd <= 5) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  /**
   * Color de CAL según severidad
   */
  getCALColor(cal: number | null): string {
    if (cal == null) return 'var(--color-text-muted)';
    if (cal <= 2) return 'var(--color-success)';
    if (cal <= 4) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  /**
   * Resumen rápido de estadísticas de un conjunto de teeth
   */
  calculateQuickStats(teeth: PeriodontogramTooth[]): {
    avgPD: number | null;
    avgCAL: number | null;
    bop: number | null;
    sitesOver4mm: number;
    sitesOver6mm: number;
    missingTeeth: number;
  } {
    const allSites = teeth
      .filter(t => !t.isMissing)
      .flatMap(t => t.siteMeasurements);

    const pdValues = allSites
      .filter(s => s.probingDepth != null)
      .map(s => s.probingDepth!);

    return {
      avgPD: this.calculateAveragePD(allSites),
      avgCAL: this.calculateAverageCAL(allSites),
      bop: this.calculateBOP(allSites),
      sitesOver4mm: pdValues.filter(pd => pd > 4).length,
      sitesOver6mm: pdValues.filter(pd => pd > 6).length,
      missingTeeth: teeth.filter(t => t.isMissing).length
    };
  }
}
