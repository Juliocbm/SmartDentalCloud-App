import { Component, Input, forwardRef, signal, ElementRef, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-form-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-select.html',
  styleUrl: './form-select.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormSelectComponent),
      multi: true
    }
  ]
})
export class FormSelectComponent implements ControlValueAccessor {
  private elementRef = inject(ElementRef);

  @Input() options: SelectOption[] = [];
  @Input() placeholder = '— Seleccionar —';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error: string | null = null;

  isOpen = signal(false);
  selectedOption = signal<SelectOption | null>(null);
  focusedIndex = signal(-1);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;

    switch (event.key) {
      case 'Escape':
        this.close();
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.focusedIndex.update(i => Math.min(i + 1, this.options.length - 1));
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.focusedIndex.update(i => Math.max(i - 1, 0));
        event.preventDefault();
        break;
      case 'Enter':
        if (this.focusedIndex() >= 0 && this.focusedIndex() < this.options.length) {
          this.selectOption(this.options[this.focusedIndex()]);
        }
        event.preventDefault();
        break;
    }
  }

  toggle(): void {
    if (this.disabled) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.disabled) return;
    this.isOpen.set(true);
    const currentIndex = this.options.findIndex(o => o.value === this.selectedOption()?.value);
    this.focusedIndex.set(currentIndex >= 0 ? currentIndex : 0);
  }

  close(): void {
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
    this.onTouched();
  }

  selectOption(option: SelectOption): void {
    this.selectedOption.set(option);
    this.onChange(option.value);
    this.close();
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedOption.set(null);
    this.onChange('');
    this.close();
  }

  // ControlValueAccessor
  writeValue(value: string): void {
    if (value) {
      const option = this.options.find(o => o.value === value);
      this.selectedOption.set(option || null);
    } else {
      this.selectedOption.set(null);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
