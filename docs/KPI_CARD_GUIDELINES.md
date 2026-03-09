# KPI Card Guidelines

Componente unificado `.kpi-card` para indicadores tipo KPI en dashboards, reportes y sub-páginas.

**Archivos fuente:**
- CSS: `src/styles/_components.scss` (sección "KPI Cards")
- Variables: `src/styles/_variables.scss` (sección "KPI Cards")

---

## Estructura BEM

```
.kpi-grid                       ← Grid responsive (auto-fit, minmax 220px)
  .kpi-card.kpi-card--{color}   ← Tarjeta (div o <a>)
    .kpi-card__header            ← Fila: label + icon
      .kpi-card__label           ← Texto descriptivo
      .kpi-card__icon            ← Ícono (Font Awesome 6)
    .kpi-card__value             ← Valor numérico principal
    .kpi-card__trend             ← (Opcional) Indicador de tendencia
    .kpi-card__sparkline         ← (Opcional) Gráfica de fondo translúcida
```

---

## Variantes de Color

| Modificador          | Uso típico                        |
|----------------------|-----------------------------------|
| `kpi-card--primary`  | Totales, métricas principales     |
| `kpi-card--success`  | Valores positivos, completados    |
| `kpi-card--warning`  | Pendientes, en espera             |
| `kpi-card--error`    | Críticos, cancelados, vencidos    |
| `kpi-card--info`     | Informativos, en progreso         |

---

## HTML — Variante Básica (Reportes)

```html
<div class="kpi-grid">
  <div class="kpi-card kpi-card--primary">
    <div class="kpi-card__header">
      <span class="kpi-card__label">Total Productos</span>
      <div class="kpi-card__icon"><i class="fa-solid fa-box"></i></div>
    </div>
    <div class="kpi-card__value">{{ r.totalProducts }}</div>
  </div>
</div>
```

## HTML — Con Sparkline (Dashboards)

```html
<div class="kpi-grid">
  <a class="kpi-card kpi-card--success" routerLink="/reports/income">
    <div class="kpi-card__header">
      <span class="kpi-card__label">Ingresos del Mes</span>
      <div class="kpi-card__icon"><i class="fa-solid fa-dollar-sign"></i></div>
    </div>
    <div class="kpi-card__value">{{ formatCurrency(monthlyIncome()) }}</div>
    <div class="kpi-card__sparkline kpi-card__sparkline--up">
      <svg viewBox="0 0 200 40" preserveAspectRatio="none">
        <path class="sparkline-fill" d="M0,32 Q25,28 50,30 T100,24 T150,18 T200,12 L200,40 L0,40Z"/>
        <path class="sparkline-line" d="M0,32 Q25,28 50,30 T100,24 T150,18 T200,12"/>
      </svg>
    </div>
  </a>
</div>
```

## HTML — Con Trend Badge

```html
<div class="kpi-card kpi-card--success">
  <div class="kpi-card__header">
    <span class="kpi-card__label">Ingresos</span>
    <div class="kpi-card__icon"><i class="fa-solid fa-dollar-sign"></i></div>
  </div>
  <div class="kpi-card__value">$125,000</div>
  <div class="kpi-card__trend kpi-card__trend--up">
    <i class="fa-solid fa-arrow-up"></i> 12.5%
  </div>
</div>
```

---

## Sparkline Direcciones

| Modificador                    | Color         | Uso                     |
|--------------------------------|---------------|-------------------------|
| `kpi-card__sparkline--up`      | Verde         | Tendencia positiva      |
| `kpi-card__sparkline--down`    | Rojo          | Tendencia negativa      |
| `kpi-card__sparkline--neutral` | Gris/Neutral  | Sin tendencia definida  |

Las sparklines usan SVG con dos paths:
- `.sparkline-fill` → Área rellena translúcida
- `.sparkline-line` → Línea de trazo

---

## Trend Badges

| Modificador                 | Color  | Ícono              |
|-----------------------------|--------|---------------------|
| `kpi-card__trend--up`       | Verde  | `fa-arrow-up`       |
| `kpi-card__trend--down`     | Rojo   | `fa-arrow-down`     |
| `kpi-card__trend--neutral`  | Gris   | `fa-minus`          |

---

## Uso por Pantalla

### Dashboards (con sparklines)
- `dashboard.html` — Dashboard general (6 KPIs)
- `appointments-dashboard.html` — Citas (4 KPIs)
- `invoices-dashboard.html` — Facturación (4 KPIs)
- `patients-dashboard.html` — Pacientes (4 KPIs)
- `inventory-dashboard.html` — Inventario (2 KPIs)
- `treatment-dashboard.html` — Tratamientos (6 KPIs)
- `treatment-plan-dashboard.html` — Planes (6 KPIs)
- `dentist-dashboard.html` — Dentistas (6 KPIs)
- `stock-alerts.html` — Alertas de stock (3 KPIs)

### Reportes (sin sparklines)
- `income-report.html` — Reporte de ingresos (4 KPIs)
- `treatments-report.html` — Reporte de tratamientos (4 KPIs)
- `inventory-report.html` — Reporte de inventario (5 KPIs)
- `appointment-occupancy.html` — Ocupación de citas (6 KPIs)
- `accounts-receivable.html` — Cuentas por cobrar (4 KPIs)

### Otros
- `prescription-list.html` — Lista de recetas (3 KPIs)

---

## Reglas

1. **Siempre usar `.kpi-grid` como contenedor** — nunca `.metrics-grid`, `.alert-summary`, ni `.indicators-list`
2. **Siempre usar `.kpi-card` con un modificador de color** — nunca `.metric-card`, `.summary-card`, ni `.quick-action-card` para indicadores
3. **Nunca definir estilos locales de KPI en SCSS de componente** — todo viene de `_components.scss`
4. **Sparklines son opcionales** — usarlas en dashboards, omitirlas en reportes
5. **Usar `<a>` cuando la tarjeta es clickeable**, `<div>` cuando es solo informativa
6. **El label va arriba, el valor abajo** — layout vertical moderno tipo SaaS

---

## Variables CSS para KPI Cards (en `_variables.scss`)

Las siguientes variables controlan el layout y apariencia de todas las KPI cards:

- **Grid**
  - `--kpi-grid-gap` — Separación entre tarjetas.
  - `--kpi-grid-min-col` — Ancho mínimo de columna (usado en `minmax`).
- **Tarjeta**
  - `--kpi-card-padding` — Padding interno de la tarjeta.
  - `--kpi-card-radius` — Radio de borde.
  - `--kpi-card-bg` — Fondo base.
  - `--kpi-card-border` — Borde.
  - `--kpi-card-shadow` — Sombra por defecto.
  - `--kpi-card-hover-shadow` — Sombra en hover.
  - `--kpi-card-hover-transform` — Transformación en hover.
- **Ícono**
  - `--kpi-icon-size`, `--kpi-icon-radius`, `--kpi-icon-font-size`.
- **Tipografía**
  - `--kpi-label-size`, `--kpi-label-color`.
  - `--kpi-value-size`, `--kpi-value-weight`.
  - `--kpi-trend-size` — Tamaño del texto del trend badge.
- **Sparkline**
  - `--kpi-sparkline-height` — Altura del gráfico.
  - `--kpi-sparkline-opacity` — Opacidad del área de relleno.
- **Colores por variante**
  - `--kpi-primary-bg` / `--kpi-primary-color`.
  - `--kpi-success-bg` / `--kpi-success-color`.
  - `--kpi-error-bg` / `--kpi-error-color`.
  - `--kpi-warning-bg` / `--kpi-warning-color`.
  - `--kpi-info-bg` / `--kpi-info-color`.
