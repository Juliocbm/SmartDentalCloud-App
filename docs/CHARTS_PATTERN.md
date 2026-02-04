# Patrón de Charts - SmartDentalCloud

## 📋 Propósito

Define el patrón estándar para implementar gráficos en la aplicación usando **Chart.js + ng2-charts**. Proporciona componentes reutilizables, configuración centralizada y soporte automático de temas.

---

## 🏗️ Arquitectura

### Estructura de Archivos

```
src/app/
├── core/
│   └── services/
│       └── chart-config.service.ts    ← Singleton: configuración global + temas
│
├── shared/
│   └── components/
│       └── charts/
│           ├── index.ts               ← Barrel export
│           ├── chart.models.ts        ← Interfaces compartidas
│           ├── pie-chart/
│           │   ├── pie-chart.ts
│           │   ├── pie-chart.html
│           │   └── pie-chart.scss
│           ├── bar-chart/
│           │   ├── bar-chart.ts
│           │   ├── bar-chart.html
│           │   └── bar-chart.scss
│           └── line-chart/
│               ├── line-chart.ts
│               ├── line-chart.html
│               └── line-chart.scss
│
└── styles/
    └── _variables.scss                ← Variables de colores para charts
```

### Flujo de Datos

```
┌─────────────────────────┐
│   Dashboard Component   │  ← Provee datos
└───────────┬─────────────┘
            │ [data]="categoryData()"
            ↓
┌─────────────────────────┐
│   <app-pie-chart>       │  ← Componente wrapper reutilizable
│   [data]="..."          │
│   [title]="..."         │
└───────────┬─────────────┘
            │ inject
            ↓
┌─────────────────────────┐
│  ChartConfigService     │  ← Aplica tema automáticamente
│  (Core Singleton)       │
└───────────┬─────────────┘
            │ effect()
            ↓
┌─────────────────────────┐
│     ThemeService        │  ← Fuente de verdad del tema
└─────────────────────────┘
```

---

## 📦 Dependencias

```bash
npm install chart.js
```

**Versión recomendada:** `chart.js`: ^4.4.x

> **Nota:** NO usar `ng2-charts` ya que no es compatible con Angular zoneless (`provideZonelessChangeDetection`). Los componentes usan Chart.js directamente con `ViewChild` + `ElementRef`.

---

## 🎨 Variables CSS

### Paleta de Colores para Charts

```scss
// En _variables.scss - :root
// ===== Chart Colors =====
--chart-color-1: #3b82f6;  // Primary blue
--chart-color-2: #10b981;  // Success green
--chart-color-3: #f59e0b;  // Warning yellow
--chart-color-4: #ef4444;  // Error red
--chart-color-5: #8b5cf6;  // Purple
--chart-color-6: #06b6d4;  // Cyan
--chart-color-7: #ec4899;  // Pink
--chart-color-8: #84cc16;  // Lime

// Chart UI
--chart-background: var(--surface-primary);
--chart-grid-color: var(--border-primary);
--chart-text-color: var(--text-secondary);
--chart-legend-color: var(--text-primary);
--chart-tooltip-bg: var(--surface-tertiary);
--chart-tooltip-text: var(--text-primary);
```

### Tema Oscuro

```scss
// En _variables.scss - [data-theme="dark"]
--chart-color-1: #60a5fa;  // Lighter blue
--chart-color-2: #34d399;  // Lighter green
--chart-color-3: #fbbf24;  // Lighter yellow
--chart-color-4: #f87171;  // Lighter red
--chart-color-5: #a78bfa;  // Lighter purple
--chart-color-6: #22d3ee;  // Lighter cyan
--chart-color-7: #f472b6;  // Lighter pink
--chart-color-8: #a3e635;  // Lighter lime
```

---

## 🔧 ChartConfigService

### Ubicación
`src/app/core/services/chart-config.service.ts`

### Responsabilidades
- Proveer paleta de colores reactiva al tema
- Configuraciones base para cada tipo de chart
- Opciones de tooltips, leyendas y animaciones estandarizadas

### Implementación

```typescript
import { Injectable, inject, computed, effect } from '@angular/core';
import { ThemeService } from './theme.service';
import { ChartOptions, ChartData } from 'chart.js';

@Injectable({ providedIn: 'root' })
export class ChartConfigService {
  private themeService = inject(ThemeService);

  /** Paleta de colores reactiva al tema actual */
  colors = computed(() => this.getColorsForTheme(this.themeService.currentTheme()));

  /** Obtiene colores según el tema */
  private getColorsForTheme(theme: string): string[] {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    
    return [
      style.getPropertyValue('--chart-color-1').trim(),
      style.getPropertyValue('--chart-color-2').trim(),
      style.getPropertyValue('--chart-color-3').trim(),
      style.getPropertyValue('--chart-color-4').trim(),
      style.getPropertyValue('--chart-color-5').trim(),
      style.getPropertyValue('--chart-color-6').trim(),
      style.getPropertyValue('--chart-color-7').trim(),
      style.getPropertyValue('--chart-color-8').trim(),
    ];
  }

  /** Configuración base para Pie/Doughnut charts */
  getPieOptions(showLegend = true): ChartOptions<'pie' | 'doughnut'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 16,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8
        }
      }
    };
  }

  /** Configuración base para Bar charts */
  getBarOptions(horizontal = false): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? 'y' : 'x',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          ticks: { font: { size: 11 } }
        }
      }
    };
  }

  /** Configuración base para Line charts */
  getLineOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          beginAtZero: true
        }
      }
    };
  }
}
```

---

## 🧩 Componentes Wrapper

### PieChartComponent

**Ubicación:** `src/app/shared/components/charts/pie-chart/`

**Inputs:**
| Input | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `data` | `ChartDataItem[]` | `[]` | Datos del gráfico |
| `title` | `string` | `''` | Título opcional |
| `showLegend` | `boolean` | `true` | Mostrar leyenda |
| `doughnut` | `boolean` | `false` | Usar estilo doughnut |
| `height` | `string` | `'300px'` | Altura del contenedor |

**Uso:**
```html
<app-pie-chart
  [data]="categoryData()"
  [title]="'Distribución por Categorías'"
  [showLegend]="true"
  [doughnut]="true"
/>
```

### BarChartComponent

**Ubicación:** `src/app/shared/components/charts/bar-chart/`

**Inputs:**
| Input | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `data` | `ChartDataItem[]` | `[]` | Datos del gráfico |
| `title` | `string` | `''` | Título opcional |
| `horizontal` | `boolean` | `false` | Barras horizontales |
| `showValues` | `boolean` | `false` | Mostrar valores en barras |
| `height` | `string` | `'300px'` | Altura del contenedor |

**Uso:**
```html
<app-bar-chart
  [data]="topProducts()"
  [title]="'Top 5 Productos'"
  [horizontal]="true"
/>
```

### LineChartComponent

**Ubicación:** `src/app/shared/components/charts/line-chart/`

**Inputs:**
| Input | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `datasets` | `LineDataset[]` | `[]` | Datasets del gráfico |
| `labels` | `string[]` | `[]` | Etiquetas eje X |
| `title` | `string` | `''` | Título opcional |
| `showLegend` | `boolean` | `true` | Mostrar leyenda |
| `height` | `string` | `'300px'` | Altura del contenedor |

**Uso:**
```html
<app-line-chart
  [datasets]="trendData()"
  [labels]="months"
  [title]="'Tendencia de Consumo'"
/>
```

---

## 📊 Interfaces

```typescript
// src/app/shared/components/charts/chart.models.ts

/** Item de datos para Pie/Bar charts */
export interface ChartDataItem {
  label: string;
  value: number;
  color?: string;  // Override color
}

/** Dataset para Line charts */
export interface LineDataset {
  label: string;
  data: number[];
  color?: string;
  fill?: boolean;
}

/** Configuración común de charts */
export interface ChartConfig {
  title?: string;
  showLegend?: boolean;
  height?: string;
  animate?: boolean;
}
```

---

## 🎯 Ejemplo de Integración

### En Dashboard de Inventario

```typescript
// inventory-dashboard.ts
import { PieChartComponent, BarChartComponent } from '@shared/components/charts';
import { ChartDataItem } from '@shared/components/charts/chart.models';

@Component({
  imports: [PieChartComponent, BarChartComponent],
  template: `
    <div class="analytics-grid">
      <!-- Distribución por Categorías -->
      <div class="section-card">
        <h2 class="section-title">
          <i class="fa-solid fa-chart-pie"></i>
          Distribución por Categorías
        </h2>
        <app-pie-chart
          [data]="categoryChartData()"
          [doughnut]="true"
          [height]="'280px'"
        />
      </div>

      <!-- Top Productos -->
      <div class="section-card">
        <h2 class="section-title">
          <i class="fa-solid fa-ranking-star"></i>
          Top Productos
        </h2>
        <app-bar-chart
          [data]="topProductsChartData()"
          [horizontal]="true"
          [height]="'280px'"
        />
      </div>
    </div>
  `
})
export class InventoryDashboardComponent {
  private analyticsService = inject(InventoryAnalyticsService);

  categoryDistribution = signal<CategoryStockStatus[]>([]);

  // Transformar datos para el chart
  categoryChartData = computed<ChartDataItem[]>(() => 
    this.categoryDistribution().map(cat => ({
      label: cat.categoryName,
      value: cat.totalProducts
    }))
  );

  topProductsChartData = computed<ChartDataItem[]>(() =>
    this.topProducts().map(p => ({
      label: p.name,
      value: p.usageCount
    }))
  );
}
```

---

## ✅ Checklist de Implementación

### Al usar charts en un nuevo componente:

- [ ] Importar componente desde `@shared/components/charts`
- [ ] Transformar datos al formato `ChartDataItem[]` o `LineDataset[]`
- [ ] Usar `computed()` para transformaciones reactivas
- [ ] Especificar altura apropiada según el layout
- [ ] Probar en tema claro y oscuro

### Al crear un nuevo tipo de chart:

- [ ] Crear carpeta en `shared/components/charts/`
- [ ] Implementar componente con inputs estándar
- [ ] Inyectar `ChartConfigService` para configuración
- [ ] Usar variables CSS para colores
- [ ] Exportar en `index.ts`
- [ ] Documentar inputs en este archivo

---

## 🌗 Soporte de Temas

Los charts cambian automáticamente de colores cuando el usuario cambia el tema:

1. `ThemeService.currentTheme()` emite el nuevo tema
2. `ChartConfigService.colors` se recalcula
3. Los componentes de charts detectan el cambio y actualizan

**No se requiere código adicional** - el soporte de temas es automático.

---

## 📚 Referencias

- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [ng2-charts Documentation](https://valor-software.com/ng2-charts/)
- Variables CSS: `src/styles/_variables.scss`
- Patrón Dashboard: `docs/DASHBOARD_PATTERN.md`
- Arquitectura: `docs/ARCHITECTURE.md`
