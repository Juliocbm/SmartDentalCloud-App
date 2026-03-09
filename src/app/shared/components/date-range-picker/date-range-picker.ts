import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
  forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { Instance } from 'flatpickr/dist/types/instance';

export interface DateRange {
  start: string;
  end: string;
}

export interface DatePreset {
  key: string;
  label: string;
  getValue: () => DateRange;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DEFAULT_PRESETS: DatePreset[] = [
  {
    key: 'today',
    label: 'Hoy',
    getValue: () => {
      const today = toLocalDateString(new Date());
      return { start: today, end: today };
    }
  },
  {
    key: 'this_week',
    label: 'Esta Semana',
    getValue: () => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), diff);
      return { start: toLocalDateString(monday), end: toLocalDateString(now) };
    }
  },
  {
    key: 'this_month',
    label: 'Este Mes',
    getValue: () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: toLocalDateString(first), end: toLocalDateString(now) };
    }
  },
  {
    key: 'last_month',
    label: 'Último Mes',
    getValue: () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: toLocalDateString(first), end: toLocalDateString(last) };
    }
  },
  {
    key: 'last_3_months',
    label: 'Últimos 3 Meses',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return { start: toLocalDateString(start), end: toLocalDateString(now) };
    }
  },
  {
    key: 'this_year',
    label: 'Este Año',
    getValue: () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), 0, 1);
      return { start: toLocalDateString(first), end: toLocalDateString(now) };
    }
  }
];

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-range-picker.html',
  styleUrl: './date-range-picker.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePickerComponent),
      multi: true
    }
  ]
})
export class DateRangePickerComponent implements AfterViewInit, OnDestroy, OnChanges, ControlValueAccessor {
  @ViewChild('rangeInput') rangeInput!: ElementRef<HTMLInputElement>;

  @Input() startDate: string | null = null;
  @Input() endDate: string | null = null;
  @Input() placeholder = 'Seleccionar rango...';
  @Input() disabled = false;
  @Input() minDate: string | 'today' | null = null;
  @Input() maxDate: string | null = null;
  @Input() showPresets = false;
  @Input() presets: DatePreset[] = DEFAULT_PRESETS;
  @Input() defaultPreset: string | null = null;

  @Output() rangeChange = new EventEmitter<DateRange | null>();

  private flatpickrInstance: Instance | null = null;
  private presetContainer: HTMLElement | null = null;
  currentValue: DateRange | null = null;
  displayValue = '';
  activePresetKey: string | null = null;

  private onChange: (value: DateRange | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.initFlatpickr();
    if (this.defaultPreset && !this.startDate && !this.endDate) {
      this.selectPreset(this.defaultPreset);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startDate'] || changes['endDate']) {
      if (this.startDate && this.endDate) {
        this.currentValue = { start: this.startDate, end: this.endDate };
        this.displayValue = this.formatDisplay(this.startDate, this.endDate);
        if (this.flatpickrInstance) {
          this.flatpickrInstance.setDate([this.startDate, this.endDate], false);
        }
      } else {
        this.currentValue = null;
        this.displayValue = '';
        if (this.flatpickrInstance) {
          this.flatpickrInstance.clear();
        }
      }
    }

    if (!this.flatpickrInstance) return;

    if (changes['minDate']) {
      this.flatpickrInstance.set('minDate', this.resolveMinDate());
    }
    if (changes['maxDate']) {
      this.flatpickrInstance.set('maxDate', this.maxDate || undefined);
    }
  }

  ngOnDestroy(): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
      this.flatpickrInstance = null;
    }
  }

  private initFlatpickr(): void {
    this.flatpickrInstance = flatpickr(this.rangeInput.nativeElement, {
      locale: Spanish,
      mode: 'range',
      dateFormat: 'Y-m-d',
      minDate: this.resolveMinDate(),
      maxDate: this.maxDate || undefined,
      allowInput: false,
      clickOpens: true,
      disableMobile: true,
      defaultDate: this.getDefaultDates(),
      onReady: (_selectedDates: Date[], _dateStr: string, instance: Instance) => {
        if (this.showPresets) {
          this.injectPresets(instance);
        }
      },
      onChange: (selectedDates: Date[]) => {
        if (selectedDates.length === 2) {
          const start = this.formatDate(selectedDates[0]);
          const end = this.formatDate(selectedDates[1]);
          this.currentValue = { start, end };
          this.displayValue = this.formatDisplay(start, end);
          this.activePresetKey = this.detectActivePreset(start, end);
          this.updatePresetActiveStates();
          this.onChange(this.currentValue);
          this.rangeChange.emit(this.currentValue);
        }
      },
      onClose: (selectedDates: Date[]) => {
        this.onTouched();
        // If only one date selected on close, treat as single-day range
        if (selectedDates.length === 1) {
          const date = this.formatDate(selectedDates[0]);
          this.currentValue = { start: date, end: date };
          this.displayValue = this.formatDisplay(date, date);
          this.activePresetKey = this.detectActivePreset(date, date);
          this.updatePresetActiveStates();
          this.onChange(this.currentValue);
          this.rangeChange.emit(this.currentValue);
        }
      }
    });
  }

  private injectPresets(instance: Instance): void {
    const calendarContainer = instance.calendarContainer;
    if (!calendarContainer) return;

    this.presetContainer = document.createElement('div');
    this.presetContainer.className = 'flatpickr-presets';

    for (const preset of this.presets) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'flatpickr-preset-btn';
      btn.dataset['presetKey'] = preset.key;
      btn.textContent = preset.label;
      if (this.activePresetKey === preset.key) {
        btn.classList.add('flatpickr-preset-btn--active');
      }
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectPreset(preset.key);
        instance.close();
      });
      this.presetContainer.appendChild(btn);
    }

    // Mark the calendar so CSS can reposition the month arrows below presets
    calendarContainer.classList.add('has-presets');
    calendarContainer.prepend(this.presetContainer);
  }

  private updatePresetActiveStates(): void {
    if (!this.presetContainer) return;
    const buttons = this.presetContainer.querySelectorAll('.flatpickr-preset-btn');
    buttons.forEach((btn) => {
      const key = (btn as HTMLElement).dataset['presetKey'];
      btn.classList.toggle('flatpickr-preset-btn--active', key === this.activePresetKey);
    });
  }

  private detectActivePreset(start: string, end: string): string | null {
    for (const preset of this.presets) {
      const range = preset.getValue();
      if (range.start === start && range.end === end) return preset.key;
    }
    return null;
  }

  private getDefaultDates(): string[] {
    const dates: string[] = [];
    if (this.startDate) dates.push(this.startDate);
    if (this.endDate) dates.push(this.endDate);
    return dates;
  }

  private resolveMinDate(): string | undefined {
    if (this.minDate === 'today') return 'today';
    if (this.minDate) return this.minDate;
    return undefined;
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatDisplay(start: string, end: string): string {
    const s = this.toShortDate(start);
    const e = this.toShortDate(end);
    if (start === end) return s;
    return `${s}  —  ${e}`;
  }

  private toShortDate(isoDate: string): string {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const parts = isoDate.split('-');
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1];
    const year = parts[0];
    return `${day}/${month}/${year}`;
  }

  selectPreset(key: string): void {
    const preset = this.presets.find(p => p.key === key);
    if (!preset) return;
    const range = preset.getValue();
    this.activePresetKey = key;
    this.currentValue = range;
    this.displayValue = this.formatDisplay(range.start, range.end);
    if (this.flatpickrInstance) {
      this.flatpickrInstance.setDate([range.start, range.end], false);
    }
    this.onChange(this.currentValue);
    this.rangeChange.emit(this.currentValue);
  }

  onClear(): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.clear();
    }
    this.currentValue = null;
    this.displayValue = '';
    this.activePresetKey = null;
    this.onChange(null);
    this.rangeChange.emit(null);
  }

  // ControlValueAccessor
  writeValue(value: DateRange | null): void {
    this.currentValue = value;
    if (value) {
      this.displayValue = this.formatDisplay(value.start, value.end);
      if (this.flatpickrInstance) {
        this.flatpickrInstance.setDate([value.start, value.end], false);
      }
    } else {
      this.displayValue = '';
      if (this.flatpickrInstance) {
        this.flatpickrInstance.clear();
      }
    }
  }

  registerOnChange(fn: (value: DateRange | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.rangeInput) {
      this.rangeInput.nativeElement.disabled = isDisabled;
    }
  }
}
