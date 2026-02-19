import { Injectable, signal, effect, inject } from '@angular/core';
import { LoggingService } from './logging.service';

/**
 * Configuración de estado del sidebar
 */
interface SidebarState {
  collapsed: boolean;
  expandedMenus: string[];
}

/**
 * Estado de búsqueda (no persistido)
 */
interface SearchState {
  term: string;
}

const STORAGE_KEY = 'sidebar-state';
const DEFAULT_STATE: SidebarState = {
  collapsed: false,
  expandedMenus: []
};

/**
 * Servicio para gestionar y persistir el estado del sidebar
 * Usa localStorage para mantener preferencias entre sesiones
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private logger = inject(LoggingService);

  /**
   * Estado de colapso del sidebar
   */
  collapsed = signal(this.loadState().collapsed);

  /**
   * Menús expandidos (para submenús)
   */
  expandedMenus = signal<string[]>(this.loadState().expandedMenus);

  /**
   * Término de búsqueda (no persistido)
   */
  searchTerm = signal('');

  constructor() {
    // Auto-guardar cuando cambia el estado
    effect(() => {
      this.saveState({
        collapsed: this.collapsed(),
        expandedMenus: this.expandedMenus()
      });
    });
  }

  /**
   * Alterna el estado de colapso del sidebar
   */
  toggleCollapsed(): void {
    this.collapsed.update(value => !value);
  }

  /**
   * Establece el estado de colapso
   */
  setCollapsed(collapsed: boolean): void {
    this.collapsed.set(collapsed);
  }

  /**
   * Alterna la expansión de un menú específico
   */
  toggleMenuExpansion(menuId: string): void {
    this.expandedMenus.update(menus => {
      if (menus.includes(menuId)) {
        return menus.filter(id => id !== menuId);
      } else {
        return [...menus, menuId];
      }
    });
  }

  /**
   * Verifica si un menú está expandido
   */
  isMenuExpanded(menuId: string): boolean {
    return this.expandedMenus().includes(menuId);
  }

  /**
   * Carga el estado desde localStorage
   */
  private loadState(): SidebarState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_STATE, ...JSON.parse(stored) };
      }
    } catch (error) {
      this.logger.error('Error loading sidebar state:', error);
    }
    return DEFAULT_STATE;
  }

  /**
   * Guarda el estado en localStorage
   */
  private saveState(state: SidebarState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      this.logger.error('Error saving sidebar state:', error);
    }
  }

  /**
   * Resetea el estado a valores por defecto
   */
  reset(): void {
    this.collapsed.set(DEFAULT_STATE.collapsed);
    this.expandedMenus.set(DEFAULT_STATE.expandedMenus);
    this.searchTerm.set('');
  }

  /**
   * Establece el término de búsqueda
   */
  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  /**
   * Limpia la búsqueda
   */
  clearSearch(): void {
    this.searchTerm.set('');
  }

  /**
   * Expande todos los menús (útil durante búsqueda)
   */
  expandAll(menuIds: string[]): void {
    this.expandedMenus.set(menuIds);
  }

  /**
   * Colapsa todos los menús
   */
  collapseAll(): void {
    this.expandedMenus.set([]);
  }
}
