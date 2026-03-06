# Section Header — Estándar de Diseño

Patrón reutilizable para cabeceras de secciones en vistas de detalle.

**Archivo CSS**: `src/styles/_components.scss` → `.section-header`

---

## Estructura HTML

### Cabecera con un botón

```html
<div class="section-header">
  <h3 class="section-header__title">
    <i class="fa-solid fa-icon"></i>
    Título de la Sección
  </h3>
  <button class="btn btn-outline btn-sm" (click)="action()">
    <i class="fa-solid fa-plus"></i>
    Acción
  </button>
</div>
<hr>
```

### Cabecera con múltiples botones

```html
<div class="section-header">
  <h3 class="section-header__title">
    <i class="fa-solid fa-icon"></i>
    Título de la Sección
  </h3>
  <div class="section-header__actions">
    <button class="btn btn-outline btn-sm" (click)="secondaryAction()">
      <i class="fa-solid fa-icon"></i>
      Acción Secundaria
    </button>
    <button class="btn btn-outline btn-sm" (click)="primaryAction()">
      <i class="fa-solid fa-plus"></i>
      Acción Principal
    </button>
  </div>
</div>
<hr>
```

### Cabecera con badge en el título

```html
<div class="section-header">
  <h3 class="section-header__title">
    <i class="fa-solid fa-image"></i>
    Radiografías
    <span class="badge badge-info">{{ count }}</span>
  </h3>
  <button class="btn btn-outline btn-sm" (click)="action()">
    <i class="fa-solid fa-upload"></i>
    Subir
  </button>
</div>
<hr>
```

### Cabecera con descripción (usado en Configuraciones)

```html
<div class="section-header">
  <div class="section-header__info">
    <h3 class="section-header__title">
      <i class="fa-solid fa-icon"></i>
      Título de la Sección
    </h3>
    <p class="section-header__description">Texto descriptivo debajo del título</p>
  </div>
  <button class="btn btn-outline btn-sm" (click)="action()">
    <i class="fa-solid fa-plus"></i>
    Acción
  </button>
</div>
<hr>
```

> **Nota:** Usar `__info` como wrapper solo cuando hay `__description`. Si no hay descripción, el `h3` va directo dentro de `.section-header`.

### Cabecera con botón Guardar (con estado loading)

```html
<div class="section-header">
  <div class="section-header__info">
    <h3 class="section-header__title">
      <i class="fa-solid fa-icon"></i>
      Título de la Sección
    </h3>
    <p class="section-header__description">Descripción de la sección</p>
  </div>
  <button class="btn btn-outline btn-sm" [disabled]="saving()" (click)="save()">
    @if (saving()) {
      <span class="btn-spinner"></span>
      Guardando...
    } @else {
      <i class="fa-solid fa-floppy-disk"></i>
      Guardar
    }
  </button>
</div>
<hr>
```

### Cabecera sin botón (solo lectura)

```html
<div class="section-header">
  <h3 class="section-header__title">
    <i class="fa-solid fa-icon"></i>
    Título de la Sección
  </h3>
</div>
<hr>
```

---

## Reglas de Estilo

### Botones

| Regla | Valor |
|-------|-------|
| Clases | `btn btn-outline btn-sm` |
| Variantes de color | **NO usar** (`btn-success`, `btn-primary`, etc.) |
| Icono | Siempre incluir icono Font Awesome antes del texto |
| Múltiples botones | Envolver en `<div class="section-header__actions">` o `<div class="btn-group">` |

### Título

| Propiedad | Valor |
|-----------|-------|
| Elemento | `<h3 class="section-header__title">` |
| Font size | `var(--font-size-base)` |
| Font weight | `var(--font-weight-semibold)` |
| Color | `var(--text-primary)` |
| Icono size | `var(--font-size-lg)` (1rem / 16px) |
| Icono color | `var(--primary-600)` |

### Separador

| Propiedad | Valor |
|-----------|-------|
| Elemento | `<hr>` inmediatamente después de `.section-header` |
| Estilo | `1px solid var(--border-primary)` |
| Ancho | 100% |
| Margin | `var(--spacing-md) 0 var(--spacing-lg) 0` |

### Layout

| Propiedad | Valor |
|-----------|-------|
| Display | `flex` |
| Align items | `center` (título y botones alineados verticalmente) |
| Justify content | `space-between` |
| Padding | `var(--spacing-md) 0` |
| Min height | `40px` |

---

## Nota Técnica: Especificidad CSS

El selector `.info-section h3` tiene estilos globales (font-size, margin, padding, border) que **no deben** aplicarse a `.section-header__title`.

Esto se resuelve con `:not()` en `_components.scss`:

```scss
.info-section {
  h3:not(.section-header__title) {
    // Estilos legacy solo para h3 que NO son section headers
  }
}
```

**Nunca** agregar overrides con `!important` o `::ng-deep` para resolver este conflicto.

---

## Secciones que Usan este Estándar

### En `patient-detail.html`

| Sección | Icono | Botón(es) |
|---------|-------|-----------|
| Información del Paciente | `fa-user` | — |
| ↳ Datos Personales (info-group) | `fa-user` | — |
| ↳ Contacto (info-group) | `fa-address-book` | — |
| ↳ Identificación Oficial (info-group) | `fa-id-card` | — |
| ↳ Dirección (info-group) | `fa-location-dot` | — |
| ↳ Contacto de Emergencia (info-group) | `fa-phone-volume` | — |
| Historia Médica | `fa-heartbeat` | Editar / Cancelar |
| Alergias | `fa-shield-virus` | Nueva Alergia |
| Consentimientos | `fa-file-signature` | Configurar PIN, Nuevo Consentimiento |
| Diagnósticos | `fa-clipboard-list` | Nuevo Diagnóstico |
| Radiografías | `fa-image` | Subir Radiografía |
| Datos Fiscales | `fa-file-invoice` | Editar / Cancelar |
| Resumen Financiero | `fa-wallet` | — |
| Historial Clínico | `fa-clock-rotate-left` | — |
| Historial de Cambios | `fa-list-check` | — |
| Archivos Adjuntos | `fa-paperclip` | Subir Archivo |

### En `treatment-detail.html`

| Sección | Icono | Botón(es) |
|---------|-------|-----------|
| Información del Tratamiento | `fa-info-circle` | — |
| ↳ General (info-group) | `fa-file-medical` | — |
| ↳ Información Dental (info-group) | `fa-tooth` | — |
| ↳ Fechas y Duración (info-group) | `fa-calendar-days` | — |
| Seguimientos | `fa-clipboard-check` | Nuevo Seguimiento |
| Materiales Usados | `fa-boxes-stacked` | Agregar Material |
| Sesiones | `fa-layer-group` | Nueva Sesión |

### En `settings-page.html` y sub-componentes

| Sección | Icono | Botón(es) |
|---------|-------|-----------|
| General | `fa-gear` | Guardar Cambios |
| Sucursales | `fa-location-dot` | Nueva Sucursal |
| Horario Laboral | `fa-clock` | Guardar Horario |
| Horarios por Dentista | `fa-user-doctor` | Guardar Horario (condicional) |
| Excepciones de Horario | `fa-calendar-xmark` | Nueva Excepción |
| Consentimientos | `fa-file-contract` | Nueva Plantilla |
| Correo (SMTP) | `fa-envelope` | Probar Conexión, Eliminar, Guardar SMTP |
| Branding | `fa-palette` | Guardar Branding |
| Dominio | `fa-globe` | Guardar Dominio |

### En componentes especializados

| Componente | Icono | Botón(es) |
|------------|-------|-----------|
| Odontograma | `fa-tooth` | — |
| Periodontograma | `fa-chart-line` | Comparar, Nuevo Periodontograma |
| Cefalometría | `fa-x-ray` | Nuevo Análisis |

---

## Sub-grupos dentro de una Sección (`.info-group`)

Cuando una sección contiene múltiples grupos de información (ej: General + Dental + Fechas), usar `.info-group` con subtítulos `<h4>` ligeros en lugar de múltiples `.section-header`.

**Jerarquía visual:** `section-header (h3)` > `info-group (h4)` > `info-rows`

```html
<div class="info-section">
  <div class="section-header">
    <h3 class="section-header__title">
      <i class="fa-solid fa-icon"></i>
      Título Principal
    </h3>
  </div>
  <hr>

  <div class="info-two-col">
    <div class="info-group">
      <h4 class="info-group__title">
        <i class="fa-solid fa-icon"></i> Grupo A
      </h4>
      <div class="info-card">
        <div class="info-row">...</div>
      </div>
    </div>
    <div class="info-group">
      <h4 class="info-group__title">
        <i class="fa-solid fa-icon"></i> Grupo B
      </h4>
      <div class="info-card">
        <div class="info-row">...</div>
      </div>
    </div>
  </div>
</div>
```

### Estilos del subtítulo `.info-group__title`

| Propiedad | Valor |
|-----------|-------|
| Elemento | `<h4 class="info-group__title">` |
| Font size | `var(--font-size-sm)` |
| Font weight | `var(--font-weight-semibold)` |
| Color | `var(--text-tertiary)` |
| Text transform | `uppercase` |
| Letter spacing | `0.05em` |
| Icono size | `var(--font-size-sm)` |
| Icono color | `var(--text-muted)` |

> **Regla:** Nunca usar múltiples `.section-header` dentro de un mismo tab para agrupar información relacionada. Usar `.info-group` para los sub-grupos.

---

## Variante Compacta

Para cabeceras dentro de secciones anidadas:

```html
<div class="section-header section-header--compact">
  <h3 class="section-header__title">
    <i class="fa-solid fa-icon"></i>
    Subtítulo
  </h3>
</div>
<hr>
```

Reduce padding vertical a `var(--spacing-sm)` y min-height a `32px`.
