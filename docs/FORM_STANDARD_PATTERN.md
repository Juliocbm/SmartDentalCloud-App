# Patrón Estándar de Formularios - SmartDentalCloud

## 📋 Objetivo
Este documento define el patrón estándar para todos los formularios en la aplicación, asegurando consistencia visual, mantenibilidad y escalabilidad.

---

## 🏗️ Estructura HTML Estándar

### Layout Principal
```html
<div class="page-container container-medium">
  <!-- Page Header con Actions -->
  <app-page-header
    [title]="isEditMode() ? 'Editar X' : 'Nuevo X'"
    [subtitle]="'Descripción del formulario'"
    [icon]="'fa-icon'"
    [showBackButton]="true"
    [backRoute]="'/ruta-lista'"
    [breadcrumbs]="breadcrumbItems()">
    
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
        
        <!-- Form Section -->
        <div class="form-section">
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
- **`.standard-form`** / **`.user-form`**: Clase del `<form>`
- **`.form-section`**: Sección lógica del formulario (sin card, padding vertical de `--form-section-spacing`)
  - **`.section-title`**: Título de sección con ícono y badges
  - **`.section-icon`**: Ícono del título (color primary)
  - **`.section-description`**: Descripción opcional de la sección
  - **`.optional-badge`**: Badge "Opcional" en títulos
- **`.form-row`**: Grid responsive (auto-fit, minmax 280px)
- **`.form-row-inline`**: Grid de 2 columnas fijas (1 en móvil)

### Campos (Sistema Completo)
- **`.form-group`**: Contenedor de un campo individual con todos sus elementos
  - **`.form-label`**: Etiqueta del campo con soporte para `.required`
  - **`.form-input`**: Input estándar con estados hover, focus, error y disabled
  - **`.input-error`**: Modificador para inputs con error (borde rojo)
  - **`.error-message`**: Mensaje de validación bajo el input
  - **`.field-hint`**: Texto de ayuda opcional con ícono info

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
font-size: var(--font-size-xl);      // 18px - Títulos de sección

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
3. **Botones en el header** usando slot `actions`
4. **form-section sin background/border** (solo padding vertical)
5. **Labels en una línea** con required inline
6. **Variables globales** para todos los estilos
7. **Mensajes de error concisos** bajo los inputs
8. **Hints opcionales** con ícono info
9. **Grid responsive** (2 cols → 1 col en móvil)

### ❌ NO HACER
1. ❌ Cards dentro de cards (redundancia)
2. ❌ Botones al final del formulario
3. ❌ Estilos hardcodeados (usar variables)
4. ❌ Labels en múltiples líneas sin necesidad
5. ❌ Espaciados inconsistentes
6. ❌ Clases CSS personalizadas por componente
7. ❌ Mezclar h2/h3 para section-title (usar h3)

---

## 📱 Responsive

### Desktop (>768px)
- `.form-row`: 2 columnas
- `.form-row-inline`: 2 columnas
- `.header-form-actions`: horizontal

### Tablet (≤768px)
- `.form-row`: 1 columna
- `.form-row-inline`: 1 columna
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

1. ✅ **user-form**: Patrón base establecido y refinado
2. ✅ **Componentes globalizados**: Todos los estilos de formulario movidos a `_components.scss`
3. ✅ **Sistema de tooltips CSS**: Implementado y funcional (sin JavaScript)
4. ✅ **Sistema de input de contraseña**: Con botón toggle show/hide
5. ✅ **Sistema de alertas**: Mejorado con variantes y botón de cierre
6. ✅ **Estados de carga**: Spinners y contenedores estandarizados
7. ⏳ **Migrar formularios existentes**: patient-form, appointment-form, product-form, supplier-form
8. ⏳ **Validar consistencia** visual en todos los formularios migrados

---

## 📝 Notas Importantes

- **Priorizar mantenibilidad**: Un cambio en variables globales debe afectar todos los formularios
- **Evitar sobre-ingeniería**: Usar clases existentes antes de crear nuevas
- **Documentar excepciones**: Si un formulario necesita algo único, documentarlo aquí
- **Testing visual**: Validar en light/dark theme
