# TABLE_BASE_PATTERN — Estándar de Tablas

> Guía definitiva para implementar tablas en SmartDentalCloud.
> Todas las tablas del proyecto **deben** seguir este patrón para garantizar consistencia visual, mantenibilidad y escalabilidad.

---

## 1. Arquitectura de Clases Globales

Todas las clases base viven en `src/styles/_components.scss`. **No redefinir** estas clases en componentes individuales.

| Clase | Archivo | Propósito |
|-------|---------|-----------|
| `.table-container` | `_components.scss` | Wrapper exterior: fondo, borde, radio, sombra |
| `.table` | `_components.scss` | La tabla HTML: `width: 100%`, estilos de `thead`, `tbody`, hover, bordes |
| `.table-scroll` | `_components.scss` | Wrapper scroll vertical con `thead` sticky (opcional) |
| `.table-footer` | `_components.scss` | Footer: paginación info + controles |
| `.pagination-info` | `_components.scss` | Texto "Mostrando X - Y de Z" |
| `.pagination-controls` | `_components.scss` | Contenedor de botones de página |
| `.btn-page` | `_components.scss` | Botón individual de paginación |
| `.info-cell` | `_components.scss` | Celda compuesta: avatar + nombre + subtítulo |
| `.avatar` | `_components.scss` | Círculo con ícono (40×40) |
| `.badge` | `_components.scss` | Etiqueta de estado (success, error, warning, info, neutral) |
| `.btn-icon` | `_components.scss` | Botón compacto 32×32 con borde, solo ícono + tooltip para acciones en tabla |

---

## 2. Variables CSS Utilizadas

Todas las variables provienen de `src/styles/_variables.scss`.

### Estructura y Espaciado
```
--spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-xl
--radius-sm, --radius-md, --radius-lg, --radius-full
--shadow-sm
```

### Colores de Superficie y Borde
```
--surface-primary      → Fondo de tabla y celdas
--surface-secondary    → Fondo hover de filas
--surface-tertiary     → Fondo de thead y footer
--border-primary       → Borde exterior y entre filas
--border-medium        → Borde inferior de thead (2px)
```

### Tipografía
```
--font-size-xs         → Headers de tabla (uppercase)
--font-size-sm         → Contenido de celdas, paginación
--font-weight-medium   → Texto regular enfatizado
--font-weight-semibold → Headers de tabla, montos
--font-weight-bold     → Valores KPI
```

### Colores de Texto
```
--text-primary         → Contenido principal de celdas
--text-secondary       → Headers de tabla, info secundaria
--text-tertiary        → Subtítulos, labels
--text-muted           → Placeholders, datos vacíos
```

### Colores Semánticos (para badges y estados)
```
--primary-50/500/600   → Estado primario
--success-50/500/600   → Activo, completado, pagado
--warning-50/500/600   → Atención, pendiente
--error-50/500/600     → Error, cancelado, vencido
--info-50/500/600      → Información
--neutral-500          → Inactivo, sin datos
```

### Scroll
```
--table-scroll-max-height: 60vh   → Altura máxima para tablas scrolleables
```

### Transiciones
```
--transition-fast      → Hover de filas
--transition-base      → Hover de botones de paginación
```

---

## 3. Estructura HTML Estándar

### 3.1 Tabla Básica con Paginación (patrón principal)

```html
<!-- Table -->
@if (!loading() && !error() && items().length > 0) {
  <div class="table-container">
    <table class="table">
      <thead>
        <tr>
          <th>Columna A</th>
          <th>Columna B</th>
          <th>Columna C</th>
          <th class="actions-column">Acciones</th>
        </tr>
      </thead>
      <tbody>
        @for (item of paginatedItems(); track item.id) {
          <tr>
            <td>{{ item.columnA }}</td>
            <td>{{ item.columnB }}</td>
            <td>{{ item.columnC }}</td>
            <td class="actions-column">
              <div class="action-buttons">
                <button class="btn btn-sm btn-outline" [routerLink]="['/items', item.id]">
                  <i class="fa-solid fa-eye"></i> Ver
                </button>
              </div>
            </td>
          </tr>
        }
      </tbody>
    </table>

    <!-- Table Footer with Pagination -->
    <div class="table-footer">
      <span class="pagination-info">
        Mostrando
        <strong>{{ (currentPage() - 1) * pageSize() + 1 }}</strong> -
        <strong>{{ currentPage() * pageSize() > totalItems() ? totalItems() : currentPage() * pageSize() }}</strong>
        de <strong>{{ totalItems() }}</strong> registros
      </span>

      @if (totalPages() > 1) {
        <div class="pagination-controls">
          <button class="btn-page" [disabled]="currentPage() === 1" (click)="onPageChange(1)">
            <i class="fa-solid fa-angles-left"></i>
          </button>
          <button class="btn-page" [disabled]="currentPage() === 1" (click)="onPageChange(currentPage() - 1)">
            <i class="fa-solid fa-chevron-left"></i>
          </button>

          @for (page of getPaginationPages(); track page) {
            <button class="btn-page" [class.active]="page === currentPage()" (click)="onPageChange(page)">
              {{ page }}
            </button>
          }

          <button class="btn-page" [disabled]="currentPage() === totalPages()" (click)="onPageChange(currentPage() + 1)">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
          <button class="btn-page" [disabled]="currentPage() === totalPages()" (click)="onPageChange(totalPages())">
            <i class="fa-solid fa-angles-right"></i>
          </button>
        </div>
      }
    </div>
  </div>
}
```

### 3.2 Tabla con Scroll Vertical — **OBLIGATORIO en todas las listas CRUD**

> ⚠️ **REGLA OBLIGATORIA:** Toda lista CRUD con paginación **debe** envolver la `<table>` en `<div class="table-scroll">`. Esto garantiza que todas las páginas tengan la **misma altura máxima sincronizada** (`--table-scroll-max-height: 60vh`) y el `thead` sticky al hacer scroll. Sin este wrapper, la tabla crece ilimitadamente rompiendo la consistencia visual entre páginas.

El footer de paginación queda **fuera** del `.table-scroll` para que siempre sea visible.

```html
<div class="table-container">
  <div class="table-scroll">           <!-- ← SIEMPRE presente en listas CRUD -->
    <table class="table">
      <thead>...</thead>
      <tbody>...</tbody>
    </table>
  </div>

  <!-- El footer queda FUERA del scroll, siempre visible -->
  <div class="table-footer">...</div>
</div>
```

**Solo omitir** `.table-scroll` en tablas simples sin paginación (dentro de reportes, details, dashboard) — ver §3.3.

### 3.3 Tabla Simple sin Paginación (para secciones internas de reportes)

```html
<div class="table-container">
  <table class="table">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>

  <div class="table-footer centered">
    <span class="results-count">
      <strong>{{ items.length }}</strong> registros encontrados
    </span>
  </div>
</div>
```

---

## 4. Tipos de Celdas Estándar

### 4.1 Celda con Avatar + Info (nombre principal)
```html
<td>
  <div class="info-cell">
    <div class="avatar avatar-primary">
      <i class="fa-solid fa-user"></i>
    </div>
    <div class="info-content">
      <div class="info-title">{{ item.name }}</div>
      <div class="info-subtitle">#{{ item.id.substring(0, 8) }}</div>
    </div>
  </div>
</td>
```

Variantes de avatar: `avatar-primary`, `avatar-success`, `avatar-info`, `avatar-warning`.

### 4.2 Celda de Fecha
```html
<td class="date-cell">{{ formatDate(item.createdAt) }}</td>
```
```scss
// En component.scss
.date-cell {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}
```

### 4.3 Celda de Monto/Moneda
```html
<td class="amount-cell">{{ formatCurrency(item.amount) }}</td>
```
```scss
.amount-cell {
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}
```

### 4.4 Celda con Badge de Estado
```html
<td>
  <span class="badge badge-success">
    <i class="fa-solid fa-circle-check"></i>
    Activo
  </span>
</td>
```

Variantes: `badge-success`, `badge-error`, `badge-warning`, `badge-info`, `badge-neutral`, `badge-inactive`.

### 4.5 Celda con Badge de Ícono (indicadores)
```html
<td>
  <div class="indicator-badges">
    <span class="badge badge-icon badge-warning" title="Requiere atención">
      <i class="fa-solid fa-exclamation-triangle"></i>
    </span>
  </div>
</td>
```

### 4.6 Celda Vacía / Sin Datos
```html
<td><span class="text-muted">—</span></td>
```

### 4.7 Celda de Acciones

**Estándar único:** Todas las tablas usan `btn-icon` (32×32, borde, solo ícono) + variantes semánticas de hover + `title` tooltip. **NO** usar `btn btn-sm btn-outline` con texto en tablas.

```html
<td class="actions-cell">
  <button class="btn-icon btn-icon-print" title="Imprimir" (click)="print(item)">
    <i class="fa-solid fa-print"></i>
  </button>
  <button class="btn-icon btn-icon-email" title="Enviar por email" (click)="email(item)">
    <i class="fa-solid fa-envelope"></i>
  </button>
  <button class="btn-icon btn-icon-view" title="Ver detalle" [routerLink]="['/items', item.id]">
    <i class="fa-solid fa-eye"></i>
  </button>
  <button class="btn-icon btn-icon-edit" title="Editar" [routerLink]="['/items', item.id, 'edit']">
    <i class="fa-solid fa-pen"></i>
  </button>
  <button class="btn-icon btn-icon-danger" title="Eliminar" (click)="delete(item)">
    <i class="fa-solid fa-trash"></i>
  </button>
</td>
```

#### Variantes semánticas disponibles

| Variante | Hover color | Uso |
|----------|-------------|-----|
| `btn-icon-view` | Info (azul) | Ver detalle |
| `btn-icon-edit` | Primary (azul) | Editar |
| `btn-icon-delete` | Error (rojo) | Eliminar |
| `btn-icon-danger` | Error (rojo) + borde | Eliminar, cancelar (con color base rojo) |
| `btn-icon-success` | Success (verde) + borde | Completar, agendar, recibir (con color base verde) |
| `btn-icon-warning` | Warning (amarillo) + borde | Cancelar cita (con color base amarillo) |
| `btn-icon-print` | Neutral (gris) | Imprimir/PDF |
| `btn-icon-email` | Primary (azul) | Enviar por email |
| `btn-icon-notes` | Info (azul) | Notas clínicas |
| `btn-icon-toggle-on` | Success (verde) | Desactivar (estado activo) |
| `btn-icon-toggle-off` | Error (rojo) | Activar (estado inactivo) |

#### Reglas de acciones en tabla

- **SIEMPRE** usar `<td class="actions-cell">` (NO `actions-column` con `<div class="action-buttons">`)
- **SIEMPRE** usar `btn-icon` + variante semántica
- **SIEMPRE** incluir `title="..."` como tooltip
- **NUNCA** usar `btn btn-sm btn-outline` con texto en tablas
- **Orden:** Print → Email → View → Edit → Toggle → Delete (de izquierda a derecha)

### 4.8 Filas Inactivas
```html
<tr [class.row-inactive]="!item.isActive">
```
La clase `row-inactive` aplica `opacity: 0.6` a toda la fila.

---

## 5. Paginación — Lógica TypeScript

### Señales y Computados Estándar

```typescript
// Señales
currentPage = signal(1);
pageSize = signal(10);        // Estándar: 10 | Alternativa: 15
totalItems = signal(0);
totalPages = signal(0);

// Computado para página actual
paginatedItems = computed(() => {
  const start = (this.currentPage() - 1) * this.pageSize();
  return this.filteredItems().slice(start, start + this.pageSize());
});

// Computado para total de páginas
totalPages = computed(() =>
  Math.ceil(this.filteredItems().length / this.pageSize()) || 1
);
```

### Método de Cambio de Página

```typescript
onPageChange(page: number): void {
  if (page >= 1 && page <= this.totalPages()) {
    this.currentPage.set(page);
  }
}
```

### Generación de Páginas Visibles

Limitar a 5 botones visibles para mantener la UI limpia:

```typescript
getPaginationPages(): number[] {
  const total = this.totalPages();
  const current = this.currentPage();
  const maxVisible = 5;
  const pages: number[] = [];
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  const end = Math.min(total, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}
```

### Page Sizes Establecidos

| Contexto | `pageSize` | Ejemplo |
|----------|-----------|---------|
| Listas CRUD principales | `10` | Pacientes, Servicios, Tratamientos |
| Listas con celdas compactas | `15` | Pagos, Auditoría |
| Tablas dentro de reportes | Sin paginación | Top Services, Inventory por Categoría |

---

## 6. Estados de la Tabla

Siempre implementar los **4 estados** antes de la tabla, **nunca** anidar con `@else if`:

### Diseño visual del `.empty-state` (global en `_components.scss`)

- **Layout**: `display: flex` centrado vertical y horizontal
- **Ícono**: Dentro de un **círculo decorativo** (56×56px, fondo `--surface-tertiary`, `border-radius: full`)
- **Borde**: `1px solid var(--border-primary)` para separación visual
- **Tipografía**: `h3` en `font-size-lg`, `p` en `text-tertiary` con `max-width: 360px`
- **Botón CTA**: `.btn-primary` se renderiza automáticamente como **outline** (fondo transparente, borde azul) dentro de `.empty-state`
- **Variante compacta**: `.empty-state-sm` para usar dentro de cards/secciones con menos padding

### Redacción estandarizada

| Estado | Ícono | Título | Descripción | CTA |
|--------|-------|--------|-------------|-----|
| **Vacío** (sin datos) | Ícono de la entidad (`fa-{entity}`) | "No hay {entidad plural}" | "Comienza creando {tu primer/la primera} {entidad}" | ✅ Botón "Nueva/o {Entidad}" |
| **Sin resultados** (filtros) | `fa-filter-circle-xmark` | "Sin resultados" | "No se encontraron {entidad} con los filtros aplicados" | ❌ Sin CTA (solo mensaje) |
| **Error** | `fa-exclamation-triangle` | (opcional) "Error al cargar" | `{{ error() }}` | ✅ Botón "Reintentar" (`btn-secondary` + `fa-arrows-rotate`) |

> **Notas importantes:**
> - Entidades dependientes (pagos, notas de consulta, alertas de stock) **no** incluyen CTA en el estado vacío ni en sin resultados, ya que se generan desde otro módulo.
> - **NUNCA** usar `fa-exclamation-circle` — siempre `fa-exclamation-triangle` para errores.
> - **NUNCA** usar `fa-refresh` o `fa-rotate-right` — siempre `fa-arrows-rotate` para reintentar.
> - El botón de retry usa `btn-secondary` (NEVER `btn-outline`).

### HTML estándar (estados independientes)

**REGLA CRÍTICA:** Usar bloques `@if` **INDEPENDIENTES**. **NUNCA** anidar con `@else if`.

```html
<!-- Loading State -->
@if (loading()) {
  <div class="loading-container">
    <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
    <p>Cargando registros...</p>
  </div>
}

<!-- Error State -->
@if (error()) {
  <div class="empty-state">
    <i class="fa-solid fa-exclamation-triangle"></i>
    <p>{{ error() }}</p>
    <button class="btn btn-secondary" (click)="loadData()">
      <i class="fa-solid fa-arrows-rotate"></i>
      Reintentar
    </button>
  </div>
}

<!-- Empty State (sin datos) -->
@if (!loading() && !error() && items().length === 0) {
  <div class="empty-state">
    <i class="fa-solid fa-{entity-icon}"></i>
    <h3>No hay {entidad plural}</h3>
    <p>Comienza creando {tu primer/la primera} {entidad}</p>
    <a routerLink="/{entity}/new" class="btn btn-primary">
      <i class="fa-solid fa-plus"></i>
      {Nuevo/Nueva} {Entidad}
    </a>
  </div>
}

<!-- No Results State (filtros sin coincidencias) -->
@if (!loading() && !error() && filteredItems().length === 0 && items().length > 0) {
  <div class="empty-state">
    <i class="fa-solid fa-filter-circle-xmark"></i>
    <h3>Sin resultados</h3>
    <p>No se encontraron {entidad plural} con los filtros aplicados</p>
  </div>
}

<!-- Table (solo si hay datos) -->
@if (!loading() && !error() && filteredItems().length > 0) {
  <div class="table-container">...</div>
}
```

### Overrides de color de ícono por contexto

Cuando el empty state necesita un ícono de color diferente al neutro por defecto, sobreescribir en el SCSS del componente:

```scss
// Ejemplo: ícono verde para estado positivo (stock-alerts sin alertas)
.empty-state > i {
  color: var(--success-500);
  background: var(--success-50);
}

// Ejemplo: ícono rojo para estado de error (auth)
.empty-state > i {
  color: var(--error-500);
  background: var(--error-50);
}
```

---

## 7. Estilos del Componente (SCSS)

Cada componente que contiene una tabla **solo** define estilos específicos de sus celdas. Las clases globales NO se redefinen.

### Plantilla de SCSS para un List Component

```scss
// ============================================
// {Feature}ListComponent - Estilos Específicos
// Container: usa .page-container.container-wide de _layout.scss
// Header: usa PageHeaderComponent compartido
// Filters: usa .filters-section de _components.scss
// Loading: usa .loading-container de _components.scss
// Empty: usa .empty-state de _components.scss
// Table: usa .table-container, .table de _components.scss
// Pagination: usa .table-footer, .btn-page de _components.scss
// Botones: usa clases globales .btn de _components.scss
// ============================================

// ===== Table Cell Content =====

.date-cell {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.amount-cell {
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.text-muted {
  color: var(--text-muted);
}

.actions-column {
  .action-buttons {
    display: flex;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}

// ===== Responsive =====

@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;

    .search-box {
      min-width: 100%;
    }
  }

  .table-container {
    overflow-x: auto;
  }
}
```

---

## 8. Estructura Completa de Página con Tabla

Orden de elementos dentro del `page-container`:

```
1. <app-page-header>           ← Título, subtítulo, breadcrumbs, [actions]
2. <div class="page-actions">  ← Botones de acción principales (opcional)
3. <div class="metrics-grid">  ← KPIs / métricas (opcional)
4. <div class="filters-section"> ← Buscador + filtros
5. Loading / Error / Empty     ← Estados (solo uno visible a la vez)
6. <div class="table-container"> ← Tabla con paginación
```

---

## 9. Reglas y Restricciones

### ✅ SÍ hacer
- Usar **siempre** `.table-container` > `.table` como wrapper y tabla
- Usar `.table-footer` con `.pagination-info` + `.pagination-controls` para paginación
- Usar `@for (item of paginatedItems(); track item.id)` en el tbody
- Usar `.info-cell` + `.avatar` para celdas con nombre/avatar
- Usar `.badge` + variantes para estados
- Usar `var(--spacing-*)`, `var(--font-size-*)`, etc. para todo el styling
- Usar `pageSize = 10` o `15` según densidad de contenido
- Usar **siempre** `.table-container` > `div.table-scroll` > `.table` en **todas las listas CRUD** con paginación (garantiza altura máxima 60vh sincronizada entre páginas)

### ❌ NO hacer
- ❌ Crear clases custom como `data-table`, `report-table`, `custom-table`
- ❌ Redefinir `.table th`, `.table td` en el SCSS del componente
- ❌ Usar valores hardcodeados (`0.8rem`, `#333`, `12px`)
- ❌ Usar variables inexistentes (`--space-lg`, `--bg-card`, `--border-color`, `--primary-rgb`)
- ❌ Definir `.loading-state`, `.error-state` custom por componente (usar globales)
- ❌ Encadenar estados con `@else if` (usar `@if` independientes)
- ❌ Poner `pageSize > 15` en listas CRUD
- ❌ Omitir el estado de error con botón "Reintentar"
- ❌ Omitir `div.table-scroll` en listas CRUD (provoca altura inconsistente respecto al resto de páginas)

---

## 10. Referencia Rápida de Clases

```
.page-container.container-wide
  app-page-header
  .filters-section
    .search-box > .search-icon + .search-input
    .filter-actions > .filter-select | .btn
  .loading-container
  .empty-state
  .table-container
    div.table-scroll                   ← OBLIGATORIO en listas CRUD
      .table
        thead > tr > th (.actions-column)
        tbody > tr (.row-inactive)
          td
            .info-cell > .avatar + .info-content > .info-title + .info-subtitle
            .badge (.badge-success | .badge-error | .badge-warning | .badge-info | .badge-neutral)
            .badge-icon
            .date-cell
            .amount-cell
            .text-muted
            .actions-cell > .btn-icon (.btn-icon-view | .btn-icon-edit | .btn-icon-danger | ...)
    .table-footer
      .pagination-info > strong
      .pagination-controls > .btn-page (.active)
```

---

## 12. Ordenamiento de Columnas (Sort)

### 12.1 Clase Global

La clase `.th-sortable` vive en `src/styles/_components.scss`. **No redefinir** en componentes individuales.

```
.th-sortable        → cursor pointer, hover (background + color primary), user-select none
.th-sortable .sort-icon → icono fa-sort, alineación vertical, color --text-muted; en hover → --primary-500
```

> **Eliminar** cualquier versión local (`.sortable`, `.sortable-th`, `.sortable-header`) — todas migran a `.th-sortable`.

---

### 12.2 Señales TypeScript Estándar

```typescript
// Señales de ordenamiento — agregar junto a las señales de filtro/paginación
sortColumn   = signal<string>('defaultField');   // columna activa — usar null si no hay default
sortDirection = signal<'asc' | 'desc'>('asc');   // dirección activa
```

**Reglas de valor inicial:**
- Si la tabla debe cargarse pre-ordenada (ej. pacientes por apellido): `signal<string>('lastName')`
- Si no hay orden inicial (usuario decide): `signal<string | null>(null)`
- Fechas en orden descendente (más reciente primero): `sortDirection = signal<'asc' | 'desc'>('desc')`

---

### 12.3 Métodos TypeScript Estándar

```typescript
/** Cambia columna o invierte dirección; reinicia página a 1. */
onSort(column: string): void {
  if (this.sortColumn() === column) {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  } else {
    this.sortColumn.set(column);
    this.sortDirection.set('asc');
  }
  this.currentPage.set(1);
  // Client-side: llamar applyFilters()  |  Server-side: llamar loadData()
}

/** Retorna la clase de ícono de Font Awesome para la columna dada. */
getSortIcon(column: string): string {
  if (this.sortColumn() !== column) return 'fa-sort';
  return this.sortDirection() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
}
```

**Nombres canónicos:** `onSort` y `getSortIcon` — **nunca** `onSortChange`, `sortBy`, `changeSort` u otros.

---

### 12.4 Sort Client-Side (tabla carga todos los datos de una vez)

Aplicar dentro de `applyFilters()` o `computed()`, **después** de filtrar:

```typescript
applyFilters(): void {
  let filtered = [...this.items()];

  // 1. Filtros (search, status, etc.)
  // ...

  // 2. Sort
  const col = this.sortColumn();
  const dir = this.sortDirection();
  if (col) {
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (col) {
        case 'name':   aVal = a.name?.toLowerCase() ?? '';   bVal = b.name?.toLowerCase() ?? '';   break;
        case 'date':   aVal = new Date(a.date).getTime();    bVal = new Date(b.date).getTime();    break;
        case 'amount': aVal = a.amount ?? 0;                 bVal = b.amount ?? 0;                 break;
        case 'status': aVal = a.status;                      bVal = b.status;                      break;
        default: return 0;
      }
      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ?  1 : -1;
      return 0;
    });
  }

  this.filteredItems.set(filtered);
  this.totalItems.set(filtered.length);
  this.totalPages.set(Math.ceil(filtered.length / this.pageSize()) || 1);
  this.currentPage.set(1);
}
```

---

### 12.5 Sort Server-Side (tabla pagina desde el backend)

Pasar `sortColumn()` y `sortDirection()` directamente al servicio:

```typescript
loadData(): void {
  this.loading.set(true);
  this.service.getAll(
    this.currentPage(),
    this.pageSize(),
    this.searchTerm() || undefined,
    this.sortColumn(),
    this.sortDirection()
  ).subscribe({ ... });
}
```

El método `onSort()` llama `this.currentPage.set(1)` y luego `this.loadData()`.

---

### 12.6 HTML — Patrón de `<th>` Ordenable

```html
<th class="th-sortable" (click)="onSort('fieldName')">
  Etiqueta <i class="fa-solid sort-icon" [ngClass]="getSortIcon('fieldName')"></i>
</th>
```

- **Una** clase: `th-sortable` — no agregar `style="cursor:pointer"` ni clases adicionales.
- El ícono usa `class="fa-solid sort-icon"` (clase fija) + `[ngClass]="getSortIcon(...)"` (clase dinámica).
- **No** usar `{{ getSortIcon() }}` por interpolación de string — siempre `[ngClass]`.
- Columnas no-ordenables (Acciones, indicadores): `<th class="actions-column">` sin `th-sortable`.

---

### 12.7 Columnas Recomendadas por Entidad

| Tabla | Columnas ordenables | Default | Tipo |
|-------|---------------------|---------|------|
| `patient-list` | `lastName`, `age`, `createdAt` | `lastName asc` | Server-side |
| `treatment-list` | `patient`, `service`, `date`, `cost`, `status` | ninguno | Client-side |
| `payment-list` | `paidAt`, `patientName`, `amount`, `paymentMethod` | `paidAt desc` | Client-side |
| `product-list` | `code`, `name`, `categoryName`, `currentStock`, `reorderPoint`, `unitCost`, `isActive` | ninguno | Client-side |
| `service-list` | `name`, `category`, `price`, `status` | `name asc` | Client-side |
| `treatment-plan-list` | `patient`, `startDate`, `status`, `totalCost` | `startDate desc` | Client-side |
| `prescription-list` | `patient`, `issuedDate`, `status` | `issuedDate desc` | Client-side |
| `user-list` | `lastName`, `role`, `status` | `lastName asc` | Client-side |
| `invoice-list` | `patient`, `issueDate`, `total`, `status` | `issueDate desc` | Client-side |
| `category-list` | `name`, `status` | `name asc` | Client-side |
| `supplier-list` | `name`, `status` | `name asc` | Client-side |
| `purchase-order-list` | `supplier`, `orderDate`, `total`, `status` | `orderDate desc` | Client-side |

---

### 12.8 Reglas

- ✅ Usar siempre `.th-sortable` + `onSort()` + `getSortIcon()` (nombres exactos)
- ✅ El ícono siempre tiene `class="fa-solid sort-icon"` + `[ngClass]="getSortIcon('col')"`
- ✅ `onSort()` siempre reinicia `currentPage` a 1
- ❌ No usar `.sortable`, `.sortable-th`, `.sortable-header` — son legacy
- ❌ No usar `onSortChange()`, `sortBy()` — el nombre estándar es `onSort()`
- ❌ No agregar `style="cursor:pointer"` inline — `.th-sortable` ya lo incluye
- ❌ No crear `SortField` type para columnas simples — usar `string` directamente

---

## 11. Componentes Que Siguen Este Patrón

### Listas CRUD (con paginación)

| Componente | `pageSize` | Scroll | Sort | Columnas Ordenables |
|------------|-----------|--------|------|---------------------|
| `patient-list` | 10 | Sí | ✅ Server-side | `lastName` (default), `age`, `createdAt` |
| `service-list` | 10 | Sí | ✅ Client-side | `name` (default), `category`, `price`, `status` |
| `treatment-list` | 10 | Sí | ✅ Client-side | `patient`, `service`, `date`, `cost`, `status` |
| `treatment-plan-list` | 10 | Sí | ✅ Client-side | `patient`, `startDate` (default desc), `status`, `totalCost` |
| `prescription-list` | 10 | Sí | ✅ Client-side | `issuedDate` (default desc), `patient`, `status` |
| `consultation-note-list` | 10 | Sí | — | — |
| `user-list` | 10 | Sí | ✅ Client-side | `name` (default), `status` |
| `invoice-list` | 10 | Sí | ✅ Client-side | `patient`, `createdAt` (default desc), `total`, `status` |
| `payment-list` | 15 | Sí | ✅ Client-side | `paidAt` (default desc), `patientName`, `amount`, `paymentMethod` |
| `appointment-list` | — | Sí | — | — |
| `audit-log-list` | 15 | Sí | — | — |

### Listas de Inventario (con paginación)

| Componente | `pageSize` | Scroll | Sort | Columnas Ordenables |
|------------|-----------|--------|------|---------------------|
| `category-list` | 10 | Sí | ✅ Client-side | `name` (default), `status` |
| `product-list` | 10 | Sí | ✅ Client-side | `code`, `name`, `categoryName`, `currentStock`, `reorderPoint`, `unitCost`, `isActive` |
| `supplier-list` | 10 | Sí | ✅ Client-side | `name` (default), `status` |
| `purchase-order-list` | 10 | Sí | ✅ Client-side | `supplier`, `orderDate` (default desc), `total`, `status` |
| `stock-alerts` | 10 | Sí | — | — |

### Tablas en Detalle (sin paginación)

| Componente | Contexto |
|------------|----------|
| `invoice-detail` | Items de la factura |
| `purchase-order-detail` | Items de la orden |
| `cfdi-list` | Lista de CFDIs dentro de facturación |

### Tablas en Reportes (sin paginación)

| Componente | Contexto |
|------------|----------|
| `accounts-receivable` | Cuentas por cobrar |
| `top-services` | Ranking de servicios |
| `dentist-productivity` | Productividad por dentista |
| `appointment-occupancy` | Ocupación por dentista |
| `inventory-report` | Stock bajo + Stock por categoría (2 tablas) |
| `treatments-report` | Top servicios dentro del reporte |

### Tablas en Dashboard (sin paginación)

| Componente | Contexto |
|------------|----------|
| `dashboard` | Próximas citas + Pagos recientes (2 tablas) |

---

*Última actualización: Marzo 2026*
