import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
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

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ]
})
export class DatePickerComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges, ControlValueAccessor {
  @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;

  @Input() mode: 'date' | 'datetime' = 'date';
  @Input() minDate: string | 'today' | null = null;
  @Input() maxDate: string | null = null;
  @Input() required = false;
  @Input() disabled = false;
  @Input() placeholder = 'Seleccionar fecha...';
  @Input() error: string | null = null;

  @Output() valueChange = new EventEmitter<string | null>();

  private flatpickrInstance: Instance | null = null;
  currentValue: string | null = null;

  // ControlValueAccessor callbacks
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initFlatpickr();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.flatpickrInstance) return;

    if (changes['minDate']) {
      this.flatpickrInstance.set('minDate', this.resolveMinDate());
    }
    if (changes['maxDate']) {
      this.flatpickrInstance.set('maxDate', this.maxDate || undefined);
    }
    if (changes['disabled']) {
      if (this.disabled) {
        this.dateInput.nativeElement.disabled = true;
      } else {
        this.dateInput.nativeElement.disabled = false;
      }
    }
  }

  ngOnDestroy(): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
      this.flatpickrInstance = null;
    }
  }

  private initFlatpickr(): void {
    const isDatetime = this.mode === 'datetime';

    this.flatpickrInstance = flatpickr(this.dateInput.nativeElement, {
      locale: Spanish,
      dateFormat: isDatetime ? 'Y-m-d H:i' : 'Y-m-d',
      enableTime: isDatetime,
      time_24hr: true,
      minuteIncrement: 15,
      minDate: this.resolveMinDate(),
      maxDate: this.maxDate || undefined,
      allowInput: false,
      clickOpens: true,
      disableMobile: true,
      defaultDate: this.currentValue || undefined,
      onChange: (selectedDates: Date[]) => {
        if (selectedDates.length > 0) {
          const date = selectedDates[0];
          let value: string;
          if (isDatetime) {
            value = this.formatDatetimeLocal(date);
          } else {
            value = this.formatDate(date);
          }
          this.currentValue = value;
          this.onChange(value);
          this.valueChange.emit(value);
        } else {
          this.currentValue = null;
          this.onChange(null);
          this.valueChange.emit(null);
        }
      },
      onClose: () => {
        this.onTouched();
      }
    });
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

  private formatDatetimeLocal(date: Date): string {
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${mo}-${d}T${h}:${mi}`;
  }

  onClear(): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.clear();
    }
    this.currentValue = null;
    this.onChange(null);
    this.valueChange.emit(null);
  }

  // ControlValueAccessor implementation
  writeValue(value: string | null): void {
    this.currentValue = value;
    if (this.flatpickrInstance) {
      if (value) {
        this.flatpickrInstance.setDate(value, false);
      } else {
        this.flatpickrInstance.clear();
      }
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.dateInput) {
      this.dateInput.nativeElement.disabled = isDisabled;
    }
  }
}
