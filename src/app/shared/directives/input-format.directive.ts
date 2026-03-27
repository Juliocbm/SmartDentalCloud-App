import { Directive, ElementRef, HostListener, Input, OnInit, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { InputFormatType, INPUT_FORMAT_CONFIGS } from '../../core/validators/mx-validators';

/**
 * Directiva configurable para formateo de inputs con formatos mexicanos.
 *
 * Filtra caracteres no permitidos, aplica uppercase cuando corresponde,
 * y establece maxlength automáticamente.
 *
 * Funciona con Reactive Forms (formControlName) y template-driven (ngModel).
 *
 * Uso:
 *   <input formControlName="curp" appInputFormat="curp" />
 *   <input formControlName="phoneNumber" appInputFormat="phone" />
 *   <input formControlName="zipCode" appInputFormat="postalCode" />
 *   <input formControlName="taxId" appInputFormat="rfc" />
 */
@Directive({
  selector: '[appInputFormat]',
  standalone: true,
})
export class InputFormatDirective implements OnInit {
  @Input('appInputFormat') formatType!: InputFormatType;

  private el = inject(ElementRef);
  private ngControl = inject(NgControl, { optional: true });

  ngOnInit(): void {
    const config = INPUT_FORMAT_CONFIGS[this.formatType];
    if (config) {
      this.el.nativeElement.setAttribute('maxlength', String(config.maxLength));
    }
  }

  @HostListener('input')
  onInput(): void {
    this.formatValue();
  }

  @HostListener('paste')
  onPaste(): void {
    setTimeout(() => this.formatValue());
  }

  private formatValue(): void {
    const config = INPUT_FORMAT_CONFIGS[this.formatType];
    if (!config) return;

    const input = this.el.nativeElement as HTMLInputElement;
    let value = input.value;

    if (config.transform === 'uppercase') {
      value = value.toUpperCase();
    }

    value = value.replace(config.stripPattern, '');

    if (value.length > config.maxLength) {
      value = value.substring(0, config.maxLength);
    }

    // Solo actualizar si cambió (evita loops innecesarios)
    if (input.value !== value) {
      input.value = value;
      this.ngControl?.control?.setValue(value, { emitEvent: true });
    }
  }
}
