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
| `.btn-icon` | `_components.scss` | Botón compacto solo ícono para acciones en tabla |

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

### 3.2 Tabla con Scroll Vertical (para tablas con muchos registros visibles)

Cuando la tabla necesita scroll vertical (ej: auditoría, logs), envolver la `<table>` en `.table-scroll`. Esto constraña la altura a `--table-scroll-max-height` (60vh) y hace el `thead` sticky.

```html
<div class="table-container">
  <div class="table-scroll">
    <table class="table">
      <thead>...</thead>
      <tbody>...</tbody>
    </table>
  </div>

  <!-- El footer queda FUERA del scroll, siempre visible -->
  <div class="table-footer">...</div>
</div>
```

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
```html
<td class="actions-column">
  <div class="action-buttons">
    <button class="btn btn-sm btn-outline" [routerLink]="['/items', item.id]">
      <i class="fa-solid fa-eye"></i> Ver
    </button>
    <button class="btn btn-sm btn-outline" [routerLink]="['/items', item.id, 'edit']">
      <i class="fa-solid fa-pen"></i> Editar
    </button>
    <button class="btn btn-sm btn-outline btn-danger" (click)="deleteItem(item)">
      <i class="fa-solid fa-trash"></i> Eliminar
    </button>
  </div>
</td>
```

Para acciones compactas (solo ícono): usar `btn-icon` + variantes:
```html
<td class="actions-cell">
  <button class="btn-icon btn-icon-print" title="Imprimir" (click)="print(item)">
    <i class="fa-solid fa-print"></i>
  </button>
  <button class="btn-icon btn-icon-email" title="Enviar por email" (click)="email(item)">
    <i class="fa-solid fa-envelope"></i>
  </button>
  <button class="btn-icon btn-icon-edit" title="Editar" (click)="edit(item)">
    <i class="fa-solid fa-pen"></i>
  </button>
  <button class="btn-icon btn-icon-view" title="Ver" (click)="view(item)">
    <i class="fa-solid fa-eye"></i>
  </button>
  <button class="btn-icon btn-icon-delete" title="Eliminar" (click)="delete(item)">
    <i class="fa-solid fa-trash"></i>
  </button>
</td>
```

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
| **Sin resultados** (filtros) | `fa-filter-circle-xmark` | "Sin resultados" | "No se encontraron {entidad} con los filtros aplicados" | ✅ Botón "Nueva/o {Entidad}" (donde aplica) |
| **Error** | `fa-exclamation-triangle` | (opcional) "Error al cargar" | `{{ error() }}` | ✅ Botón "Reintentar" |

> **Nota**: Entidades dependientes (pagos, notas de consulta, alertas de stock) **no** incluyen CTA en el estado vacío ni en sin resultados, ya que se generan desde otro módulo.

### HTML estándar

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
    <a routerLink="/{entity}/new" class="btn btn-primary">
      <i class="fa-solid fa-plus"></i>
      {Nuevo/Nueva} {Entidad}
    </a>
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
- Usar `.table-scroll` cuando la tabla necesita scroll vertical fijo

### ❌ NO hacer
- ❌ Crear clases custom como `data-table`, `report-table`, `custom-table`
- ❌ Redefinir `.table th`, `.table td` en el SCSS del componente
- ❌ Usar valores hardcodeados (`0.8rem`, `#333`, `12px`)
- ❌ Usar variables inexistentes (`--space-lg`, `--bg-card`, `--border-color`, `--primary-rgb`)
- ❌ Definir `.loading-state`, `.error-state` custom por componente (usar globales)
- ❌ Encadenar estados con `@else if` (usar `@if` independientes)
- ❌ Poner `pageSize > 15` en listas CRUD
- ❌ Omitir el estado de error con botón "Reintentar"

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
    (.table-scroll)                    ← opcional
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
            .actions-column > .action-buttons > .btn.btn-sm.btn-outline
    .table-footer
      .pagination-info > strong
      .pagination-controls > .btn-page (.active)
```

---

## 11. Componentes Que Siguen Este Patrón

### Listas CRUD (con paginación)

| Componente | `pageSize` | Scroll | Acciones |
|------------|-----------|--------|----------|
| `patient-list` | 10 | No | Ver, Editar, Toggle, Eliminar |
| `service-list` | 10 | No | Editar, Eliminar |
| `treatment-list` | 10 | No | Ver, Editar |
| `treatment-plan-list` | 10 | No | Ver |
| `prescription-list` | 10 | No | Ver Detalle (btn-icon) |
| `consultation-note-list` | 10 | No | Ver |
| `user-list` | 10 | No | Ver, Editar, Eliminar |
| `invoice-list` | 10 | No | Ver |
| `payment-list` | 15 | No | Ver Factura |
| `appointment-list` | — | No | Ver, Editar |
| `audit-log-list` | 15 | Sí (.table-scroll) | Expandir detalle |

### Listas de Inventario (con paginación)

| Componente | `pageSize` | Scroll | Acciones |
|------------|-----------|--------|----------|
| `category-list` | 10 | No | Editar, Eliminar |
| `product-list` | 10 | No | Ver, Editar |
| `supplier-list` | 10 | No | Ver, Editar |
| `purchase-order-list` | 10 | No | Ver |
| `stock-alerts` | 10 | No | Ajustar Stock |

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

*Última actualización: Febrero 2026*
