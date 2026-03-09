# Patrón de Dashboard - SmartDentalCloud

Define el patrón estándar para dashboards en la aplicación. Estructura consistente, sin redundancias, con separación clara entre acciones y contenido.

---

## Decisiones de Diseño

### D1 — Acciones primarias van en `page-header actions`
Cada dashboard de módulo tiene **máximo 2-3 botones** en el header:
- **Botón de creación** del módulo (ej: `+ Nueva Cita`) con `btn btn-outline btn-success`
- **Botón "Ver Todos/Todas"** para ir al listado con `btn btn-outline`
- **Filtro de sucursal** (`app-location-autocomplete`) donde aplique

### D2 — NO hay sección "Acciones Rápidas" en dashboards de módulo
Las acciones de creación están en el `page-header`. Los links de navegación están en el sidebar. Solo el **Dashboard General** conserva "Acciones Rápidas" como hub central.

### D3 — KPIs usan `.kpi-grid` / `.kpi-card` (BEM)
Todos los indicadores usan el componente unificado `.kpi-card` con sparklines. Ver `docs/KPI_CARD_GUIDELINES.md`.

### D5 — Date Range Picker en dashboards con analíticas históricas
Dashboards que muestran datos analíticos o históricos incluyen `<app-date-range-picker>` en el `page-header actions`.

**Principios:**
- Solo datos **analíticos/históricos** se filtran por rango de fecha (gráficos, distribuciones, ingresos, rankings)
- Datos **operacionales/futuros** NO se filtran (citas de hoy, próximas citas, planes pendientes, stock actual)
- Preset por defecto: `'this_month'` para dashboards operacionales, `'last_3_months'` para dashboards de análisis extendido
- El componente se coloca **después** del filtro de sucursal y **antes** de los botones de acción

**Dashboards con date range picker:**

| Dashboard | Default Preset | Secciones afectadas | Secciones NO afectadas |
|-----------|---------------|---------------------|------------------------|
| **General** | `this_month` | Ingresos, Pendiente de Cobro | Citas de Hoy, Tratamientos Activos, Planes por Aprobar, Stock |
| **Dentistas** | `this_month` | Todas las métricas y rankings | — |
| **Tratamientos** | `last_3_months` | KPIs, gráficos, listas de tratamientos | — |
| **Facturación** | `last_3_months` | KPIs, gráficos, listas de facturas | — |
| **Citas** | `this_month` | Distribución por estado, por día, pacientes frecuentes | Métricas del día, próximas citas, pendientes confirmación, actividad reciente |

**Patrón TypeScript:**
```typescript
// Signal para el rango de fechas
dateRange = signal<DateRange>(this.getDefaultDateRange());

onDateRangeChange(range: DateRange | null): void {
  if (!range) return;
  this.dateRange.set(range);
  this.loadAnalyticsData(); // Solo recargar datos afectados
}

private getDefaultDateRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1); // o -3 meses
  const pad = (n: number) => n.toString().padStart(2, '0');
  return {
    start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    end: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  };
}
```

### D4 — Grids unificados
Solo existen dos clases de grid para contenido:
- `.analytics-grid` — 2 columnas (gráficos, listas side-by-side)
- `.analytics-grid.cols-3` — 3 columnas (listas, timelines)

**Clases eliminadas:** `.bottom-grid`, `.dashboard-grid`, `.charts-grid`, `.triple-grid`, `.quick-actions-row`, `.indicators-list`

---

## Arquitectura de Estilos

```
src/styles/
├── _variables.scss      # Variables CSS (KPI, spacing, colors)
├── _components.scss     # .kpi-grid, .kpi-card (BEM), botones, alerts
└── _dashboard.scss      # .analytics-grid, .section-card, .quick-action-card, timelines

src/app/features/[modulo]/components/[modulo]-dashboard/
├── [modulo]-dashboard.ts       # Lógica
├── [modulo]-dashboard.html     # Template
└── [modulo]-dashboard.scss     # Solo estilos ESPECÍFICOS del dominio
```

| Archivo | Contenido |
|---------|----------|
| `_components.scss` | `.kpi-grid`, `.kpi-card` BEM con sparklines |
| `_dashboard.scss` | `.analytics-grid`, `.section-card`, `.quick-action-card`, timelines, badges |
| `[modulo]-dashboard.scss` | Solo estilos de dominio (ej: `.treatment-item`, `.dentist-rank`) |

---

## Layout Canónico — Dashboard de Módulo

```
┌─────────────────────────────────────────────────┐
│ page-header  [Título]     [Filtro] [+Nuevo] [📋]│
├─────────────────────────────────────────────────┤
│ alert-banner (condicional)                      │
├─────────────────────────────────────────────────┤
│ kpi-grid (indicadores KPI con sparklines)       │
├────────────────────┬────────────────────────────┤
│ analytics-grid     │ (2 cols: gráficos/stats)   │
├──────────┬─────────┴──┬─────────────────────────┤
│ col 1    │ col 2      │ col 3                   │
│ analytics-grid.cols-3 (listas/timelines)        │
└──────────┴────────────┴─────────────────────────┘
```

### HTML Canónico

```html
<div class="page-container container-wide">
  <app-page-header
    [title]="'Módulo'"
    [subtitle]="'Panel de control del módulo'"
    [icon]="'fa-icon'"
    [breadcrumbs]="breadcrumbItems">
    <div actions>
      <!-- Filtro sucursal (solo si aplica) -->
      <app-location-autocomplete ... />
      <!-- Date range picker (solo si hay analíticas históricas) -->
      <app-date-range-picker
        [showPresets]="true"
        [defaultPreset]="'this_month'"
        (rangeChange)="onDateRangeChange($event)"
      />
      <!-- Botón de creación primaria -->
      <a routerLink="/module/new" class="btn btn-outline btn-success">
        <i class="fa-solid fa-plus"></i>
        Nuevo Item
      </a>
      <!-- Botón ver listado -->
      <a routerLink="/module" class="btn btn-outline">
        <i class="fa-solid fa-list"></i>
        Ver Todos
      </a>
    </div>
  </app-page-header>

  <!-- Alert Banner (condicional) -->
  @if (alertCount() > 0) {
    <div class="alert-banner alert-banner--warning">
      <i class="fa-solid fa-exclamation-triangle"></i>
      <span>Tienes <strong>{{ alertCount() }}</strong> alertas.</span>
      <a routerLink="/module/alerts" class="btn btn--sm btn--warning">Ver Alertas</a>
    </div>
  }

  @if (loading()) {
    <div class="loading-container">
      <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
      <p>Cargando datos...</p>
    </div>
  } @else if (error()) {
    <div class="alert alert-error">
      <i class="fa-solid fa-circle-exclamation"></i>
      <span>{{ error() }}</span>
    </div>
  } @else {
    <!-- KPIs con sparklines -->
    <div class="kpi-grid">
      <a class="kpi-card kpi-card--primary" routerLink="/module">
        <div class="kpi-card__header">
          <span class="kpi-card__label">Total</span>
          <div class="kpi-card__icon"><i class="fa-solid fa-box"></i></div>
        </div>
        <div class="kpi-card__value">{{ total() }}</div>
        <div class="kpi-card__sparkline kpi-card__sparkline--up">
          <svg viewBox="0 0 200 40" preserveAspectRatio="none">
            <path class="sparkline-fill" d="M0,32 Q25,28 50,30 T100,24 T150,18 T200,12 L200,40 L0,40Z"/>
            <path class="sparkline-line" d="M0,32 Q25,28 50,30 T100,24 T150,18 T200,12"/>
          </svg>
        </div>
      </a>
      <!-- ... más KPIs -->
    </div>

    <!-- Gráficos (2 columnas) -->
    <div class="analytics-grid">
      <div class="section-card"> <!-- Gráfico 1 --> </div>
      <div class="section-card"> <!-- Gráfico 2 --> </div>
    </div>

    <!-- Listas (3 columnas) -->
    <div class="analytics-grid cols-3">
      <div class="section-card"> <!-- Lista 1 --> </div>
      <div class="section-card"> <!-- Lista 2 --> </div>
      <div class="section-card"> <!-- Lista 3 --> </div>
    </div>
  }
</div>
```

---

## Layout — Dashboard General (excepción)

El Dashboard General (`dashboard.html`) es el **hub central** y conserva "Acciones Rápidas":

```
┌─────────────────────────────────────────────────┐
│ page-header  [Dashboard]  [Filtro] [Actualizar] │
├─────────────────────────────────────────────────┤
│ alert-banner (stock bajo, condicional)          │
├─────────────────────────────────────────────────┤
│ kpi-grid (6 KPIs con sparklines + permisos)     │
├─────────────────────────────────────────────────┤
│ Acciones Rápidas (quick-actions-grid cols-3)    │
│ [Nueva Cita] [Nuevo Paciente] [Nueva Factura]   │
│ [Tratamiento] [Calendario] [Reportes]           │
├──────────┬──────────┬───────────────────────────┤
│ Próximas │ Planes   │ Alertas Inventario        │
│ Citas    │ Aprobar  │                           │
└──────────┴──────────┴───────────────────────────┘
```

**Diferencias con dashboards de módulo:**
- `page-header`: Solo Filtro sucursal + Actualizar (NO botón de creación)
- Conserva sección "Acciones Rápidas" con `quickActions` filtradas por permisos
- KPIs protegidos por `@if (permissionService.hasPermission(...))`

---

## Acciones por Dashboard

| Dashboard | `page-header actions` |
|-----------|----------------------|
| **General** | Filtro sucursal · Date Range (`this_month`) · Actualizar |
| **Citas** | Filtro sucursal · Date Range (`this_month`) · `+ Nueva Cita` · `Ver Todas` |
| **Pacientes** | `+ Nuevo Paciente` · `Ver Todos` |
| **Facturación** | Date Range (`last_3_months`) · `+ Nueva Factura` · `Ver Todas` |
| **Inventario** | Filtro sucursal · `Ver Productos` |
| **Tratamientos** | Date Range (`last_3_months`) · `+ Nuevo Tratamiento` · `Ver Todos` |
| **Planes** | `+ Nuevo Plan` · `Ver Todos` |
| **Dentistas** | Date Range (`this_month`) · `Ver Todos` · `Reporte Productividad` |

### Detalle: Dashboard de Dentistas

| Elemento | Descripción |
|----------|-------------|
| **KPIs** | 6: Total, Activos, Citas Completadas, Ingresos Generados, Tasa Completación, Prom. Ingresos/Dentista |
| **Charts** | 2: Ingresos por Dentista (horizontal bar), Citas por Dentista (vertical bar) |
| **Sections** | 3: Top por Ingresos, Top por Tratamientos, Equipo de Dentistas |
| **Alert Banner** | Dentistas sin actividad registrada este mes |
| **Analytics Service** | `DentistAnalyticsService` — compone `UsersService` + `ReportsService` |
| **Entity Links** | Nombre del dentista → `/users/:id` en rankings y equipo |

---

## Estructura TypeScript

```typescript
@Component({
  selector: 'app-module-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, ...],
  templateUrl: './module-dashboard.html',
  styleUrl: './module-dashboard.scss'
})
export class ModuleDashboardComponent implements OnInit {
  private dataService = inject(DataService);
  private logger = inject(LoggingService);

  loading = signal(true);
  error = signal<string | null>(null);

  // Datos (signals)
  totalItems = signal(0);

  // Breadcrumbs
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Módulo' }
  ];

  // NO definir quickActions — las acciones están en page-header

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.dataService.getData().subscribe({
      next: (data) => { this.totalItems.set(data.total); this.loading.set(false); },
      error: (err) => { this.error.set(getApiErrorMessage(err)); this.loading.set(false); }
    });
  }
}
```

---

## Clases CSS Disponibles

### Grids

| Clase | Descripción | Columnas |
|-------|-------------|----------|
| `.kpi-grid` | Grid responsive para KPIs | auto-fit, min 220px |
| `.analytics-grid` | Grid para gráficos/secciones | 2 columnas |
| `.analytics-grid.cols-3` | Grid de 3 columnas | 3 columnas |
| `.quick-actions-grid` | Grid de acciones (solo Dashboard General) | Configurable |
| `.quick-actions-grid.cols-3` | Variante 3 columnas | 3 columnas |

### KPIs (en `_components.scss`)

| Clase | Descripción |
|-------|-------------|
| `.kpi-card` | Tarjeta KPI base |
| `.kpi-card--primary/success/warning/error/info` | Variantes de color por tipo de métrica |
| `.kpi-card__header` | Fila label + icon |
| `.kpi-card__label` | Texto descriptivo |
| `.kpi-card__icon` | Ícono |
| `.kpi-card__value` | Valor numérico principal |
| `.kpi-card__trend` | (Opcional) Badge de tendencia debajo del valor |
| `.kpi-card__sparkline` | (Opcional) Gráfica de fondo translúcida |
| `.kpi-card__sparkline--up/down/neutral` | Dirección de tendencia de la sparkline |
| `.kpi-card__trend--up/down/neutral` | Variantes de color/ícono para la tendencia |

### Contenedores (en `_dashboard.scss`)

| Clase | Descripción |
|-------|-------------|
| `.page-container.container-wide` | Contenedor principal del dashboard |
| `.section-card` | Tarjeta contenedora de secciones (gráficos, listas, timelines) |
| `.dash-section-header` | Header estándar de sección de dashboard (título + icono + acciones/badge) |
| `.dash-section-header__title` | Título de la sección con icono |
| `.dash-section-header__badge` | Badge numérico compacto para contadores |
| `.dash-list` | Contenedor de lista de dashboard con scroll vertical |
| `.dash-item` | Item estándar de lista (leading + contenido + trailing) |

### Dashboard Sections & List Items

Estructura recomendada para secciones de listas en dashboards:

```html
<div class="section-card">
  <div class="dash-section-header">
    <h2 class="dash-section-header__title">
      <i class="fa-solid fa-icon"></i>
      Título de sección
    </h2>
    @if (items().length > 0) {
      <span class="dash-section-header__badge">{{ items().length }}</span>
    }
  </div>

  <div class="dash-list">
    @for (item of items(); track item.id) {
      <a class="dash-item" [routerLink]="['/ruta', item.id]">
        <div class="dash-item__leading"><i class="fa-solid fa-icon"></i></div>
        <div class="dash-item__content">
          <span class="dash-item__title">{{ item.title }}</span>
          <span class="dash-item__subtitle">{{ item.subtitle }}</span>
        </div>
        <div class="dash-item__trailing">
          <!-- badge / meta -->
        </div>
      </a>
    }
  </div>
</div>
```

Sub-elementos BEM principales de `.dash-item`:

- **`dash-item__leading`** — Icono, avatar o indicador de urgencia.
- **`dash-item__content`** — Columna central con título y subtítulo.
- **`dash-item__title`** — Título truncado en una línea.
- **`dash-item__subtitle`** — Descripción secundaria truncada.
- **`dash-item__trailing`** — Valores numéricos, badges o metadata.

Variantes de `dash-item__leading` para estados/urgencia:

- **`dash-item__leading--avatar`** — Iniciales/redondo para pacientes/usuarios.
- **`dash-item__leading--rank`** — Posición (ej. ranking de dentistas).
- **`dash-item__leading--urgency`** — Indicador de urgencia con colores de éxito/info/warning/error.

### Alert Banner

```html
<div class="alert-banner alert-banner--warning">
  <i class="fa-solid fa-exclamation-triangle"></i>
  <span>Mensaje con <strong>énfasis</strong>.</span>
  <a routerLink="/ruta" class="btn btn--sm btn--warning">Acción</a>
</div>
```

### Estados

| Clase | Descripción |
|-------|-------------|
| `.loading-container` | Carga de página completa |
| `.loading-spinner` | Spinner de sección |
| `.empty-state` | Estado vacío |
| `.empty-state.success` | Variante positiva |

### Variables CSS de Dashboard (en `_variables.scss`)

Estas variables globales controlan el layout y apariencia de los dashboards:

- **Contenedor de dashboard**
  - `--dashboard-container-padding`
  - `--dashboard-container-max-width`
- **KPI Cards**
  - `--kpi-grid-gap`, `--kpi-grid-min-col`
  - `--kpi-card-padding`, `--kpi-card-radius`, `--kpi-card-bg`, `--kpi-card-border`, `--kpi-card-shadow`, `--kpi-card-hover-shadow`, `--kpi-card-hover-transform`
  - `--kpi-icon-size`, `--kpi-icon-radius`, `--kpi-icon-font-size`
  - `--kpi-label-size`, `--kpi-label-color`, `--kpi-value-size`, `--kpi-value-weight`, `--kpi-trend-size`
  - `--kpi-sparkline-height`, `--kpi-sparkline-opacity`
  - `--kpi-primary-bg`/`--kpi-primary-color`, `--kpi-success-*`, `--kpi-error-*`, `--kpi-warning-*`, `--kpi-info-*`
- **Section cards y grids**
  - `--section-card-background`, `--section-card-border`, `--section-card-radius`, `--section-card-padding`
  - `--section-title-font-size`, `--section-title-font-weight`, `--section-title-margin`, `--section-title-gap`
  - `--analytics-grid-columns`, `--analytics-grid-columns-3`, `--analytics-grid-gap`
- **Listas y headers de sección**
  - `--list-item-gap`, `--list-item-padding`, `--list-item-background`, `--list-item-hover-background`, `--list-item-border`, `--list-item-radius`, `--list-item-hover-transform`
  - `--section-header-gap`, `--section-badge-size`, `--section-badge-padding`

---

## Reglas

1. **Acciones de creación → `page-header actions`**, nunca en el cuerpo del dashboard
2. **Solo Dashboard General tiene "Acciones Rápidas"** como hub de navegación
3. **KPIs → `.kpi-grid` + `.kpi-card`**, nunca `.metric-card` ni `.quick-action-card`
4. **Grids → `.analytics-grid`**, nunca `.dashboard-grid`, `.charts-grid`, `.triple-grid`
5. **No definir `quickActions[]` en TS de módulo** — las acciones están en HTML del page-header
6. **Estilos de dominio en SCSS de componente**, layouts y cards en `_dashboard.scss` y `_components.scss`
7. **Sparklines en dashboards**, omitirlas en reportes
8. **Variables CSS**, no valores hardcodeados
9. **Date Range Picker** en dashboards con analíticas históricas; separar datos operacionales (no filtrados) de analíticos (filtrados por rango)
10. **Etiquetas de KPI genéricas** cuando el rango es dinámico (ej: "Ingresos" en vez de "Ingresos del Mes")

---

## Referencias

- KPI Cards: `docs/KPI_CARD_GUIDELINES.md`
- Section Headers: `docs/SECTION_HEADER_GUIDELINES.md`
- Variables CSS: `src/styles/_variables.scss`
- Componentes: `src/styles/_components.scss`
- Dashboard base: `src/styles/_dashboard.scss`
