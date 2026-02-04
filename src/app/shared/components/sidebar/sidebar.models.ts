/**
 * Modelos e interfaces para el componente Sidebar
 * Sigue principios SOLID y arquitectura enterprise
 */

/** Item de menu del sidebar */
export interface MenuItem {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly route: string;
  readonly badge?: number;
  readonly children?: readonly MenuItem[];
}

/** Configuracion del sidebar */
export interface SidebarConfig {
  readonly defaultCollapsed: boolean;
  readonly persistState: boolean;
  readonly animationDurationMs: number;
  readonly searchDebounceMs: number;
}

/** Configuracion por defecto del sidebar */
export const DEFAULT_SIDEBAR_CONFIG: SidebarConfig = {
  defaultCollapsed: false,
  persistState: true,
  animationDurationMs: 200,
  searchDebounceMs: 150
};

/** Keys para localStorage */
export const SIDEBAR_STORAGE_KEYS = {
  COLLAPSED: 'smartdental_sidebar_collapsed',
  EXPANDED_MENUS: 'smartdental_sidebar_expanded'
} as const;
