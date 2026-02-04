# Patrón de Dashboard - SmartDentalCloud

## 📋 Propósito

Define el patrón estándar para crear dashboards (vistas generales) en la aplicación. Proporciona una estructura consistente, reutilizable y mantenible usando variables globales CSS.

---

## 🏗️ Arquitectura de Estilos

### Archivos Involucrados

```
src/
├── styles/
│   ├── _variables.scss      # Variables CSS globales
│   ├── _components.scss     # Componentes UI globales (botones, alerts, etc.)
│   └── _dashboard.scss      # ⭐ Estilos reutilizables de dashboard
│
└── app/features/[modulo]/components/[modulo]-dashboard/
    ├── [modulo]-dashboard.ts       # Lógica del componente
    ├── [modulo]-dashboard.html     # Template
    └── [modulo]-dashboard.scss     # Solo estilos ESPECÍFICOS del módulo
```

### Principio de Separación

| Archivo | Contenido |
|---------|----------|
| `_dashboard.scss` | Layouts, cards, timelines, badges - **reutilizable en cualquier dashboard** |
| `[modulo]-dashboard.scss` | Solo estilos específicos del dominio (ej: `.expiring-product-item`) |

---

## 🎯 Componentes del Dashboard

### 1. **Indicadores Clave**
Tarjetas compactas que muestran KPIs principales (Total, Valor, etc.).

### 2. **Accesos Rápidos (Quick Actions)**
Navegación directa a acciones comunes del módulo.

### 3. **Banner de Alertas**
Notificaciones destacadas para información crítica.

### 4. **Analytics Grid**
Gráficos y visualizaciones de datos (2 o 3 columnas).

### 5. **Listas de Datos**
Timelines de actividad, productos próximos a vencer, top items, etc.

### 6. **Section Card**
Contenedor para agrupar contenido relacionado.

---

## 🏗️ Estructura HTML

```html
<div class="page-container container-wide">
  <app-page-header
    [title]="'Nombre del Dashboard'"
    [subtitle]="'Descripción breve del dashboard'"
    [icon]="'fa-boxes-stacked'"
    [breadcrumbs]="breadcrumbItems">
  </app-page-header>

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
    <!-- Banner de Alerta (Opcional) -->
    @if (totalAlerts() > 0) {
      <div class="alert-banner alert-banner--warning">
        <i class="fa-solid fa-exclamation-triangle"></i>
        <span>Tienes <strong>{{ totalAlerts() }}</strong> alertas pendientes.</span>
        <a [routerLink]="['/module/alerts']" class="btn btn--sm btn--warning">
          Ver Alertas
        </a>
      </div>
    }

    <!-- Grid Superior: Indicadores + Accesos Rápidos -->
    <div class="bottom-grid">
      <!-- Indicadores Clave (columna estrecha) -->
      <div class="section-card grid-narrow">
        <h2 class="section-title">
          <i class="fa-solid fa-gauge-high"></i>
          Indicadores Clave
        </h2>
        <div class="indicators-list">
          <a [routerLink]="['/module/items']" class="quick-action-card">
            <div class="action-icon primary">
              <i class="fa-solid fa-boxes-stacked"></i>
            </div>
            <div class="action-content">
              <h3 class="action-title">Total Items</h3>
              <p class="action-value">{{ totalItems() }}</p>
            </div>
            <i class="fa-solid fa-chevron-right action-arrow"></i>
          </a>
          <a [routerLink]="['/module/value']" class="quick-action-card">
            <div class="action-icon success">
              <i class="fa-solid fa-coins"></i>
            </div>
            <div class="action-content">
              <h3 class="action-title">Valor Total</h3>
              <p class="action-value">{{ formatCurrency(totalValue()) }}</p>
            </div>
            <i class="fa-solid fa-chevron-right action-arrow"></i>
          </a>
        </div>
      </div>

      <!-- Accesos Rápidos (columna ancha) -->
      <div class="section-card grid-wide">
        <h2 class="section-title">
          <i class="fa-solid fa-bolt"></i>
          Accesos Rápidos
        </h2>
        <div class="quick-actions-grid cols-4">
          @for (action of quickActions; track action.route) {
            <a [routerLink]="action.route" class="quick-action-card">
              <div class="action-icon">
                <i class="fa-solid {{ action.icon }}"></i>
              </div>
              <div class="action-content">
                <h3 class="action-title">{{ action.label }}</h3>
                <p class="action-description">{{ action.description }}</p>
              </div>
              <i class="fa-solid fa-chevron-right action-arrow"></i>
            </a>
          }
        </div>
      </div>
    </div>

    <!-- Grid de Gráficos (2 columnas) -->
    <div class="analytics-grid">
      <div class="section-card">
        <h2 class="section-title">
          <i class="fa-solid fa-chart-pie"></i>
          Distribución por Categorías
        </h2>
        @if (loadingCategories()) {
          <div class="loading-spinner">
            <i class="fa-solid fa-spinner fa-spin"></i>
          </div>
        } @else if (categories().length === 0) {
          <div class="empty-state">
            <i class="fa-solid fa-folder-open"></i>
            <p>No hay categorías registradas</p>
          </div>
        } @else {
          <app-pie-chart [data]="categoryChartData()" />
        }
      </div>
      <div class="section-card">
        <!-- Segundo gráfico -->
      </div>
    </div>

    <!-- Grid de Listas (3 columnas) -->
    <div class="analytics-grid cols-3">
      <!-- Lista 1: Con badge en header -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fa-solid fa-calendar-xmark"></i>
            Próximos a Vencer
          </h2>
          @if (expiringItems().length > 0) {
            <span class="section-badge">{{ expiringItems().length }}</span>
          }
        </div>
        @if (loadingExpiring()) {
          <div class="loading-spinner">
            <i class="fa-solid fa-spinner fa-spin"></i>
          </div>
        } @else if (expiringItems().length === 0) {
          <div class="empty-state success">
            <i class="fa-solid fa-circle-check"></i>
            <p>No hay items próximos a vencer</p>
          </div>
        } @else {
          <div class="data-list">
            @for (item of expiringItems(); track item.id) {
              <a [routerLink]="['/module/items', item.id]" class="data-list-item compact">
                <!-- Contenido específico del módulo -->
              </a>
            }
          </div>
        }
      </div>

      <!-- Lista 2 -->
      <div class="section-card">
        <h2 class="section-title">
          <i class="fa-solid fa-star"></i>
          Más Utilizados
        </h2>
        <!-- Similar structure -->
      </div>

      <!-- Timeline de Actividad -->
      <div class="section-card">
        <h2 class="section-title">
          <i class="fa-solid fa-clock-rotate-left"></i>
          Actividad Reciente
        </h2>
        <div class="activity-timeline">
          @for (activity of recentActivity(); track activity.id) {
            <div class="activity-item">
              <div class="activity-icon {{ activity.color }}">
                <i class="fa-solid {{ activity.icon }}"></i>
              </div>
              <div class="activity-content">
                <p class="activity-description">{{ activity.description }}</p>
                <span class="activity-time">
                  <i class="fa-solid fa-clock"></i>
                  {{ activity.timestamp | date:'dd/MM HH:mm' }}
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  }
</div>
```

---

## 💻 Estructura TypeScript

```typescript
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ROUTES } from '../../../../core/constants/routes.constants';

interface DashboardMetric {
  label: string;
  value: number;
  icon: string;
  colorClass: 'primary' | 'success' | 'warning' | 'critical' | 'info';
  route: string;
}

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-module-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './module-dashboard.html',
  styleUrls: ['./module-dashboard.scss']
})
export class ModuleDashboardComponent implements OnInit {
  // Servicios
  private dataService = inject(DataService);

  // Signals para estado
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Signals para datos
  totalItems = signal(0);
  criticalCount = signal(0);
  warningCount = signal(0);

  // Breadcrumbs
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Nombre del Módulo' }
  ];

  // Métricas computadas
  metrics = computed<DashboardMetric[]>(() => [
    {
      label: 'Total Items',
      value: this.totalItems(),
      icon: 'fa-boxes-stacked',
      colorClass: 'primary',
      route: '/module/items'
    },
    {
      label: 'Críticos',
      value: this.criticalCount(),
      icon: 'fa-circle-exclamation',
      colorClass: 'critical',
      route: '/module/critical'
    },
    {
      label: 'Advertencias',
      value: this.warningCount(),
      icon: 'fa-triangle-exclamation',
      colorClass: 'warning',
      route: '/module/warnings'
    }
  ]);

  // Accesos rápidos (estáticos)
  quickActions: QuickAction[] = [
    {
      label: 'Acción 1',
      description: 'Descripción breve de la acción',
      icon: 'fa-plus',
      route: '/module/action1'
    },
    {
      label: 'Acción 2',
      description: 'Otra acción común',
      icon: 'fa-list',
      route: '/module/action2'
    }
  ];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.dataService.getData().subscribe({
      next: (data) => {
        this.totalItems.set(data.total);
        this.criticalCount.set(data.critical);
        this.warningCount.set(data.warnings);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.error.set('Error al cargar datos del dashboard');
        this.loading.set(false);
      }
    });
  }
}
```

---

## 🎨 Estilos SCSS

### Archivo Global: `_dashboard.scss`

Contiene **~730 líneas** de estilos reutilizables. Ya está importado en `styles.scss`.

### Archivo del Módulo: `[modulo]-dashboard.scss`

**Solo debe contener estilos específicos del dominio.** Ejemplo:

```scss
// ============================================
// Dashboard de [Módulo] - Estilos Específicos
// Los estilos base de dashboard están en _dashboard.scss
// ============================================

// ✅ Solo agregar estilos para elementos ÚNICOS del módulo
// ❌ NO duplicar layouts, cards, timelines, badges

// Ejemplo: Lista específica de productos próximos a vencer
.expiring-product-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--list-item-padding);
  background: var(--list-item-background);
  border-left: 3px solid transparent;
  border-radius: var(--list-item-radius);
  transition: var(--transition-smooth);

  &:hover {
    background: var(--list-item-hover-background);
  }

  // Variantes de urgencia
  &.urgency-critical {
    border-left-color: var(--error-600);
  }

  &.urgency-warning {
    border-left-color: var(--warning-600);
  }
}

// Ejemplo: Gráfico de barras por categoría
.category-chart {
  display: flex;
  flex-direction: column;
  gap: var(--category-bar-gap);
}
```

### Regla de Oro

| Si necesitas... | Usa... |
|-----------------|--------|
| Grid de 2 columnas | `.analytics-grid` |
| Grid de 3 columnas | `.analytics-grid.cols-3` |
| Grid indicadores + acciones | `.bottom-grid` |
| Tarjeta contenedora | `.section-card` |
| Cards de acción | `.quick-action-card` |
| Timeline | `.activity-timeline` + `.activity-item` |
| Lista con scroll | `.data-list` + `.data-list-item` |
| Estado vacío | `.empty-state` |
| Spinner | `.loading-spinner` |

---

## 📐 Variables Globales Disponibles

### Container
```scss
--dashboard-container-padding: 1.5rem
--dashboard-container-max-width: 1400px
```

### Metric Cards
```scss
--metric-card-gap: 1.5rem
--metric-card-padding: 1.5rem
--metric-card-background: var(--surface-primary)
--metric-card-radius: var(--radius-lg)
--metric-card-hover-shadow: var(--shadow-lg)

--metric-icon-size: 56px
--metric-value-font-size: 2rem
--metric-label-font-size: 0.875rem
```

### Color Variants
```scss
--metric-primary-bg: var(--primary-50)
--metric-primary-color: var(--primary-600)
--metric-success-bg: var(--success-50)
--metric-success-color: var(--success-600)
--metric-error-bg: var(--error-50)
--metric-error-color: var(--error-600)
--metric-warning-bg: var(--warning-50)
--metric-warning-color: var(--warning-600)
--metric-info-bg: var(--info-50)
--metric-info-color: var(--info-600)
```

### Quick Actions
```scss
--quick-action-gap: 1rem
--quick-action-padding: 1.25rem
--quick-action-background: var(--surface-secondary)
--quick-action-icon-size: 48px
```

### Analytics Grid (Fase 2)
```scss
--analytics-grid-columns: repeat(2, 1fr)
--analytics-grid-gap: var(--spacing-xl)
```

### Category Chart (Progress Bars)
```scss
--category-bar-height: 24px
--category-bar-radius: var(--radius-sm)
--category-bar-background: var(--neutral-100)
--category-bar-border: 1px solid var(--border-primary)
--category-bar-gap: var(--spacing-lg)

--category-bar-normal: var(--gradient-primary)
--category-bar-warning: var(--warning-gradient)
--category-bar-critical: var(--error-gradient)
```

### Activity Timeline
```scss
--activity-item-background: var(--surface-secondary)
--activity-item-hover: var(--surface-tertiary)
--activity-item-padding: var(--spacing-md)
--activity-item-radius: var(--radius-md)
--activity-item-gap: var(--spacing-md)

--activity-icon-size: 36px
--activity-icon-radius: var(--radius-full)
```

Ver `src/styles/_variables.scss` para todas las variables disponibles.

---

## 🎨 Clases CSS Disponibles (en `_dashboard.scss`)

### Layouts

| Clase | Descripción | Columnas |
|-------|-------------|----------|
| `.analytics-grid` | Grid para gráficos/secciones | 2 columnas |
| `.analytics-grid.cols-3` | Grid de 3 columnas | 3 columnas |
| `.bottom-grid` | Grid asimétrico | 1:2 ratio |
| `.indicators-list` | Grid para indicadores | 2 columnas |
| `.quick-actions-grid` | Grid de acciones | Configurable |
| `.quick-actions-grid.cols-2` | Variante 2 columnas | 2 columnas |
| `.quick-actions-grid.cols-4` | Variante 4 columnas | 4 columnas |
| `.metrics-grid` | Grid de métricas KPI | 4 columnas |

### Contenedores

| Clase | Descripción |
|-------|-------------|
| `.page-container.container-wide` | Contenedor principal |
| `.section-card` | Tarjeta contenedora de sección |
| `.section-header` | Header con título y badge |
| `.section-title` | Título de sección con icono |
| `.section-badge` | Badge numérico en header |

### Cards de Acción

| Clase | Descripción |
|-------|-------------|
| `.quick-action-card` | Tarjeta de acción clickeable |
| `.dashboard-action-card` | Alias de quick-action-card |
| `.action-icon` | Icono de la acción |
| `.action-icon.primary` | Variante azul |
| `.action-icon.success` | Variante verde |
| `.action-icon.warning` | Variante amarillo |
| `.action-icon.critical` | Variante rojo |
| `.action-content` | Contenedor de texto |
| `.action-title` | Título de la acción |
| `.action-description` | Descripción |
| `.action-value` | Valor numérico (para indicadores) |
| `.action-arrow` | Flecha de navegación |

### Cards de Métricas KPI

| Clase | Descripción |
|-------|-------------|
| `.metric-card` | Tarjeta de métrica |
| `.metric-card.primary` | Variante azul |
| `.metric-card.success` | Variante verde |
| `.metric-card.warning` | Variante amarillo |
| `.metric-card.critical` | Variante rojo |
| `.metric-card.info` | Variante cyan |
| `.metric-icon` | Icono de la métrica |
| `.metric-content` | Contenedor de texto |
| `.metric-label` | Etiqueta |
| `.metric-value` | Valor |
| `.metric-arrow` | Flecha de navegación |

### Alert Banner

| Clase | Descripción |
|-------|-------------|
| `.alert-banner` | Banner de alerta destacada (base) |
| `.alert-banner--warning` | Variante warning con fondo amarillo intenso |

**Uso recomendado:**
```html
<div class="alert-banner alert-banner--warning">
  <i class="fa-solid fa-exclamation-triangle"></i>
  <span>Mensaje de alerta con <strong>énfasis</strong>.</span>
  <a [routerLink]="['/ruta']" class="btn btn--sm btn--warning">
    Ver Detalles
  </a>
</div>
```

### Botones (nomenclatura BEM)

| Clase | Descripción |
|-------|-------------|
| `.btn--sm` | Tamaño pequeño |
| `.btn--lg` | Tamaño grande |
| `.btn--warning` | Botón amarillo/naranja sólido |
| `.btn--ghost` | Botón transparente |

> **Nota:** Las clases BEM (`btn--*`) son alias de las clases tradicionales (`btn-*`) y pueden usarse indistintamente.

### Listas de Datos

| Clase | Descripción |
|-------|-------------|
| `.data-list` | Lista con scroll vertical |
| `.data-list-item` | Item de lista clickeable |
| `.data-list-item.compact` | Variante compacta |
| `.item-arrow` | Flecha de navegación |

### Timeline de Actividad

| Clase | Descripción |
|-------|-------------|
| `.activity-timeline` | Contenedor del timeline |
| `.activity-item` | Item de actividad |
| `.activity-icon` | Icono del evento |
| `.activity-icon.success` | Variante verde |
| `.activity-icon.info` | Variante cyan |
| `.activity-icon.warning` | Variante amarillo |
| `.activity-icon.error` | Variante rojo |
| `.activity-icon.primary` | Variante azul |
| `.activity-content` | Contenido |
| `.activity-description` | Descripción del evento |
| `.activity-time` | Timestamp |

### Estados

| Clase | Descripción |
|-------|-------------|
| `.loading-container` | Carga principal (página completa) |
| `.loading-spinner` | Spinner en sección |
| `.empty-state` | Estado vacío |
| `.empty-state.success` | Variante positiva ("no hay pendientes") |

### Badges

| Clase | Descripción |
|-------|-------------|
| `.status-badge` | Badge de estado |
| `.status-badge.status-critical` | Estado crítico (rojo) |
| `.status-badge.status-warning` | Estado advertencia (amarillo) |
| `.status-badge.status-normal` | Estado normal (verde) |
| `.status-badge.status-info` | Estado info (cyan) |

### Indicadores de Urgencia

| Clase | Descripción |
|-------|-------------|
| `.urgency-indicator` | Indicador de urgencia |
| `.urgency-indicator.critical` | Urgencia crítica |
| `.urgency-indicator.warning` | Urgencia media |
| `.urgency-indicator.info` | Urgencia baja |

---

## 🔍 Verificación de Variables Globales

### Checklist ✅

Al crear o revisar un dashboard, verifica:

```scss
// ✅ CORRECTO - Usar variables CSS
padding: var(--spacing-2xl);
gap: var(--metric-card-gap);
background: var(--metric-card-background);
@media (max-width: var(--breakpoint-md)) { }

// ❌ INCORRECTO - Valores hardcoded
padding: 28px;
gap: 1.5rem;
background: #ffffff;
@media (max-width: 768px) { }
```

### Excepciones Permitidas

Solo estos valores pueden ser literales:
- `1px` para borders (ej: `border: 1px solid var(--border-color)`)
- `0` para valores cero
- `1fr` para grid layouts
- Porcentajes específicos (ej: `width: 100%`)

---

## ✅ Best Practices

### DO ✅

```typescript
// ✅ Usar signals y computed
totalItems = signal(0);
metrics = computed(() => [...]);

// ✅ Usar constantes ROUTES
import { ROUTES } from '../../../../core/constants/routes.constants';
route: ROUTES.INVENTORY

// ✅ Usar interfaces tipadas
interface DashboardMetric {
  label: string;
  value: number;
  icon: string;
  colorClass: string;
  route: string;
}

// ✅ Manejo de errores
this.dataService.getData().subscribe({
  next: (data) => { /* ... */ },
  error: (err) => {
    console.error('Error:', err);
    this.error.set('Mensaje amigable');
  }
});
```

### DON'T ❌

```scss
// ❌ NO hardcodear colores
background: #3b82f6;

// ❌ NO hardcodear medidas
padding: 24px;
font-size: 14px;

// ❌ NO duplicar estilos
.my-custom-card {
  // Usar .metric-card en su lugar
}

// ❌ NO usar !important
color: red !important;
```

---

## 📱 Responsive Design

El patrón incluye breakpoints responsive automáticos:

- **Desktop**: Grid completo
- **Tablet (≤768px)**: 1 columna en métricas, ajustes en banner
- **Mobile (≤480px)**: Espaciado reducido, valores de métricas más pequeños

---

## 🔄 Actualización de Dashboards Existentes

Para migrar un dashboard antiguo:

1. **HTML**: Usar estructura del patrón
2. **TypeScript**: Convertir a signals y computed
3. **SCSS**: Eliminar estilos custom, usar clases globales
4. **Rutas**: Usar constantes ROUTES
5. **Iconos**: FontAwesome solid

---

## 🌗 Soporte de Temas

Todas las variables soportan automáticamente:
- ✅ Tema claro
- ✅ Tema oscuro
- ✅ Tema alto contraste

No se requiere código adicional.

---

## 📚 Ejemplos de Uso

### Inventory Dashboard
```
src/app/features/inventory/components/inventory-dashboard/
```

### Futuro: Appointments Dashboard
```
src/app/features/appointments/components/appointments-dashboard/
```

### Futuro: Billing Dashboard
```
src/app/features/billing/components/billing-dashboard/
```

---

## 🧪 Testing

```typescript
describe('ModuleDashboardComponent', () => {
  it('should display metrics correctly', () => {
    // Test metrics rendering
  });

  it('should handle loading state', () => {
    // Test loading state
  });

  it('should handle error state', () => {
    // Test error handling
  });
});
```

---

## 📖 Referencias

- Variables CSS: `src/styles/_variables.scss`
- Componentes Globales: `src/styles/_components.scss`
- Context Pattern: `docs/CONTEXT_SERVICE_PATTERN.md`
- Form Pattern: `docs/FORM_STANDARD_PATTERN.md`
