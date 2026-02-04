import { Injectable, signal, computed } from '@angular/core';
import { AppointmentFormContext, DEFAULT_APPOINTMENT_CONTEXT } from '../models/appointment-form-context.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentFormContextService {
  private contextState = signal<AppointmentFormContext>(DEFAULT_APPOINTMENT_CONTEXT);

  context = computed(() => this.contextState());

  setContext(context: Partial<AppointmentFormContext>): void {
    this.contextState.set({
      ...DEFAULT_APPOINTMENT_CONTEXT,
      ...context
    });
  }

  resetContext(): void {
    this.contextState.set(DEFAULT_APPOINTMENT_CONTEXT);
  }

  getCurrentContext(): AppointmentFormContext {
    return this.contextState();
  }
}
