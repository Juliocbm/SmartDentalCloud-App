import { Injectable, signal, computed } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  duration: number;
}

/**
 * Servicio global de notificaciones tipo toast.
 * Reemplaza el uso de alert() nativo del browser.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private nextId = 0;
  private _notifications = signal<Notification[]>([]);

  notifications = this._notifications.asReadonly();
  hasNotifications = computed(() => this._notifications().length > 0);

  success(message: string, duration = 4000): void {
    this.add(message, 'success', duration);
  }

  error(message: string, duration = 6000): void {
    this.add(message, 'error', duration);
  }

  warning(message: string, duration = 5000): void {
    this.add(message, 'warning', duration);
  }

  info(message: string, duration = 4000): void {
    this.add(message, 'info', duration);
  }

  dismiss(id: number): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  clearAll(): void {
    this._notifications.set([]);
  }

  /**
   * Muestra un diálogo de confirmación usando Promise.
   * Reemplaza el uso de confirm() nativo del browser.
   * Retorna true si el usuario confirma, false si cancela.
   */
  confirm(message: string): Promise<boolean> {
    return new Promise(resolve => {
      this._pendingConfirm.set({ message, resolve });
    });
  }

  // Estado interno para el modal de confirmación
  private _pendingConfirm = signal<{ message: string; resolve: (value: boolean) => void } | null>(null);
  pendingConfirm = this._pendingConfirm.asReadonly();

  resolveConfirm(result: boolean): void {
    const pending = this._pendingConfirm();
    if (pending) {
      pending.resolve(result);
      this._pendingConfirm.set(null);
    }
  }

  private add(message: string, type: NotificationType, duration: number): void {
    const id = this.nextId++;
    const notification: Notification = { id, message, type, duration };

    this._notifications.update(list => [...list, notification]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
}
