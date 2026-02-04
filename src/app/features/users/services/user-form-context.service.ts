import { Injectable, signal, computed } from '@angular/core';
import { UserFormContext, DEFAULT_USER_CONTEXT } from '../models/user-form-context.model';

@Injectable({
  providedIn: 'root'
})
export class UserFormContextService {
  private contextState = signal<UserFormContext>(DEFAULT_USER_CONTEXT);

  context = computed(() => this.contextState());

  setContext(context: Partial<UserFormContext>): void {
    this.contextState.set({
      ...DEFAULT_USER_CONTEXT,
      ...context
    });
  }

  resetContext(): void {
    this.contextState.set(DEFAULT_USER_CONTEXT);
  }

  getCurrentContext(): UserFormContext {
    return this.contextState();
  }
}
