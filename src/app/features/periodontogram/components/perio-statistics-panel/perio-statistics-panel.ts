import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EditableTooth,
  RISK_LEVEL_CONFIG
} from '../../models/periodontogram.models';
import { PerioCalculationService } from '../../services/perio-calculation.service';

@Component({
  selector: 'app-perio-statistics-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perio-statistics-panel.html',
  styleUrl: './perio-statistics-panel.scss'
})
export class PerioStatisticsPanelComponent {
  @Input({ required: true }) set teeth(value: EditableTooth[]) {
    this._teeth.set(value);
  }
  @Input() classification: string | null = null;
  @Input() grade: string | null = null;
  @Input() riskLevel: string | null = null;

  private _teeth = signal<EditableTooth[]>([]);
  private calc = new PerioCalculationService();

  RISK_LEVEL_CONFIG = RISK_LEVEL_CONFIG;

  stats = computed(() => {
    const teeth = this._teeth();
    if (!teeth.length) return null;

    const activeSites = teeth
      .filter(t => !t.isMissing)
      .flatMap(t => [...t.buccalSites, ...t.lingualSites]);

    const pdValues = activeSites.filter(s => s.pd != null).map(s => s.pd!);
    const calValues = activeSites.filter(s => s.cal != null).map(s => s.cal!);
    const bleedingCount = activeSites.filter(s => s.bleeding).length;
    const suppurationCount = activeSites.filter(s => s.suppuration).length;
    const totalSites = activeSites.length;
    const missingTeeth = teeth.filter(t => t.isMissing).length;

    const avgPD = pdValues.length
      ? (pdValues.reduce((a, b) => a + b, 0) / pdValues.length)
      : null;
    const avgCAL = calValues.length
      ? (calValues.reduce((a, b) => a + b, 0) / calValues.length)
      : null;
    const bop = totalSites > 0
      ? (bleedingCount / totalSites) * 100
      : null;

    return {
      avgPD,
      avgCAL,
      bop,
      totalMeasured: pdValues.length,
      totalSites,
      sitesOver4: pdValues.filter(pd => pd > 4).length,
      sitesOver6: pdValues.filter(pd => pd > 6).length,
      bleedingCount,
      suppurationCount,
      missingTeeth,
      teethWithData: teeth.filter(t => !t.isMissing).length,
      // PD distribution
      pd0to3: pdValues.filter(pd => pd <= 3).length,
      pd4to5: pdValues.filter(pd => pd > 3 && pd <= 5).length,
      pd6plus: pdValues.filter(pd => pd > 5).length
    };
  });

  getPDColor(avgPD: number | null): string {
    return this.calc.getPDColor(avgPD);
  }

  getCALColor(avgCAL: number | null): string {
    return this.calc.getCALColor(avgCAL);
  }

  getBOPColor(bop: number | null): string {
    if (bop == null) return 'var(--color-text-muted)';
    if (bop <= 10) return 'var(--color-success)';
    if (bop <= 30) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  formatDecimal(value: number | null, decimals = 2): string {
    if (value == null) return '—';
    return value.toFixed(decimals);
  }

  formatPercent(value: number | null): string {
    if (value == null) return '—';
    return value.toFixed(1) + '%';
  }
}
