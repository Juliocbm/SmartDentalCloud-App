import { Injectable, signal, computed } from '@angular/core';
import { InvoiceFormContext, DEFAULT_INVOICE_CONTEXT } from '../models/invoice-form-context.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceFormContextService {
  private contextState = signal<InvoiceFormContext>(DEFAULT_INVOICE_CONTEXT);

  context = computed(() => this.contextState());

  setContext(context: Partial<InvoiceFormContext>): void {
    this.contextState.set({
      ...DEFAULT_INVOICE_CONTEXT,
      ...context
    });
  }

  resetContext(): void {
    this.contextState.set(DEFAULT_INVOICE_CONTEXT);
  }

  getCurrentContext(): InvoiceFormContext {
    return this.contextState();
  }
}
