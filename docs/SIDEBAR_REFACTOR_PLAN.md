# Plan de Refactorizacion del Sidebar - SmartDentalCloud

## Resumen Ejecutivo

Modernizar el componente Sidebar para mejorar la experiencia de usuario con menus colapsables, busqueda en tiempo real, mejor jerarquia visual y persistencia de estado.

---

## Problemas Actuales

| Problema | Descripcion |
|----------|-------------|
| **Submenus siempre visibles** | No hay funcionalidad de collapse/expand |
| **Jerarquia poco clara** | Dificil distinguir padres de hijos visualmente |
| **Sin busqueda** | No hay filtrado de menus |
| **Sin indicadores de expansion** | No hay chevron para indicar submenus |

---

## Objetivos

| Objetivo | Descripcion | Prioridad |
|----------|-------------|-----------|
| Collapse/Expand | Submenus colapsables con click en el padre | Alta |
| Busqueda en tiempo real | Filtrar menus mientras se escribe | Alta |
| Jerarquia visual clara | Mejor distincion entre padres e hijos | Alta |
| Tooltips | Mostrar tooltips cuando sidebar esta colapsado | Media |
| Persistencia | Recordar estado de menus expandidos (localStorage) | Media |
| Animaciones | Transiciones suaves para expand/collapse | Media |
| Keyboard navigation | Navegar con flechas, Enter para seleccionar | Baja |

---

## Decisiones de Diseno

| Pregunta | Decision | Justificacion |
|----------|----------|---------------|
| Menus inician colapsados o expandidos? | **Colapsados** | Interfaz mas limpia por defecto |
| Filtrar submenus o solo padres? | **Filtrar submenus, mostrar con padre** | Mejor contexto de navegacion |
| Tooltips cuando sidebar colapsado? | **Si** | Accesibilidad y usabilidad |

---

## Fases de Implementacion

### Fase 1: Estructura Base
**Objetivo:** Preparar la estructura de datos y logica base

**Tareas:**
1. Agregar IDs unicos a todos los menuItems
2. Crear signal para expandedMenus
3. Implementar metodo toggleMenu()
4. Implementar metodo isExpanded()

**Archivos afectados:**
- sidebar.ts

### Fase 2: Collapse/Expand
**Objetivo:** Implementar funcionalidad de expandir/colapsar submenus

**Tareas:**
1. Modificar HTML para soportar expand/collapse
2. Agregar chevrons animados
3. Implementar animaciones CSS
4. Separar click de navegacion vs expand

**Archivos afectados:**
- sidebar.html
- sidebar.scss

### Fase 3: Busqueda
**Objetivo:** Implementar buscador con filtrado en tiempo real

**Tareas:**
1. Agregar input de busqueda en header
2. Crear signal para searchTerm
3. Implementar logica de filtrado (incluye submenus)
4. Mostrar resultados con padre cuando hijo coincide
5. Agregar highlighting de coincidencias

**Archivos afectados:**
- sidebar.ts
- sidebar.html
- sidebar.scss

### Fase 4: Persistencia y UX
**Objetivo:** Persistir estado y mejorar experiencia

**Tareas:**
1. Guardar menus expandidos en localStorage
2. Cargar estado al iniciar
3. Agregar tooltips para sidebar colapsado
4. Probar temas claro/oscuro
5. Probar responsive/mobile

**Archivos afectados:**
- sidebar-state.service.ts
- sidebar.ts

---

## Especificaciones Tecnicas

### Estructura de Datos

```typescript
interface MenuItem {
  id: string;                    // Identificador unico
  icon: string;
  label: string;
  route: string;
  badge?: number;
  children?: MenuItem[];
}

interface SidebarState {
  collapsed: boolean;            // Sidebar colapsado
  expandedMenus: Set<string>;    // IDs de menus expandidos
  searchTerm: string;            // Termino de busqueda
}
```

### Logica de Filtrado

```typescript
filterMenuItems(items: MenuItem[], term: string): MenuItem[] {
  const lowerTerm = term.toLowerCase();
  const result: MenuItem[] = [];
  
  for (const item of items) {
    const matchesSelf = item.label.toLowerCase().includes(lowerTerm);
    
    if (item.children) {
      const matchingChildren = item.children.filter(child =>
        child.label.toLowerCase().includes(lowerTerm)
      );
      
      if (matchingChildren.length > 0) {
        // Mostrar padre con hijos que coinciden
        result.push({ ...item, children: matchingChildren });
      } else if (matchesSelf) {
        // Padre coincide, mostrar con todos los hijos
        result.push(item);
      }
    } else if (matchesSelf) {
      result.push(item);
    }
  }
  
  return result;
}
```

### Persistencia

```typescript
private readonly STORAGE_KEY = 'smartdental_sidebar_expanded';

saveExpandedMenus(menuIds: string[]): void {
  localStorage.setItem(this.STORAGE_KEY, JSON.stringify(menuIds));
}

loadExpandedMenus(): string[] {
  const stored = localStorage.getItem(this.STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}
```

---

## Archivos a Modificar

### sidebar.ts

| Cambio | Descripcion |
|--------|-------------|
| Agregar signal searchTerm | Para el termino de busqueda |
| Agregar signal expandedMenus | Set de IDs expandidos |
| Agregar computed filteredMenuItems | Menus filtrados por busqueda |
| Agregar metodo toggleMenu() | Expandir/colapsar menu |
| Agregar metodo isExpanded() | Verificar si menu esta expandido |
| Agregar IDs a menuItems | Identificadores unicos |

### sidebar.html

| Cambio | Descripcion |
|--------|-------------|
| Agregar seccion de busqueda | Input con icono y boton limpiar |
| Agregar chevrons | Iconos animados en padres con hijos |
| Modificar click en padres | Expandir en lugar de navegar |
| Agregar link separado | Para navegar al dashboard del modulo |
| Agregar tooltips | title attribute para sidebar colapsado |
| Agregar aria attributes | Accesibilidad |

### sidebar.scss

| Cambio | Descripcion |
|--------|-------------|
| Estilos .sidebar-search | Buscador con icono |
| Animacion .chevron | Rotacion 0 a 180 grados |
| Transicion .submenu | max-height y opacity |
| Lineas conectoras | Antes de submenu-items |
| Highlight busqueda | Background en coincidencias |
| Mejores hover states | Efectos mas pronunciados |

### sidebar-state.service.ts

| Cambio | Descripcion |
|--------|-------------|
| Agregar signal expandedMenus | Estado de menus expandidos |
| Agregar saveExpandedMenus() | Guardar en localStorage |
| Agregar loadExpandedMenus() | Cargar de localStorage |

---

## Diseno Visual

### Estado Expandido del Sidebar
```
+---------------------------+
| [tooth] SmartDental   [<<]|
+---------------------------+
| [search] Buscar menu...   |
+---------------------------+
| [o] Dashboard             |
| [o] Pacientes             |
| [v] Citas                 |  <- Expandido (chevron abajo)
|   +-- Calendario          |
|   +-- Lista de Citas      |
|   +-- Nueva Cita          |
| [o] Tratamientos          |
| [>] Inventario            |  <- Colapsado (chevron derecha)
| [o] Dentistas             |
| [o] Usuarios y Roles      |
| [o] Reportes              |
| [o] Configuracion         |
+---------------------------+
| [avatar] Admin            |
|          Administrador    |
+---------------------------+
```

### Estado Colapsado del Sidebar
```
+------+
| [T]  |  <- Logo
+------+
| [Q]  |  <- Busqueda (tooltip: "Buscar")
+------+
| [D]  |  <- Dashboard (tooltip)
| [P]  |  <- Pacientes (tooltip)
| [C]  |  <- Citas (tooltip + indicador submenu)
| [T]  |
| [I]  |  <- Inventario (tooltip + indicador)
| ... |
+------+
| [A]  |  <- Avatar
+------+
```

### Busqueda Activa
```
+---------------------------+
| [tooth] SmartDental   [<<]|
+---------------------------+
| [search] prod         [x] |  <- Termino "prod"
+---------------------------+
| [v] Inventario            |  <- Padre mostrado
|   +-- [Prod]uctos         |  <- "Prod" resaltado
+---------------------------+
| 1 resultado               |
+---------------------------+
```

---

## Accesibilidad

| Feature | Implementacion |
|---------|----------------|
| Keyboard navigation | Tab entre menus, Enter para expandir/navegar |
| Screen readers | aria-expanded, aria-controls, aria-label |
| Focus visible | Outline claro en foco |
| Reduced motion | @media (prefers-reduced-motion) |

---

## Checklist de Implementacion

### Fase 1: Estructura Base
- [ ] Agregar IDs a todos los menuItems
- [ ] Implementar expandedMenus signal
- [ ] Agregar metodo toggleMenu()
- [ ] Agregar metodo isExpanded()

### Fase 2: Collapse/Expand
- [ ] Actualizar HTML con chevrons
- [ ] Implementar expand/collapse en HTML
- [ ] Agregar animaciones de chevron
- [ ] Agregar animaciones de submenu
- [ ] Agregar lineas conectoras

### Fase 3: Busqueda
- [ ] Agregar input de busqueda
- [ ] Implementar searchTerm signal
- [ ] Implementar filtrado con computed
- [ ] Agregar highlighting de coincidencias
- [ ] Agregar estilos de buscador

### Fase 4: Persistencia y UX
- [ ] Implementar persistencia en localStorage
- [ ] Agregar tooltips
- [ ] Probar con tema claro y oscuro
- [ ] Probar en mobile
- [ ] Verificar accesibilidad

---

## Riesgos y Mitigaciones

| Riesgo | Mitigacion |
|--------|------------|
| Regresion visual | Probar ambos temas antes de merge |
| Performance con muchos menus | Usar trackBy en ngFor |
| localStorage no disponible | Fallback a estado default |
| Conflicto con rutas | Separar click de navegacion vs expand |

---

## Referencias

- Patron de sidebar: Ant Design Sider
- Animaciones: Angular Animations / CSS transitions
- Accesibilidad: WAI-ARIA Menu Pattern

---

**Estado:** Pendiente de implementacion
**Fecha de creacion:** 04 Feb 2026
**Prioridad:** Alta
**Estimacion:** 2-3 horas

---

## Arquitectura Enterprise

### Principios de Diseno

| Principio | Aplicacion |
|-----------|------------|
| **Single Responsibility** | Cada componente/servicio tiene una unica responsabilidad |
| **Open/Closed** | Extensible para nuevos tipos de menu sin modificar codigo existente |
| **Dependency Injection** | Servicios inyectados, no instanciados directamente |
| **Separation of Concerns** | Logica en TS, presentacion en HTML, estilos en SCSS |

### Estructura de Archivos

```
shared/
  components/
    sidebar/
      sidebar.ts              # Componente principal (presentacion)
      sidebar.html            # Template
      sidebar.scss            # Estilos especificos del componente
      sidebar.models.ts       # Interfaces y tipos (NUEVO)
      sidebar.constants.ts    # Constantes y configuracion (NUEVO)
      
core/
  services/
    sidebar-state.service.ts  # Estado global del sidebar
    
  models/
    menu-item.model.ts        # Interface MenuItem reutilizable (NUEVO)
```

### Interfaces y Modelos

```typescript
// menu-item.model.ts
export interface MenuItem {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly route: string;
  readonly badge?: number;
  readonly children?: readonly MenuItem[];
  readonly permissions?: string[];  // Para control de acceso futuro
}

export interface MenuGroup {
  readonly id: string;
  readonly title?: string;
  readonly items: readonly MenuItem[];
}

// sidebar.models.ts
export interface SidebarConfig {
  readonly defaultCollapsed: boolean;
  readonly persistState: boolean;
  readonly animationDuration: number;
  readonly searchDebounceMs: number;
}

export const DEFAULT_SIDEBAR_CONFIG: SidebarConfig = {
  defaultCollapsed: false,
  persistState: true,
  animationDuration: 200,
  searchDebounceMs: 150
};
```

### Servicio con Patron State Management

```typescript
// sidebar-state.service.ts
@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  // Estado privado
  private readonly _collapsed = signal(false);
  private readonly _expandedMenus = signal<ReadonlySet<string>>(new Set());
  private readonly _searchTerm = signal('');
  
  // Selectores publicos (readonly)
  readonly collapsed = this._collapsed.asReadonly();
  readonly expandedMenus = this._expandedMenus.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  
  // Acciones
  toggleCollapsed(): void { ... }
  toggleMenu(menuId: string): void { ... }
  setSearchTerm(term: string): void { ... }
  
  // Persistencia
  private persist(): void { ... }
  private hydrate(): void { ... }
}
```

---

## Patrones SCSS Enterprise

### Arquitectura de Estilos

```
styles/
  _variables.scss       # Variables CSS globales
  _mixins.scss          # Mixins reutilizables
  _functions.scss       # Funciones SCSS
  _animations.scss      # Keyframes y animaciones (NUEVO)
  _sidebar-tokens.scss  # Design tokens especificos del sidebar (NUEVO)
```

### Design Tokens para Sidebar

```scss
// _sidebar-tokens.scss
// Tokens especificos del sidebar usando variables globales

// Dimensiones
--sidebar-width: 260px;
--sidebar-collapsed-width: 70px;
--sidebar-header-height: 64px;
--sidebar-search-height: 44px;
--sidebar-item-height: 44px;
--sidebar-subitem-height: 40px;

// Indentacion
--sidebar-indent-level-1: 0;
--sidebar-indent-level-2: 24px;
--sidebar-indent-connector-width: 2px;

// Animaciones
--sidebar-transition-duration: 200ms;
--sidebar-transition-timing: ease-out;
--sidebar-chevron-rotation: 180deg;

// Colores (heredan de variables globales)
--sidebar-bg: var(--surface-primary);
--sidebar-item-hover-bg: var(--surface-secondary);
--sidebar-item-active-bg: var(--primary-50);
--sidebar-item-active-border: var(--primary-600);
--sidebar-connector-color: var(--border-primary);
--sidebar-search-bg: var(--surface-secondary);
```

### Mixins Reutilizables

```scss
// _mixins.scss

// Mixin para items de menu
@mixin sidebar-item-base {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: 
    background-color var(--sidebar-transition-duration) var(--sidebar-transition-timing),
    color var(--sidebar-transition-duration) var(--sidebar-transition-timing);
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

@mixin sidebar-item-hover {
  background: var(--sidebar-item-hover-bg);
  color: var(--text-primary);
}

@mixin sidebar-item-active {
  background: var(--sidebar-item-active-bg);
  color: var(--primary-600);
  font-weight: var(--font-weight-medium);
  border-right: 3px solid var(--sidebar-item-active-border);
}

// Mixin para animacion de expand/collapse
@mixin submenu-animation {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: 
    max-height var(--sidebar-transition-duration) var(--sidebar-transition-timing),
    opacity calc(var(--sidebar-transition-duration) / 2) var(--sidebar-transition-timing);
  
  &.expanded {
    max-height: 500px; // Suficiente para cualquier submenu
    opacity: 1;
  }
}

// Mixin para lineas conectoras
@mixin submenu-connector {
  position: relative;
  margin-left: var(--sidebar-indent-level-2);
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--sidebar-indent-connector-width);
    background: var(--sidebar-connector-color);
  }
}

// Mixin para focus visible (accesibilidad)
@mixin focus-visible-ring {
  &:focus-visible {
    outline: 2px solid var(--primary-500);
    outline-offset: -2px;
  }
}
```

### Estructura SCSS del Componente

```scss
// sidebar.scss
@use '../../../styles/mixins' as *;
@use '../../../styles/sidebar-tokens';

.sidebar {
  // Layout principal
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  transition: width var(--sidebar-transition-duration) var(--sidebar-transition-timing);
  z-index: var(--z-fixed);
  
  // Modificador: colapsado
  &--collapsed {
    width: var(--sidebar-collapsed-width);
  }
}

// BEM: Bloque Header
.sidebar__header { ... }

// BEM: Bloque Search
.sidebar__search {
  display: flex;
  align-items: center;
  // ...
  
  &-input { ... }
  &-icon { ... }
  &-clear { ... }
}

// BEM: Bloque Nav
.sidebar__nav { ... }

// BEM: Bloque Menu Item
.sidebar__menu-item {
  @include sidebar-item-base;
  @include focus-visible-ring;
  
  &:hover {
    @include sidebar-item-hover;
  }
  
  &--active {
    @include sidebar-item-active;
  }
  
  &--parent {
    // Estilos para items con hijos
  }
}

// BEM: Bloque Submenu
.sidebar__submenu {
  @include submenu-animation;
  @include submenu-connector;
}

.sidebar__submenu-item {
  @include sidebar-item-base;
  @include focus-visible-ring;
  height: var(--sidebar-subitem-height);
  padding-left: calc(var(--sidebar-indent-level-2) + var(--spacing-lg));
  font-size: var(--font-size-xs);
  
  // Linea horizontal conectora
  &::before {
    content: '';
    position: absolute;
    left: calc(-1 * var(--sidebar-indent-level-2));
    top: 50%;
    width: calc(var(--sidebar-indent-level-2) - var(--spacing-sm));
    height: var(--sidebar-indent-connector-width);
    background: var(--sidebar-connector-color);
  }
}

// BEM: Bloque Chevron
.sidebar__chevron {
  margin-left: auto;
  font-size: 0.75rem;
  transition: transform var(--sidebar-transition-duration) var(--sidebar-transition-timing);
  
  &--expanded {
    transform: rotate(var(--sidebar-chevron-rotation));
  }
}

// Responsive
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    
    &--visible {
      transform: translateX(0);
    }
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar__submenu,
  .sidebar__chevron {
    transition: none;
  }
}
```

---

## Escalabilidad

### Extensibilidad del Menu

```typescript
// Agregar nuevos tipos de menu items sin modificar codigo existente
export type MenuItemType = 'link' | 'action' | 'divider' | 'header';

export interface BaseMenuItem {
  id: string;
  type: MenuItemType;
}

export interface LinkMenuItem extends BaseMenuItem {
  type: 'link';
  icon: string;
  label: string;
  route: string;
  children?: LinkMenuItem[];
}

export interface ActionMenuItem extends BaseMenuItem {
  type: 'action';
  icon: string;
  label: string;
  action: () => void;
}

export interface DividerMenuItem extends BaseMenuItem {
  type: 'divider';
}

export type MenuItem = LinkMenuItem | ActionMenuItem | DividerMenuItem;
```

### Permisos y Roles (Preparacion Futura)

```typescript
// Filtrar menus por permisos del usuario
filterByPermissions(items: MenuItem[], userPermissions: string[]): MenuItem[] {
  return items.filter(item => {
    if (!item.permissions) return true;
    return item.permissions.some(p => userPermissions.includes(p));
  });
}
```

### Menus Dinamicos (API)

```typescript
// Preparado para cargar menus desde API
loadMenuFromApi(): Observable<MenuItem[]> {
  return this.http.get<MenuItem[]>('/api/menu')
    .pipe(
      map(items => this.filterByPermissions(items, this.authService.permissions)),
      catchError(() => of(DEFAULT_MENU_ITEMS))
    );
}
```

---

## Testing

### Unit Tests Requeridos

| Test | Descripcion |
|------|-------------|
| toggleMenu() | Verifica que expande/colapsa correctamente |
| filterMenuItems() | Verifica filtrado por busqueda |
| persistencia | Verifica guardado/carga de localStorage |
| isExpanded() | Verifica estado de expansion |

### E2E Tests Sugeridos

| Test | Descripcion |
|------|-------------|
| Navegacion | Click en menu navega correctamente |
| Expand/Collapse | Click en padre expande submenu |
| Busqueda | Escribir filtra menus correctamente |
| Mobile | Sidebar se oculta/muestra en mobile |

---

**Estado:** Pendiente de implementacion
**Fecha actualizacion:** 04 Feb 2026
**Version:** 1.1
