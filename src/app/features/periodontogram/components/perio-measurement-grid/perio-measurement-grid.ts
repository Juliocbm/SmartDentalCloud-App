import { Component, Input, Output, EventEmitter, signal, computed, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EditableTooth,
  EditableSite,
  UPPER_TEETH_ORDER,
  LOWER_TEETH_ORDER,
  calculateCAL,
  toSiteDisplays
} from '../../models/periodontogram.models';
import { PerioToothChartComponent } from '../perio-tooth-chart/perio-tooth-chart';
import { TOOTH_NAMES } from '../../../../shared/models/fdi-tooth-layout';

/** Row types in the measurement grid */
type GridRow = 'pd' | 'gm' | 'cal' | 'bleeding' | 'suppuration';

/** Identifies a single cell in the grid */
interface CellRef {
  toothIndex: number;
  siteIndex: number;   // 0=Mesial, 1=Central, 2=Distal
  row: GridRow;
  surface: 'buccal' | 'lingual';
  jaw: 'upper' | 'lower';
}

const ROW_LABELS: Record<GridRow, string> = {
  pd: 'PD',
  gm: 'Margen',
  cal: 'NIC',
  bleeding: 'Sangrado',
  suppuration: 'Exudado'
};

const EDITABLE_ROWS: GridRow[] = ['pd', 'gm'];
const ALL_ROWS: GridRow[] = ['pd', 'gm', 'cal', 'bleeding', 'suppuration'];

@Component({
  selector: 'app-perio-measurement-grid',
  standalone: true,
  imports: [CommonModule, PerioToothChartComponent],
  templateUrl: './perio-measurement-grid.html',
  styleUrl: './perio-measurement-grid.scss'
})
export class PerioMeasurementGridComponent {
  @Input({ required: true }) teeth!: EditableTooth[];
  @Input() readonly = false;
  @Input() selectedTooth = signal<string | null>(null);
  @Output() teethChange = new EventEmitter<EditableTooth[]>();
  @Output() dataChanged = new EventEmitter<void>();
  @Output() toothSelected = new EventEmitter<string>();

  private el = inject(ElementRef);

  // Active cell tracking
  activeCell = signal<CellRef | null>(null);

  // Layout constants exposed to template
  UPPER_TEETH = UPPER_TEETH_ORDER;
  LOWER_TEETH = LOWER_TEETH_ORDER;
  TOOTH_NAMES = TOOTH_NAMES;
  ROW_LABELS = ROW_LABELS;
  ALL_ROWS = ALL_ROWS;

  // Computed: upper and lower teeth arrays
  upperTeeth = computed(() => {
    if (!this.teeth) return [];
    return this.teeth.filter(t => UPPER_TEETH_ORDER.includes(t.toothNumber));
  });

  lowerTeeth = computed(() => {
    if (!this.teeth) return [];
    return this.teeth.filter(t => LOWER_TEETH_ORDER.includes(t.toothNumber));
  });

  // Get tooth by number from the flat teeth array
  getToothByNumber(tn: string): EditableTooth | undefined {
    return this.teeth?.find(t => t.toothNumber === tn);
  }

  // Get site display data for SVG component
  getVestibularDisplays(tooth: EditableTooth) {
    return toSiteDisplays(tooth.toothNumber, tooth.buccalSites);
  }

  getLingualDisplays(tooth: EditableTooth) {
    return toSiteDisplays(tooth.toothNumber, tooth.lingualSites);
  }

  // === Cell value accessors ===

  getSiteValue(tooth: EditableTooth, surface: 'buccal' | 'lingual', siteIdx: number, row: GridRow): number | null | boolean {
    const sites = surface === 'buccal' ? tooth.buccalSites : tooth.lingualSites;
    const site = sites[siteIdx];
    if (!site) return null;

    switch (row) {
      case 'pd': return site.pd;
      case 'gm': return site.gm;
      case 'cal': return site.cal;
      case 'bleeding': return site.bleeding;
      case 'suppuration': return site.suppuration;
    }
  }

  getSiteNumericValue(tooth: EditableTooth, surface: 'buccal' | 'lingual', siteIdx: number, row: GridRow): number | null {
    const v = this.getSiteValue(tooth, surface, siteIdx, row);
    return typeof v === 'number' ? v : null;
  }

  getSiteBoolValue(tooth: EditableTooth, surface: 'buccal' | 'lingual', siteIdx: number, row: GridRow): boolean {
    const v = this.getSiteValue(tooth, surface, siteIdx, row);
    return typeof v === 'boolean' ? v : false;
  }

  // === Cell CSS classes ===

  getPDClass(pd: number | null): string {
    if (pd == null) return '';
    if (pd <= 3) return 'pd-normal';
    if (pd <= 5) return 'pd-moderate';
    return 'pd-severe';
  }

  getCALClass(cal: number | null): string {
    if (cal == null) return '';
    if (cal <= 2) return 'cal-normal';
    if (cal <= 4) return 'cal-moderate';
    return 'cal-severe';
  }

  // === Cell editing ===

  isCellActive(toothIdx: number, siteIdx: number, row: GridRow, surface: 'buccal' | 'lingual', jaw: 'upper' | 'lower'): boolean {
    const ac = this.activeCell();
    if (!ac) return false;
    return ac.toothIndex === toothIdx && ac.siteIndex === siteIdx && ac.row === row && ac.surface === surface && ac.jaw === jaw;
  }

  focusCell(toothIdx: number, siteIdx: number, row: GridRow, surface: 'buccal' | 'lingual', jaw: 'upper' | 'lower'): void {
    if (this.readonly) return;
    this.activeCell.set({ toothIndex: toothIdx, siteIndex: siteIdx, row, surface, jaw });
  }

  onNumericInput(event: Event, tooth: EditableTooth, surface: 'buccal' | 'lingual', siteIdx: number, row: 'pd' | 'gm'): void {
    if (this.readonly) return;
    const input = event.target as HTMLInputElement;
    const val = input.value === '' ? null : parseInt(input.value, 10);

    const sites = surface === 'buccal' ? tooth.buccalSites : tooth.lingualSites;
    const site = sites[siteIdx];
    if (!site) return;

    if (row === 'pd') {
      site.pd = val != null ? Math.max(0, Math.min(15, val)) : null;
    } else {
      site.gm = val != null ? Math.max(-10, Math.min(10, val)) : null;
    }

    // Auto-calculate CAL
    site.cal = calculateCAL(site.pd, site.gm);
    this.emitChange();
  }

  toggleBool(tooth: EditableTooth, surface: 'buccal' | 'lingual', siteIdx: number, row: 'bleeding' | 'suppuration'): void {
    if (this.readonly) return;
    const sites = surface === 'buccal' ? tooth.buccalSites : tooth.lingualSites;
    const site = sites[siteIdx];
    if (!site) return;

    site[row] = !site[row];
    this.emitChange();
  }

  toggleMissing(tooth: EditableTooth): void {
    if (this.readonly) return;
    tooth.isMissing = !tooth.isMissing;
    this.emitChange();
  }

  onMobilityChange(event: Event, tooth: EditableTooth): void {
    if (this.readonly) return;
    const val = (event.target as HTMLInputElement).value;
    tooth.mobility = val === '' ? null : Math.max(0, Math.min(3, parseInt(val, 10)));
    this.emitChange();
  }

  onFurcationChange(event: Event, tooth: EditableTooth): void {
    if (this.readonly) return;
    const val = (event.target as HTMLInputElement).value;
    tooth.furcation = val === '' ? null : Math.max(0, Math.min(3, parseInt(val, 10)));
    this.emitChange();
  }

  // === Keyboard Navigation ===

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.readonly) return;
    const ac = this.activeCell();
    if (!ac) return;

    const teethArr = ac.jaw === 'upper' ? UPPER_TEETH_ORDER : LOWER_TEETH_ORDER;

    switch (event.key) {
      case 'Tab': {
        event.preventDefault();
        const next = this.getNextCell(ac, teethArr, event.shiftKey ? -1 : 1);
        if (next) {
          this.activeCell.set(next);
          this.focusInputAt(next);
        }
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        const next = this.getNextCell(ac, teethArr, 1);
        if (next) {
          this.activeCell.set(next);
          this.focusInputAt(next);
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        const next = this.getNextCell(ac, teethArr, -1);
        if (next) {
          this.activeCell.set(next);
          this.focusInputAt(next);
        }
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        const next = this.getNextRow(ac, 1);
        if (next) {
          this.activeCell.set(next);
          this.focusInputAt(next);
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const next = this.getNextRow(ac, -1);
        if (next) {
          this.activeCell.set(next);
          this.focusInputAt(next);
        }
        break;
      }
      case 'b':
      case 'B': {
        if (ac.row === 'pd' || ac.row === 'gm' || ac.row === 'cal') {
          // Only toggle if focused on a data row, not already in a text input
          const activeEl = document.activeElement as HTMLElement;
          if (activeEl?.tagName === 'INPUT' && (activeEl as HTMLInputElement).type === 'number') {
            return; // Let normal typing happen
          }
        }
        event.preventDefault();
        this.toggleBoolAtCell(ac, 'bleeding');
        break;
      }
      case 'e':
      case 'E': {
        const activeEl = document.activeElement as HTMLElement;
        if (activeEl?.tagName === 'INPUT' && (activeEl as HTMLInputElement).type === 'number') {
          return;
        }
        event.preventDefault();
        this.toggleBoolAtCell(ac, 'suppuration');
        break;
      }
      case 'm':
      case 'M': {
        const activeEl = document.activeElement as HTMLElement;
        if (activeEl?.tagName === 'INPUT' && (activeEl as HTMLInputElement).type === 'number') {
          return;
        }
        event.preventDefault();
        const tooth = this.getToothAtCell(ac);
        if (tooth) this.toggleMissing(tooth);
        break;
      }
      case 'Escape': {
        this.activeCell.set(null);
        break;
      }
    }
  }

  // === Navigation helpers ===

  private getNextCell(cell: CellRef, teethArr: string[], direction: number): CellRef | null {
    let si = cell.siteIndex + direction;
    let ti = cell.toothIndex;

    if (si > 2) { si = 0; ti++; }
    if (si < 0) { si = 2; ti--; }
    if (ti < 0 || ti >= teethArr.length) return null;

    return { ...cell, toothIndex: ti, siteIndex: si };
  }

  private getNextRow(cell: CellRef, direction: number): CellRef | null {
    const rows = ALL_ROWS;
    const idx = rows.indexOf(cell.row);
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= rows.length) return null;
    return { ...cell, row: rows[nextIdx] };
  }

  private getToothAtCell(cell: CellRef): EditableTooth | undefined {
    const teethArr = cell.jaw === 'upper' ? UPPER_TEETH_ORDER : LOWER_TEETH_ORDER;
    const tn = teethArr[cell.toothIndex];
    return this.getToothByNumber(tn);
  }

  private toggleBoolAtCell(cell: CellRef, field: 'bleeding' | 'suppuration'): void {
    const tooth = this.getToothAtCell(cell);
    if (!tooth) return;
    this.toggleBool(tooth, cell.surface, cell.siteIndex, field);
  }

  private focusInputAt(cell: CellRef): void {
    setTimeout(() => {
      const id = this.getCellId(cell);
      const el = this.el.nativeElement.querySelector(`#${id}`) as HTMLElement;
      el?.focus();
    }, 0);
  }

  getCellId(cell: CellRef): string;
  getCellId(jaw: string, surface: string, toothIdx: number, siteIdx: number, row: string): string;
  getCellId(jawOrCell: string | CellRef, surface?: string, toothIdx?: number, siteIdx?: number, row?: string): string {
    if (typeof jawOrCell === 'object') {
      const c = jawOrCell;
      return `cell-${c.jaw}-${c.surface}-${c.toothIndex}-${c.siteIndex}-${c.row}`;
    }
    return `cell-${jawOrCell}-${surface}-${toothIdx}-${siteIdx}-${row}`;
  }

  private emitChange(): void {
    this.teethChange.emit(this.teeth);
    this.dataChanged.emit();
  }

  // Template helpers
  trackByTooth(_: number, tooth: EditableTooth): string {
    return tooth.toothNumber;
  }

  trackBySite(index: number): number {
    return index;
  }
}
