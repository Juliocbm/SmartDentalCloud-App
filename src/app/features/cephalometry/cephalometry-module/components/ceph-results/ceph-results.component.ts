import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/components/modal/modal';
import { MeasureResult, NormRange } from '../../models/cephalometry.models';
import { toFixedOrDash, zScore } from '../../utils/ceph-math.util';
import { CLINICAL_TOLERANCES } from '../../constants/norms.const';

export interface ResultTab {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'ceph-results',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './ceph-results.component.html',
  styleUrls: ['./ceph-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CephResultsComponent {
  @Input() measures: MeasureResult[] = [];
  @Input() clinicalSummary = '';
  @Input() enableSteiner = true;
  @Input() enableBjork = true;
  @Input() enableExtended = true;

  @Output() exportCSV = new EventEmitter<void>();
  @Output() exportPNG = new EventEmitter<void>();
  @Output() exportPDF = new EventEmitter<void>();
  @Output() exportTablePNG = new EventEmitter<void>();
  @Output() exportJSON = new EventEmitter<void>();

  activeTab = signal<string>('steiner');
  showSummaryModal = signal(false);

  get availableTabs(): ResultTab[] {
    const tabs: ResultTab[] = [];
    if (this.enableSteiner) tabs.push({ key: 'steiner', label: 'Steiner', icon: 'fa-chart-line' });
    if (this.enableBjork) tabs.push({ key: 'bjork', label: 'Björk', icon: 'fa-compass-drafting' });
    if (this.enableExtended) tabs.push({ key: 'extended', label: 'Extendido', icon: 'fa-expand' });
    tabs.push({ key: 'soft', label: 'T. Blandos', icon: 'fa-face-smile' });
    return tabs;
  }

  get activeMeasures(): MeasureResult[] {
    switch (this.activeTab()) {
      case 'steiner': return this.steinerMeasures;
      case 'bjork': return this.bjorkMeasures;
      case 'extended': return this.extendedMeasures;
      case 'soft': return this.softMeasures;
      default: return [];
    }
  }

  selectTab(key: string): void {
    this.activeTab.set(key);
  }

  fmt(n: number | undefined | null, decimals = 2): string {
    return toFixedOrDash(n, decimals);
  }

  /** Color class based on z-score / tolerance. */
  toleranceClass(m: MeasureResult): string {
    if (Number.isNaN(m.value) || Number.isNaN(m.zScore)) return 'tol-na';
    const unitKey = m.units.includes('°') ? '°' : m.units.includes('mm') ? 'mm' : m.units.includes('%') ? '%' : null;
    if (!unitKey) return 'tol-na';
    const tol = CLINICAL_TOLERANCES[unitKey];
    if (tol == null) return 'tol-na';
    const delta = Math.abs(m.value - m.norm.mean);
    if (delta <= tol) return 'tol-ok';
    if (delta <= tol * 2) return 'tol-warn';
    return 'tol-danger';
  }

  formatZScore(z: number): string {
    if (Number.isNaN(z)) return '—';
    return `${z >= 0 ? '+' : ''}${z.toFixed(2)}`;
  }

  /** Group label rows for visual separation. */
  get steinerMeasures(): MeasureResult[] {
    return this.measures.filter(m =>
      ['SNA', 'SNB', 'ANB', 'SN_GoGn', 'U1_NA_deg', 'U1_NA_mm',
       'L1_NB_deg', 'L1_NB_mm', 'Interincisal', 'Pg_NB_mm'].includes(m.key)
    );
  }

  get bjorkMeasures(): MeasureResult[] {
    return this.measures.filter(m =>
      ['Saddle_NSAr', 'Articular_SArGo', 'Gonial_ArGoMe', 'Sum_Bjork', 'Jarabak_Ratio'].includes(m.key)
    );
  }

  get extendedMeasures(): MeasureResult[] {
    return this.measures.filter(m =>
      ['IMPA', 'Wits', 'Ocl_SN', 'Facial_Angle', 'U1_SN'].includes(m.key)
    );
  }

  get softMeasures(): MeasureResult[] {
    return this.measures.filter(m => m.key === 'ELine_Li_mm');
  }

  trackByKey(_: number, m: MeasureResult): string {
    return m.key;
  }
}
