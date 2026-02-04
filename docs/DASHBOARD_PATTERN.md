# Patrón de Dashboard - SmartDentalCloud

## 📋 Propósito

Define el patrón estándar para crear dashboards (vistas generales) en la aplicación. Proporciona una estructura consistente, reutilizable y mantenible usando variables globales CSS.

---

## 🎯 Componentes del Dashboard

### 1. **Métricas (Metrics Cards)**
Tarjetas que muestran KPIs o estadísticas clave.

### 2. **Banner de Alertas**
Notificaciones destacadas para información importante.

### 3. **Accesos Rápidos (Quick Actions)**
Navegación directa a acciones comunes.

### 4. **Sección Card**
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
    <!-- Métricas -->
    <div class="metrics-grid">
      @for (metric of metrics(); track metric.label) {
        <a [routerLink]="metric.route" class="metric-card {{ metric.colorClass }}">
          <div class="metric-icon">
            <i class="fa-solid {{ metric.icon }}"></i>
          </div>
          <div class="metric-content">
            <span class="metric-label">{{ metric.label }}</span>
            <span class="metric-value">{{ metric.value }}</span>
          </div>
          <div class="metric-arrow">
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </a>
      }
    </div>

    <!-- Banner de Alerta (Opcional) -->
    @if (hasAlerts()) {
      <div class="alert-banner">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>
          Mensaje de alerta con <strong>énfasis</strong>
        </span>
        <a [routerLink]="['/ruta']" class="btn btn-sm btn-primary">
          Ver Detalles
          <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    }

    <!-- Accesos Rápidos -->
    <div class="section-card">
      <h2 class="section-title">
        <i class="fa-solid fa-bolt"></i>
        Accesos Rápidos
      </h2>
      <div class="quick-actions-grid">
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

**IMPORTANTE:** El layout es manejado completamente por `.page-container`. Usar SOLO variables globales CSS.

```scss
// ============================================
// Dashboard de [Módulo] - Usando Variables Globales
// Sigue el patrón estándar de dashboards del proyecto
// ============================================

// ✅ El layout es manejado por .page-container
// ✅ NO se necesita contenedor adicional
// ✅ Todas las clases ya están definidas en estilos globales

// Ejemplo de estructura correcta:
// - .page-container (maneja padding y max-width)
//   - .metrics-grid
//   - .metric-card (.primary, .critical, .warning, .info)
//   - .alert-banner
//   - .section-card
//   - .quick-actions-grid
//   - .quick-action-card

// ✅ CRÍTICO: Usar variables CSS globales, NO valores hardcoded
// Correcto:   @media (max-width: var(--breakpoint-md))
// Incorrecto: @media (max-width: 768px)

// ✅ Solo agregar estilos ESPECÍFICOS del módulo si es absolutamente necesario
```

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

## 🎨 Clases CSS Disponibles

### Layout
- `.page-container.container-wide` - Contenedor principal (maneja padding y max-width)
- `.loading-container` - Estado de carga

### Métricas
- `.metrics-grid` - Grid de métricas
- `.metric-card` - Tarjeta de métrica
  - `.metric-card.primary` - Variante primaria (azul)
  - `.metric-card.success` - Variante éxito (verde)
  - `.metric-card.critical` - Variante crítica (rojo)
  - `.metric-card.warning` - Variante advertencia (amarillo)
  - `.metric-card.info` - Variante info (cyan)
- `.metric-icon` - Icono de métrica
- `.metric-content` - Contenido de métrica
- `.metric-label` - Etiqueta de métrica
- `.metric-value` - Valor de métrica
- `.metric-arrow` - Flecha de navegación

### Alertas
- `.alert-banner` - Banner de alerta

### Secciones
- `.section-card` - Tarjeta de sección
- `.section-title` - Título de sección

### Accesos Rápidos
- `.quick-actions-grid` - Grid de acciones
- `.quick-action-card` - Tarjeta de acción
- `.action-icon` - Icono de acción
- `.action-content` - Contenido de acción
- `.action-title` - Título de acción
- `.action-description` - Descripción de acción
- `.action-arrow` - Flecha de navegación

### Analytics (Fase 2)
- `.analytics-grid` - Grid de dos columnas para gráficos
- `.category-chart` - Contenedor de gráfico de barras
- `.category-bar-item` - Item de barra de categoría
- `.category-bar-header` - Header con nombre y conteo
- `.category-bar-container` - Contenedor de la barra de progreso
- `.category-bar-fill` - Barra de relleno (`.status-normal`, `.status-warning`, `.status-critical`)
- `.category-percentage` - Texto de porcentaje
- `.category-alerts` - Badges de alertas por categoría
- `.alert-badge` - Badge de alerta (`.critical`, `.warning`)

### Timeline de Actividad (Fase 2)
- `.activity-timeline` - Contenedor del timeline
- `.activity-item` - Item de actividad
- `.activity-icon` - Icono de actividad (`.success`, `.info`, `.warning`, `.error`, `.primary`)
- `.activity-content` - Contenido de actividad
- `.activity-description` - Descripción del evento
- `.activity-time` - Timestamp del evento

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
