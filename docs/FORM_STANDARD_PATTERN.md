# Patrón Estándar de Formularios - SmartDentalCloud

## 📋 Objetivo
Este documento define el patrón estándar para todos los formularios en la aplicación, asegurando consistencia visual, mantenibilidad y escalabilidad.

---

## 🏗️ Estructura HTML Estándar

### Layout Principal
```html
<div class="page-container container-medium">
  <!-- Page Header con Actions (sticky = fijo al hacer scroll) -->
  <app-page-header
    [title]="isEditMode() ? 'Editar X' : 'Nuevo X'"
    [subtitle]="'Descripción del formulario'"
    [icon]="'fa-icon'"
    [showBackButton]="true"
    [backRoute]="'/ruta-lista'"
    [breadcrumbs]="breadcrumbItems()"
    [sticky]="true">

    <!-- IMPORTANTE: Botones de acción en el header -->
    <div actions class="header-form-actions">
      <button type="button" class="btn btn-outline" (click)="cancel()" [disabled]="loading()">
        <i class="fa-solid fa-times"></i>
        Cancelar
      </button>
      <button type="button" class="btn btn-primary" (click)="onSubmit()" [disabled]="loading()">
        @if (loading()) {
          <span class="btn-spinner"></span>
          Guardando...
        } @else {
          <i class="fa-solid fa-save"></i>
          {{ isEditMode() ? 'Actualizar' : 'Crear' }}
        }
      </button>
    </div>
  </app-page-header>

  <!-- Content Card (envoltorio único) -->
  <div class="content-card">
    
    <!-- Loading State -->
    @if (loading() && isEditMode()) {
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>
    }

    <!-- Error Alert -->
    @if (error()) {
      <div class="alert alert-danger">
        <i class="fa-solid fa-circle-exclamation alert-icon"></i>
        <span class="alert-message">{{ error() }}</span>
        <button class="alert-close" (click)="error.set(null)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    }

    <!-- Form -->
    @if (!loading() || !isEditMode()) {
      <form [formGroup]="form" class="standard-form">
        
        <!-- Form Section (SIEMPRE usar form-section--compact) -->
        <div class="form-section form-section--compact">
          <h3 class="section-title">
            <i class="fa-solid fa-icon section-icon"></i>
            Título de Sección
            <span class="required">*</span> <!-- Si es obligatoria -->
            <span class="optional-badge">Opcional</span> <!-- Si es opcional -->
          </h3>
          <p class="section-description">Descripción opcional de la sección</p>

          <!-- Form Row (1 columna por default, 2 en inline) -->
          <div class="form-row">
            <!-- Form Group -->
            <div class="form-group">
              <label for="field" class="form-label">
                Campo <span class="required">*</span>
              </label>
              <input
                id="field"
                type="text"
                formControlName="field"
                class="form-input"
                [class.input-error]="control?.invalid && control?.touched"
                placeholder="Placeholder text"
              />
              @if (control?.invalid && control?.touched) {
                <span class="error-message">
                  @if (control?.errors?.['required']) { El campo es requerido }
                  @if (control?.errors?.['email']) { Email inválido }
                </span>
              }
              <p class="field-hint">
                <i class="fa-solid fa-circle-info"></i>
                Texto de ayuda opcional
              </p>
            </div>
          </div>

        </div>

        <!-- Repetir form-section según sea necesario -->

      </form>
    }
  </div>
</div>
```

---

## 🎨 Clases CSS Estándares (Globales en `_components.scss`)

### Contenedores
- **`.page-container.container-medium`**: Contenedor principal del formulario
- **`.content-card`**: Card wrapper único para todo el contenido

### Formulario
- **`.standard-form`**: Clase del `<form>` (única — eliminar clases locales como `.user-form`, `.patient-form`, etc.)
- **`.form-section form-section--compact`**: Sección lógica del formulario. **SIEMPRE usar `--compact`** en todos los formularios (título `--font-size-base` 14px, borde 1px). La variante sin `--compact` (título 18px, borde 2px) está **deprecada** y no debe usarse
  - **`.form-section--collapsible`**: Sección colapsable; requiere `.section-content` como wrapper del contenido
  - **`.is-collapsed`**: Modificador dinámico en colapsables (binding: `[class.is-collapsed]="isSectionCollapsed('key')"`)
  - **`.section-title`**: Título de sección con ícono y badges
  - **`.section-icon`**: Ícono del título (color primary)
  - **`.section-description`**: Descripción opcional de la sección
  - **`.optional-badge`**: Badge "Opcional" en títulos
  - **`.collapse-chevron`**: Ícono chevron que rota en secciones colapsables
- **`.form-row`**: Grid responsive (auto-fit, minmax 280px) — 2 cols en desktop
- **`.form-row-inline`**: Grid de 2 columnas fijas (1 en móvil)
- **`.form-row-3`**: Grid de 3 columnas fijas (1 en móvil)
- **`.form-row-4`**: Grid de 4 columnas fijas (2 en tablet, 1 en móvil)

### Campos (Sistema Completo)
- **`.form-group`**: Contenedor de un campo individual con todos sus elementos
  - **`.form-label`**: Etiqueta del campo con soporte para `.required`
  - **`.form-input`**: Input estándar con estados hover, focus, error y disabled
  - **`.input-error`**: Modificador para inputs con error (borde rojo)
  - **`.error-message`**: Mensaje de validación bajo el input
  - **`.field-hint`**: Texto de ayuda opcional con ícono info

### Select Custom (`app-form-select`)
- Reemplaza `<select>` nativos con un dropdown estilizado y consistente
- Implementa `ControlValueAccessor` → funciona con `formControlName` y `ngModel`
- Usa las mismas variables `--input-*` que el resto de inputs
- Incluye: chevron animado, botón clear, keyboard navigation, error state

```html
<app-form-select
  formControlName="gender"
  [options]="genderOptions"
  placeholder="— Seleccionar —"
  [required]="true"
  [error]="hasError('gender') ? 'Campo requerido' : null"
></app-form-select>
```

```typescript
// Las opciones deben ser SelectOption[] = { value: string; label: string }[]
import { FormSelectComponent, SelectOption } from 'shared/components/form-select/form-select';

genderOptions: SelectOption[] = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Femenino', label: 'Femenino' }
];
```

### Input de Contraseña
- **`.password-input-wrapper`**: Contenedor del input de contraseña
  - **`.toggle-password-btn`**: Botón para mostrar/ocultar contraseña

### Títulos y Textos
- **`.required`**: Asterisco de campo requerido (*) en rojo
- **`.optional-badge`**: Badge "Opcional" en títulos de sección

### Botones y Acciones
- **`.header-form-actions`**: Contenedor de botones en el header (responsive)
  - **`.btn-spinner`**: Spinner animado dentro de botón

### Alertas
- **`.alert`**: Sistema de alertas mejorado con variantes
  - **`.alert-danger`**: Alerta de error
  - **`.alert-icon`**: Ícono de la alerta
  - **`.alert-message`**: Mensaje de la alerta
  - **`.alert-close`**: Botón para cerrar alerta

### Estados de Carga
- **`.loading-container`**: Contenedor de estado de carga principal con spinner y texto
- **`.loading-small`**: Estado de carga compacto inline
- **`.spinner`** / **`.spinner-small`**: Spinners animados

### Sistema de Tooltips CSS
- **`[data-tooltip]`**: Atributo para tooltips CSS puros sin JavaScript
  - Uso: `<span data-tooltip="Texto del tooltip">?</span>`
  - Configuración: min-width 200px, max-width 400px
  - Posición: Arriba del elemento con flecha
  - Diseño: Fondo oscuro, texto blanco, letra pequeña

### Mensajes
- **`.warning-message`**: Mensaje de advertencia inline con borde izquierdo amarillo

---

## 📐 Variables CSS a Usar

### Espaciado
```scss
gap: var(--spacing-sm);                 // 6px - Para elementos muy cercanos
gap: var(--spacing-md);                 // 10px - Gap estándar
gap: var(--spacing-lg);                 // 14px - Gap entre form-groups
gap: var(--spacing-xl);                 // 20px - Espaciado grande
padding: var(--spacing-2xl);            // 28px - Padding de cards

// Espaciado específico de formularios
padding: var(--form-section-spacing);   // 24px - Separación entre secciones de form
```

### Input Sizing (Estándar Global)
```scss
// Definidos en _variables.scss — controlan el tamaño de TODOS los inputs del SaaS
--input-padding-y: 8px;                       // Padding vertical
--input-padding-x: 14px;                      // Padding horizontal
--input-font-size: var(--font-size-sm);       // 13px
--input-line-height: 1.2;                     // Line height compacto
--input-border-radius: var(--radius-md);      // Border radius
--input-height: 38px;                         // Altura fija de TODOS los inputs
--input-label-font-size: var(--font-size-sm); // Font size de labels
--input-label-font-weight: var(--font-weight-medium); // Font weight de labels
```

### Input Height (Estándar Global)
Todos los inputs, selects, autocompletes y date pickers usan `height: var(--input-height)` (38px) para alineación vertical perfecta en filas:

| Componente | Selector CSS | Archivo |
|---|---|---|
| Text/number/email/tel | `.form-input`, `.form-control` | `_components.scss` |
| Custom select | `.select-trigger` | `form-select.scss` |
| Date picker | `.datepicker-input` | `date-picker.scss` |
| Date range picker | `.range-picker-wrapper` | `date-range-picker.scss` |
| Patient autocomplete | `.autocomplete-input` | `patient-autocomplete.scss` |
| Dentist autocomplete | `.autocomplete-input` | `dentist-autocomplete.scss` |
| Location autocomplete | `.autocomplete-input` | `location-autocomplete.scss` |
| Service autocomplete | `.autocomplete-input` | `service-autocomplete.scss` |
| Supplier autocomplete | `.autocomplete-input` | `supplier-autocomplete.scss` |
| Dentist select | `.select-input` | `dentist-select.scss` |
| **Textarea** | `textarea.form-input` | `_components.scss` — `height: auto` (excepción) |

### Label Line-Height (Estándar Global)
Todas las labels usan `line-height: var(--line-height-tight)` (1.2) para altura consistente:
- `.form-group .form-label` en `_components.scss`
- `.datepicker-label` en `date-picker.scss`
- `.select-label` en `form-select.scss` y `dentist-select.scss`
- `.autocomplete-label` en los 5 autocomplete components

**Componentes que usan estas variables:**
- `.form-input` / `.form-control` (global en `_components.scss`)
- `.form-label` (global en `_components.scss`)
- `app-patient-autocomplete`, `app-dentist-autocomplete`, `app-service-autocomplete`
- `app-location-autocomplete`, `app-supplier-autocomplete`
- `app-date-picker`, `app-date-range-picker`
- `app-form-select` (custom select component)

**Para cambiar el tamaño de inputs en todo el SaaS**, solo modificar las variables en `_variables.scss`.

### Colores
```scss
// Texto
color: var(--text-primary);   // Texto principal
color: var(--text-secondary);  // Texto secundario
color: var(--text-tertiary);   // Texto terciario
color: var(--text-muted);      // Texto deshabilitado

// Bordes
border: 1px solid var(--border-primary);
border: 1px solid var(--border-medium);

// Fondos
background: var(--surface-primary);
background: var(--surface-secondary);

// Estados
color: var(--error-500);       // Error
color: var(--success-500);     // Éxito
color: var(--primary-500);     // Principal
```

### Tipografía
```scss
font-size: var(--font-size-xs);      // 11px - Hints, badges
font-size: var(--font-size-sm);      // 13px - Labels, mensajes
font-size: var(--font-size-base);    // 14px - Inputs, texto
font-size: var(--font-size-lg);      // 16px - Subtítulos
font-size: var(--font-size-xl);      // 18px - NO usar en section-title de formularios

font-weight: var(--font-weight-medium);    // 500
font-weight: var(--font-weight-semibold);  // 600
font-weight: var(--font-weight-bold);      // 700
```

### Bordes y Sombras
```scss
border-radius: var(--radius-sm);  // 6px
border-radius: var(--radius-md);  // 8px
border-radius: var(--radius-lg);  // 12px

box-shadow: var(--shadow-sm);
box-shadow: var(--shadow-md);
```

---

## 🎯 Guías de Implementación

### ✅ HACER
1. **Usar `container-medium`** para el ancho del formulario
2. **Un solo `content-card`** como wrapper
3. **Botones en el header** usando slot `actions` con `[sticky]="true"` en el page-header
4. **`form-row-4`** cuando hay 4 campos relacionados del mismo peso (ej: código, nombre, categoría, unidad)
5. **`form-row-3`** cuando hay 3 campos en una fila (ej: nombre, email, teléfono)
6. **Secciones colapsables** para campos opcionales/secundarios (reduce scroll inicial)
7. **`form-section--compact`** en **TODAS** las secciones de formulario (es el estándar único)
8. **Labels en una línea** con required inline
9. **Variables globales** para todos los estilos
10. **Mensajes de error concisos** bajo los inputs
11. **Fusionar secciones** cuando tienen campos relacionados (objetivo: max 3 secciones por formulario)

### ❌ NO HACER
1. ❌ Cards dentro de cards (redundancia)
2. ❌ Botones al final del formulario (siempre en el header)
3. ❌ Estilos hardcodeados (usar variables)
4. ❌ Clases de formulario locales por componente (`.patient-form`, `.user-form` — usar `.standard-form`)
5. ❌ Una sola sección enorme sin agrupar campos
6. ❌ Una fila por campo cuando caben 3-4 campos en una misma fila
7. ❌ Mezclar h2/h3 para section-title (usar solo h3)
8. ❌ `rows="4"` o mayor en textareas — usar `rows="2"` o `rows="3"`
9. ❌ `class="form-section"` sin `--compact` — siempre usar `class="form-section form-section--compact"`
10. ❌ Títulos de sección grandes (`--font-size-xl`) — el estándar es `--font-size-base` (14px) vía `--compact`

---

## 📱 Responsive

### Desktop (>768px)
- `.form-row`: 2 columnas
- `.form-row-inline`: 2 columnas
- `.form-row-3`: 3 columnas
- `.form-row-4`: 4 columnas
- `.header-form-actions`: horizontal

### Tablet (≤768px)
- `.form-row`: 1 columna
- `.form-row-inline`: 1 columna
- `.form-row-3`: 1 columna
- `.form-row-4`: 2 columnas
- `.header-form-actions`: flex-wrap

### Mobile (≤480px)
- Todo a 1 columna
- `.header-form-actions`: vertical, botones full-width

---

## � Sistema de Tooltips CSS

### Uso Básico
```html
<!-- Badge circular con tooltip -->
<span class="info-badge" data-tooltip="Descripción del elemento">i</span>

<!-- Ícono con tooltip -->
<i class="fa-solid fa-circle-info" data-tooltip="Información adicional"></i>

<!-- Texto con tooltip -->
<span data-tooltip="Ayuda contextual">Texto con ayuda</span>

<!-- Ejemplo del user-form (badge circular gris) -->
<span class="role-info-icon" data-tooltip="{{ role.description }}">i</span>
```

### Características
- **Sin JavaScript**: Basado 100% en CSS puro con `::before` y `::after`
- **Posición**: Arriba del elemento con flecha apuntando hacia abajo
- **Diseño**: 
  - Fondo: `var(--neutral-800)` (gris oscuro)
  - Texto: blanco
  - Tamaño letra: `var(--font-size-xs)` (11px)
  - Padding: `8px 16px`
- **Ancho**: 
  - Min: 200px
  - Max: 400px
  - Permite saltos de línea automáticos
- **Animación**: Fade in/out con transform en hover (0.3s ease)
- **Z-index**: 1000 para asegurar visibilidad sobre otros elementos

### Implementación Global en `_components.scss`
```scss
[data-tooltip]:not([data-tooltip=""]) {
  position: relative;
  cursor: help;

  &::before,
  &::after {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
    z-index: 1000;
  }

  // Flecha del tooltip
  &::before {
    content: '';
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    border: 6px solid transparent;
    border-top-color: var(--neutral-800);
  }

  // Contenido del tooltip
  &::after {
    content: attr(data-tooltip);
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    background: var(--neutral-800);
    color: white;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-family: var(--font-family-base);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-normal);
    font-style: normal;
    line-height: 1.4;
    white-space: normal;
    min-width: 200px;
    max-width: 400px;
    text-align: left;
    box-shadow: var(--shadow-lg);
  }

  &:hover::before,
  &:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
```

### Ventajas
- ✅ No requiere librerías externas
- ✅ No ocupa memoria JavaScript
- ✅ Funciona en todos los navegadores modernos
- ✅ Fácil de mantener (solo CSS)
- ✅ Consistente con el design system

---

## �🔗 Archivos de Referencia

### Implementación Base
- **HTML Referencia**: `src/app/features/users/components/user-form/user-form.html`
- **SCSS Específico**: `src/app/features/users/components/user-form/user-form.scss` (solo estilos únicos del componente)
- **TS**: `src/app/features/users/components/user-form/user-form.ts`

### Estilos Globales
- **Variables CSS**: `src/styles/_variables.scss`
  - Incluye `--form-section-spacing` para separación entre secciones de formularios
- **⭐ Componentes Globales**: `src/styles/_components.scss`
  - **Sección "SISTEMA DE FORMULARIOS ESTANDARIZADO"**: Todos los componentes de formulario
  - Incluye: `.form-section`, `.form-row`, `.form-group`, `.password-input-wrapper`, tooltips CSS, alertas, spinners, etc.
  - **IMPORTANTE**: La mayoría de estilos de formulario están aquí, NO en archivos de componentes individuales
- **Layout**: `src/styles/_layout.scss`

---

## 🚀 Estado de Implementación

### Fase 1 — CSS Foundation ✅
1. ✅ **Componentes globalizados**: Todos los estilos de formulario en `_components.scss`
2. ✅ **`form-row-3` / `form-row-4`**: Grids de 3 y 4 columnas para campos densos
3. ✅ **`form-section--compact`**: Variante de sección con menor padding
4. ✅ **`form-section--collapsible`**: Secciones colapsables con animación CSS
5. ✅ **Checkbox y toggle globalizados**: `.checkbox-label`, `.form-checkbox`, `.toggle-container`, `.toggle`, `.toggle-slider`, `.input-with-prefix`
6. ✅ **Textarea bug fix**: `max-height` corregido de 60px → 300px
7. ✅ **SCSS locales limpiados**: Estilos duplicados eliminados de `treatment-plan-form`, `purchase-order-form`, `invoice-form`, `treatment-form`, `service-form`, `product-form`

### Fase 2 — HTML Refactors ✅
8. ✅ **8 formularios con layout optimizado** (menos scroll, más densos):
   - `patient-form`: 5 secciones → 2 (datos principales + colapsable)
   - `service-form`: 4 secciones → 2 (básica + avanzada colapsable)
   - `product-form`: 3 secciones → 3 con `form-row-4` (más denso)
   - `supplier-form`: 3 secciones → 2 (proveedor + notas)
   - `treatment-form`: 5 secciones → 3 con `form-row-4`
   - `user-form`: Clase estandarizada, `form-row-3` para datos básicos
   - `category-form`: 2 secciones → 1 (estado inline)
   - `appointment-form`: 5 secciones → 2 (participantes + fecha/hora/motivo)

### Fase 3 — Homologación ✅
9. ✅ **`standard-form`** como única clase de `<form>` (sin clases locales)
10. ✅ **`form-input`** en lugar de `form-select` (clases unificadas)

### Fase 5 — Estandarización de Títulos y Altura de Inputs ✅
13. ✅ **`form-section--compact`** en TODAS las secciones de formulario (30+ secciones en 12 formularios)
14. ✅ **`--input-height: 38px`** aplicado a todos los inputs, selects, autocompletes y date pickers
15. ✅ **`line-height: var(--line-height-tight)`** en todas las labels de componentes custom
16. ✅ **Formularios actualizados**: patient-form, treatment-form, treatment-plan-form, service-form, product-form, supplier-form, category-form, purchase-order-form, invoice-form, payment-form, prescription-form, user-form, role-form

### Fase 4 — PageHeader Sticky ✅
11. ✅ **`[sticky]="true"`** en los 14 formularios: los botones Cancelar/Guardar siempre visibles al hacer scroll
12. ✅ **`PageHeaderComponent`**: Nuevo `@Input() sticky` con scroll detection y clase `.page-header--sticky` / `.is-scrolled`

### Base heredada
- ✅ **Sistema de tooltips CSS**: Implementado (sin JavaScript)
- ✅ **Sistema de alertas**: Con variantes y botón de cierre
- ✅ **14/14 formularios usan**: `container-medium`, `content-card`, `header-form-actions`, `standard-form`, `form-input`, `PageHeaderComponent`

---

## 📝 Notas Importantes

- **Priorizar mantenibilidad**: Un cambio en variables globales debe afectar todos los formularios
- **Evitar sobre-ingeniería**: Usar clases existentes antes de crear nuevas
- **Documentar excepciones**: Si un formulario necesita algo único, documentarlo aquí
- **Testing visual**: Validar en light/dark theme
