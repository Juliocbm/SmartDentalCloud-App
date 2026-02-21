# Auditoría de Estandarización de Estilos y Componentes

**Fecha:** 2026-02-20  
**Alcance:** Análisis exhaustivo de SCSS de features vs estilos globales  
**Objetivo:** Identificar duplicaciones, inconsistencias y oportunidades de estandarización

---

## Resumen Ejecutivo

| Severidad | Hallazgos | Líneas duplicadas estimadas | Archivos afectados |
|-----------|-----------|----------------------------|-------------------|
| 🔴 Crítico | 3 | ~1,800+ | 22 |
| 🟡 Medio | 5 | ~400+ | 25 |
| 🟢 Menor | 4 | ~100+ | 15 |

**Total estimado de CSS duplicado eliminable: ~2,300+ líneas (~35% reducción en feature SCSS)**

---

## 🔴 HALLAZGOS CRÍTICOS

### C-01: `.detail-header` idéntico en 9 detail pages (~720 líneas duplicadas)

**Problema:** El bloque `.detail-header` con `.header-top`, `.btn-back`, `.header-actions`, `.header-content`, `.title-section` se repite **palabra por palabra** (~80 líneas) en 9 archivos de detalle.

**Archivos afectados:**
- `appointment-detail.scss`
- `treatment-detail.scss`
- `treatment-plan-detail.scss`
- `invoice-detail.scss`
- `prescription-detail.scss`
- `patient-detail.scss`
- `consultation-note-view.scss`
- `service-detail.scss`
- `payment-detail.scss`

**Patrón duplicado:**
```scss
.detail-header {
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
  box-shadow: var(--shadow-sm);

  .header-top { ... }
  .btn-back { ... }
  .header-actions { ... }
  .header-content { .title-section { h1 { ... } } }
}
```

**Solución:** Crear `.detail-header` en `_components.scss` como componente global. Los detail pages solo necesitarían overrides específicos (colores de icono, contenido custom).

---

### C-02: `.info-card` + `.info-row` duplicado en 8+ detail pages (~240 líneas)

**Problema:** El patrón de tarjeta de información con filas key-value se define localmente en cada detail page.

**Archivos afectados:**
- `treatment-detail.scss`
- `appointment-detail.scss`
- `invoice-detail.scss`
- `treatment-plan-detail.scss`
- `prescription-detail.scss`
- `patient-detail.scss`
- `user-detail.scss`
- `payment-detail.scss`
- `purchase-order-detail.scss`

**Patrón duplicado:**
```scss
.info-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);

  .info-row {
    display: flex;
    gap: var(--spacing-lg);
    padding: var(--spacing-md) 0;
    &:not(:last-child) { border-bottom: 1px solid var(--border-primary); }
    .info-label { font-weight: var(--font-weight-semibold); color: var(--text-secondary); min-width: 180px; }
    .info-value { color: var(--text-primary); flex: 1; }
  }
}
```

**Solución:** Agregar `.info-card`, `.info-row`, `.info-label`, `.info-value` a `_components.scss`.

---

### C-03: `prescription-list.scss` — archivo completamente fuera de estándar (393 líneas)

**Problema:** Este archivo redefine prácticamente todos los componentes globales localmente:
- `.kpi-card` / `.kpi-grid` (existe como `.metric-card` / `.metrics-grid` en `_dashboard.scss`)
- `.search-box` (existe en `.filters-section` de `_components.scss`)
- `.badge` con variantes (existe en `_components.scss`)
- `.table-container` / `.data-table` (existe como `.table-container` / `.table` en `_components.scss`)
- `.table-footer` / `.btn-page` (existe en `_components.scss`)
- `.loading-state` / `.error-state` / `.empty-state` (existen globalmente)

**Líneas eliminables:** ~350 de 393 (89%)

**Solución:** Migrar completamente a clases globales. Solo necesitaría ~40 líneas de overrides específicos.

---

## 🟡 HALLAZGOS MEDIOS

### M-01: `.kpi-card` / `.kpi-grid` locales en vez de `.metric-card` global (7 archivos)

**Problema:** El global `_dashboard.scss` define `.metric-card` / `.metrics-grid` con soporte completo de variantes y responsive. Sin embargo, 7 archivos definen `.kpi-card` / `.kpi-grid` localmente con implementación similar pero inconsistente.

**Archivos afectados:**
- `prescription-list.scss` — `.kpi-card` + `.kpi-grid`
- `income-report.scss` — `.kpi-card` + `.kpi-grid`
- `treatments-report.scss` — `.kpi-card` + `.kpi-grid`
- `treatment-dashboard.scss` — `.kpi-card` + `.kpi-grid`
- `patient-detail.scss` — `.kpi-card`
- `accounts-receivable.scss` — `.kpi-card`
- `dashboard.scss` — `.kpi-grid`

**Inconsistencias detectadas:**
- `minmax(220px, 1fr)` vs `minmax(200px, 1fr)` vs `minmax(250px, 1fr)` en grid
- Algunos usan `box-shadow`, otros no
- Algunos tienen `border`, otros no
- `.kpi-icon` sizes varían: 48px vs 40px

**Solución:** Migrar todos a `.metric-card` / `.metrics-grid` de `_dashboard.scss`.

---

### M-02: `.filters-section` redefinida en 5 archivos (no usan el global)

**Problema:** El global `_components.scss` ya define `.filters-section` con `.search-box`, `.filter-actions`, `.filter-select`. Sin embargo, 5 archivos redefinen `.filters-section` completamente con variante `.filter-group` / `.filter-label` que NO existe en el global.

**Archivos que redefinen:**
- `dentist-productivity.scss` — `.filters-section` + `.filter-group` + `.filter-label` + `.form-control`
- `income-report.scss` — idéntico
- `treatments-report.scss` — idéntico
- `audit-log-list.scss` — similar con `select` styling
- `cfdi-list.scss` — similar

**Solución:** 
1. Agregar `.filter-group` + `.filter-label` al `.filters-section` global en `_components.scss`
2. Eliminar las redefiniciones locales

---

### M-03: Inline `style="..."` en 7 templates HTML (25 instancias)

**Problema:** Estilos inline violan la arquitectura CSS y no son tematizables.

| Archivo | Instancias | Patrón |
|---------|-----------|--------|
| `consultation-note-view.html` | 10 | `style="grid-column: 1 / -1;"` |
| `appointment-calendar.html` | 5 | `style="background-color: #hex;"` (colores hardcodeados) |
| `dashboard.html` | 4 | Inline layout + avatar hardcodeado |
| `invoice-form.html` | 2 | `style="grid-column: 1 / -1;"` |
| `treatment-plan-form.html` | 2 | `style="grid-column: 1 / -1;"` |
| `treatment-form.html` | 1 | `style="grid-column: 1 / -1;"` |
| `invoices-dashboard.html` | 1 | `style="grid-column: 1 / -1;"` |

**Soluciones:**
1. **`grid-column: 1 / -1`** (15 instancias): Crear clase `.form-group-full` en `_components.scss`
2. **Colores en calendar legend** (5 instancias): Usar clases CSS con variables (`--primary-500`, `--success-500`, etc.)
3. **Dashboard avatar inline** (2 instancias): Crear clase `.avatar-circle` global

---

### M-04: `.info-section` duplicada en 7 detail pages

**Problema:** El contenedor de secciones de información en detail pages se repite:

**Archivos:** `invoice-detail`, `appointment-detail`, `consultation-note-view`, `prescription-detail`, `treatment-plan-detail`, `treatment-detail`, `service-detail`

**Solución:** Incluir en el componente global `.detail-header` junto con C-01.

---

### M-05: `.link-primary` y `.notes-content` duplicados en 4+ detail pages

**Problema:** Pequeños componentes de UI duplicados:
- `.link-primary` en 4 detail pages (treatment-detail, treatment-plan-detail, patient-detail, payment-detail)
- `.notes-content` / `.notes-text` en 3 detail pages

**Solución:** Agregar a `_components.scss` como utilidades globales.

---

## 🟢 HALLAZGOS MENORES

### I-01: Hex colors hardcodeados en SCSS (3 instancias restantes)

| Archivo | Línea | Valor | Reemplazo |
|---------|-------|-------|-----------|
| `odontogram.scss` | 345 | `color: #fff` | `color: white` |
| `odontogram.scss` | 495 | `color: #fff` | `color: white` |
| `invoice-detail.scss` | 948 | `border: 1px solid #ddd` | `border: 1px solid var(--border-primary)` |

---

### I-02: `border-radius` hardcodeado en px (7 instancias)

| Archivo | Valor | Contexto | Reemplazo sugerido |
|---------|-------|----------|-------------------|
| `treatments-report.scss` | `6px` (×2) | Status bar | `var(--radius-sm)` |
| `patients-dashboard.scss` | `2px` | Legend dot | `var(--radius-sm)` o `2px` (aceptable por tamaño) |
| `purchase-order-detail.scss` | `2px` (×2) | Mini progress | Aceptable por tamaño |
| `odontogram.scss` | `1px` | Separator | Aceptable |
| `product-form.scss` | `24px` | Toggle switch | `var(--radius-2xl)` |

---

### I-03: `.modal-backdrop` local en vez de `.modal-overlay` global (3 archivos)

**Archivos:** `appointment-calendar.scss`, `subscription-page.scss`, `treatment-plan-detail.scss`

**Solución:** Migrar a `.modal-overlay` + `.modal-container` de `_components.scss`.

---

### I-04: `font-size: 10px` en `_dashboard.scss` global (línea 378)

```scss
.activity-time i { font-size: 10px; }
```

**Solución:** Cambiar a `var(--font-size-xs)`.

---

## 📋 Plan de Acción Propuesto

### Fase 1: Componentes Globales Nuevos (Máximo impacto)

| # | Acción | Líneas eliminables | Archivos |
|---|--------|--------------------|----------|
| 1.1 | Crear `.detail-header` global en `_components.scss` | ~720 | 9 detail pages |
| 1.2 | Crear `.info-card` + `.info-row` global | ~240 | 8+ detail pages |
| 1.3 | Crear `.form-group-full` para `grid-column: 1 / -1` | Inline CSS | 6 templates |
| 1.4 | Crear `.avatar-circle` global (sm/md/lg) | ~30 | 5+ files |

### Fase 2: Migración a Clases Globales Existentes

| # | Acción | Líneas eliminables | Archivos |
|---|--------|--------------------|----------|
| 2.1 | Migrar `.kpi-card` → `.metric-card` | ~280 | 7 archivos |
| 2.2 | Refactorizar `prescription-list.scss` completo | ~350 | 1 archivo |
| 2.3 | Agregar `.filter-group` al global `.filters-section` | ~120 | 5 archivos |
| 2.4 | Migrar `.modal-backdrop` → `.modal-overlay` | ~30 | 3 archivos |

### Fase 3: Limpieza de Inconsistencias

| # | Acción | Instancias |
|---|--------|-----------|
| 3.1 | Eliminar inline styles de templates HTML | 25 |
| 3.2 | Reemplazar hex colors restantes en SCSS | 3 |
| 3.3 | Reemplazar border-radius px con variables | 3 significativos |
| 3.4 | Agregar `.link-primary`, `.notes-content` al global | 7 archivos |
| 3.5 | Fix `font-size: 10px` en `_dashboard.scss` | 1 |

---

## Métricas de Éxito

- **Antes:** ~2,300+ líneas de CSS duplicado en features
- **Después (estimado):** ~200 líneas de overrides específicos + ~150 nuevas líneas en globals
- **Reducción neta:** ~1,950 líneas (~35% del CSS de features)
- **Archivos simplificados:** 22+ archivos SCSS de features
- **Consistencia de marca:** 100% de componentes usando design system
- **Tematización:** Todos los valores responden a cambio de tema
