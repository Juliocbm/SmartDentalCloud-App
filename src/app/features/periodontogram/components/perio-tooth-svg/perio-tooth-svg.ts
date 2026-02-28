import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TOOTH_SVG_DATA } from '../../../../shared/models/tooth-svg-data';
import type { ToothPathData } from '../../../../shared/models/tooth-svg-data';
import { getToothJaw, getToothAnatomyType } from '../../../../shared/models/fdi-tooth-layout';
import type { PerioSiteDisplay } from '../../models/periodontogram.models';

@Component({
  selector: 'app-perio-tooth-svg',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perio-tooth-svg.html',
  styleUrl: './perio-tooth-svg.scss'
})
export class PerioToothSvgComponent {
  // Inputs — tooth data
  fdi = input.required<string>();
  isMissing = input<boolean>(false);
  mobility = input<number | null>(null);
  furcation = input<number | null>(null);

  // Inputs — site measurements (3 sites each: mesial, central, distal)
  vestibularSites = input<PerioSiteDisplay[]>([]);
  lingualSites = input<PerioSiteDisplay[]>([]);

  // Reuse SVG data from odontogram
  toothData = computed<ToothPathData | null>(() => {
    return TOOTH_SVG_DATA[this.fdi()] ?? null;
  });

  viewBox = computed(() => this.toothData()?.vb ?? '0 0 40 50');
  tw = computed(() => this.toothData()?.w ?? 40);
  th = computed(() => this.toothData()?.h ?? 50);
  jaw = computed<'upper' | 'lower'>(() => getToothJaw(this.fdi()));

  // Center X
  cx = computed(() => this.tw() / 2);

  // Crown/root Y positions (same logic as tooth-svg)
  crownCY = computed(() => this.jaw() === 'upper' ? this.th() * 0.68 : this.th() * 0.25);
  rootCY = computed(() => this.jaw() === 'upper' ? this.th() * 0.15 : this.th() * 0.85);

  // Shadow fill for tooth silhouette
  shadowFill = computed(() => {
    if (this.isMissing()) return '#D5D5D5';
    return '#B7B7B9';
  });

  // Tooth fill based on max PD severity (not odontogram ToothStatus)
  toothFill = computed(() => {
    if (this.isMissing()) return '#E8E8E8';
    const maxPD = this.getMaxProbingDepth();
    if (maxPD === null) return '#FDFDFD';
    if (maxPD <= 3) return '#E8F5E9';
    if (maxPD <= 5) return '#FFF8E1';
    return '#FFEBEE';
  });

  // Bleeding Y position (near gingival margin area)
  bleedingY = computed(() => {
    return this.jaw() === 'upper'
      ? (this.crownCY() + this.rootCY()) / 2 + this.th() * 0.05
      : (this.crownCY() + this.rootCY()) / 2 - this.th() * 0.05;
  });

  // Suppuration Y position (slightly offset from bleeding)
  suppurationY = computed(() => {
    return this.jaw() === 'upper'
      ? this.bleedingY() + this.th() * 0.06
      : this.bleedingY() - this.th() * 0.06;
  });

  // Furcation Y position (between crown and root junction)
  furcationY = computed(() => {
    return this.jaw() === 'upper'
      ? this.crownCY() - this.th() * 0.02
      : this.crownCY() + this.th() * 0.06;
  });

  // Is this a molar (has furcation area)?
  isMolar = computed(() => {
    const type = getToothAnatomyType(this.fdi());
    return type === 'first-molar' || type === 'second-molar' || type === 'third-molar';
  });

  // Furcation display symbol (▲, ◆, ■ for grades I, II, III)
  furcationSymbol = computed(() => {
    const f = this.furcation();
    if (f === 1) return '▲';
    if (f === 2) return '◆';
    if (f === 3) return '■';
    return '';
  });

  // Get X position for site (Mesial, Central, Distal)
  getSiteX(site: string): number {
    const w = this.tw();
    switch (site) {
      case 'Mesial': return w * 0.2;
      case 'Central': return w * 0.5;
      case 'Distal': return w * 0.8;
      default: return w * 0.5;
    }
  }

  private getMaxProbingDepth(): number | null {
    const allSites = [...this.vestibularSites(), ...this.lingualSites()];
    const pds = allSites
      .filter(s => s.probingDepth != null)
      .map(s => s.probingDepth!);
    return pds.length > 0 ? Math.max(...pds) : null;
  }
}
