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

  @Output() rangeChange = new EventEmitter<DateRange | null>();

  private flatpickrInstance: Instance | null = null;
  currentValue: DateRange | null = null;
  displayValue = '';

  private onChange: (value: DateRange | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.initFlatpickr();
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
      onChange: (selectedDates: Date[]) => {
        if (selectedDates.length === 2) {
          const start = this.formatDate(selectedDates[0]);
          const end = this.formatDate(selectedDates[1]);
          this.currentValue = { start, end };
          this.displayValue = this.formatDisplay(start, end);
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
          this.onChange(this.currentValue);
          this.rangeChange.emit(this.currentValue);
        }
      }
    });
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

  onClear(): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.clear();
    }
    this.currentValue = null;
    this.displayValue = '';
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
