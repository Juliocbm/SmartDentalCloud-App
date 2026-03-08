import { Injectable, inject, DestroyRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from './auth.service';

export interface NavigationState {
  url: string;
  timestamp: number;
  userId: string;
}

export interface TabStates {
  [routeBase: string]: string;
}

const STATE_PREFIX = 'nav_state_';
const TABS_PREFIX = 'nav_tabs_';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

const EXCLUDED_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/unauthorized',
  '/onboarding',
  '/subscription/expired',
  '/subscription/limit-exceeded'
];

@Injectable({
  providedIn: 'root'
})
export class NavigationStateService {
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  /**
   * Inicia la escucha de eventos NavigationEnd para guardar automáticamente
   * la última ruta visitada. Debe llamarse una sola vez desde LayoutComponent.
   */
  startTracking(): void {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      if (!this.isExcludedRoute(event.urlAfterRedirects)) {
        this.saveUrl(event.urlAfterRedirects);
      }
    });
  }

  /**
   * Guarda el tab activo para una URL específica.
   * Llamado por los componentes con tabs (setActiveTab).
   */
  saveState(url: string, tabState?: string): void {
    if (tabState) {
      this.saveTab(url, tabState);
    }
  }

  /**
   * Recupera el estado de última URL si es válido (mismo usuario, mismo tenant, no expirado).
   */
  getState(): NavigationState | null {
    const key = this.getStorageKey(STATE_PREFIX);
    if (!key) return null;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const state: NavigationState = JSON.parse(raw);

      if (!this.isValid(state)) {
        localStorage.removeItem(key);
        return null;
      }

      return state;
    } catch {
      if (key) localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Obtiene el tab guardado para una ruta base específica.
   * Independiente de la última URL visitada.
   */
  getSavedTab(currentUrl: string): string | null {
    const tabs = this.getTabStates();
    if (!tabs) return null;

    const routeBase = currentUrl.split('?')[0].split('#')[0];
    return tabs[routeBase] ?? null;
  }

  /**
   * Limpia el estado de navegación del usuario+tenant actual.
   */
  clearState(): void {
    const stateKey = this.getStorageKey(STATE_PREFIX);
    const tabsKey = this.getStorageKey(TABS_PREFIX);
    if (stateKey) localStorage.removeItem(stateKey);
    if (tabsKey) localStorage.removeItem(tabsKey);
  }

  // --- Private ---

  private saveUrl(url: string): void {
    const key = this.getStorageKey(STATE_PREFIX);
    if (!key) return;

    const state: NavigationState = {
      url,
      timestamp: Date.now(),
      userId: this.getUserId()
    };

    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // silenciar
    }
  }

  private saveTab(url: string, tabState: string): void {
    const key = this.getStorageKey(TABS_PREFIX);
    if (!key) return;

    const routeBase = url.split('?')[0].split('#')[0];
    const tabs = this.getTabStates() ?? {};
    tabs[routeBase] = tabState;

    try {
      localStorage.setItem(key, JSON.stringify(tabs));
    } catch {
      // silenciar
    }
  }

  private getTabStates(): TabStates | null {
    const key = this.getStorageKey(TABS_PREFIX);
    if (!key) return null;

    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private isValid(state: NavigationState): boolean {
    if (!state.url || !state.userId) return false;
    if (Date.now() - state.timestamp > TTL_MS) return false;
    if (state.userId !== this.getUserId()) return false;
    if (this.isExcludedRoute(state.url)) return false;
    return true;
  }

  private isExcludedRoute(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return EXCLUDED_ROUTES.some(excluded => path === excluded || path.startsWith(excluded + '/'));
  }

  private getStorageKey(prefix: string): string | null {
    const userId = this.getUserId();
    if (!userId) return null;
    return `${prefix}${userId}`;
  }

  private getUserId(): string {
    return this.authService.getCurrentUser()?.id ?? '';
  }
}
