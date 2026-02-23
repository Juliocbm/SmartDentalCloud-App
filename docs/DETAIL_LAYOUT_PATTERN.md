# Detail Layout Pattern — SmartDentalCloud

Patrón estándar para todas las pantallas de tipo "Ver Detalle" (citas, pacientes, tratamientos, facturas, etc.).

## Principios

1. **Consistencia visual** — Todas las pantallas "ver" usan las mismas clases globales de `_components.scss`
2. **No duplicar datos** — Eliminar secciones de resumen que repitan info ya visible en tabs
3. **Secciones con identidad** — Cada bloque de datos usa `info-section` con su `h3` + icono
4. **Compacto pero claro** — Grid multi-columna para datos relacionados, sin desperdiciar espacio
5. **Status visible** — Badge de estado en el page-header; banners solo para estados terminales
6. **Tabs para entidades complejas** — Cuando una entidad tiene muchos datos, usar tabs (segmented control)
7. **Empty states consistentes** — Usar `.empty-state` global para estados vacíos

---

## Variantes de Detalle

### A) Detalle Simple (sin tabs)
Para entidades con pocos datos (ej: cita, factura).

```
.detail-container
├── app-page-header           ← Breadcrumbs + título + [actions] slot
│
├── .detail-header            ← Card oscuro con status + datos clave + acciones
│   ├── .header-content
│   │   ├── .title-section    ← Badge de estado
│   │   └── .header-info      ← Grid de datos clave
│   └── .header-action-bar    ← Botones de acción de estado
│
├── .status-banner            ← (Condicional) Banner de estado terminal
│
└── .detail-body
    ├── .info-two-col         ← Grid 2 columnas
    │   ├── .info-section
    │   └── .info-section
    └── .info-section         ← Secciones full-width
```

### B) Detalle con Tabs (entidad compleja)
Para entidades con muchos datos organizados en categorías (ej: paciente).

```
.detail-container
├── app-page-header           ← Breadcrumbs + título + [badge + acciones] en slot
│
├── .tabs-bar                 ← Barra de navegación por tabs (segmented control)
│   └── .tabs-nav
│       └── .tab-button       ← Cada tab (con icono + texto)
│
└── .detail-body
    └── (contenido del tab activo)
        ├── .info-two-col > .info-section (datos en columnas)
        ├── .info-section > .info-card > .info-row (lista de datos)
        └── .empty-state (cuando no hay datos)
```

---

## Clases Globales Disponibles (`_components.scss`)

### Contenedores

| Clase | Propósito |
|-------|-----------|
| `.detail-container` | Wrapper con max-width y padding |
| `.detail-header` | Card principal oscuro (`--surface-primary`, `--shadow-sm`) |
| `.detail-body` | Grid de secciones con `gap: --spacing-2xl` |

### Header

| Clase | Propósito |
|-------|-----------|
| `.header-content` | Contenedor del contenido del header |
| `.title-section` | Flex con badge de estado (y opcionalmente h1) |
| `.status-badge` | Badge con icono + texto (`border-radius: full`) |
| `.header-info` | Grid responsive de items informativos |
| `.info-item` | Item con icono + label + value |
| `.header-action-bar` | Barra de acciones separada por `border-top` |

### Secciones

| Clase | Propósito |
|-------|-----------|
| `.info-section` | Card de sección (`--surface-primary`, `--shadow-sm`) con `h3` |
| `.info-card` | Contenedor de filas dentro de una sección |
| `.info-row` | Fila con `.info-label` (min-width 180px) + `.info-value` |
| `.info-row.alert-row` | Fila destacada con fondo de error |
| `.section-header-with-action` | Encabezado de sección con botón inline (ej: "Editar") |
| `.info-empty` | Empty state compacto dentro de un `info-card` |

### Layouts Multi-Columna

| Clase | Propósito |
|-------|-----------|
| `.info-two-col` | Grid 2 columnas (→ 1 columna en mobile) |
| `.info-three-col` | Grid 3 columnas (→ 1 columna en mobile) |

### Empty States

| Clase | Propósito |
|-------|-----------|
| `.empty-state` | Empty state completo para sección o tab sin datos (icono en círculo, título, descripción, botón) |
| `.empty-state-sm` | Variante compacta de empty-state para dentro de cards/secciones |
| `.info-empty` | Empty state inline mínimo dentro de un `info-card` (solo icono + texto) |

### Banners de Estado

| Clase | Propósito |
|-------|-----------|
| `.status-banner` | Banner base |
| `.status-banner--success` | Verde (completado) |
| `.status-banner--error` | Rojo (cancelado) |
| `.status-banner--warning` | Amarillo (no-show, advertencia) |
| `.status-banner--info` | Azul (informativo) |

### Botones (en contexto de detalle)

| Clase | Propósito |
|-------|-----------|
| `.btn.btn-outline` | Acción secundaria neutra (ej: Editar) |
| `.btn.btn-outline.btn-danger` | Acción destructiva outline (ej: Desactivar) |
| `.btn.btn-outline.btn-success` | Acción positiva outline (ej: Activar) |
| `.btn.btn-primary` | Acción principal (ej: Confirmar, Guardar) |
| `.btn.btn-sm` | Botón pequeño (ej: Editar inline en sección) |
| `.link-primary` | Link estilizado (azul, hover underline) |
| `button.link-primary` | Mismo estilo pero como `<button>` nativo |

---

## Tabs — Patrón "Segmented Control"

Para entidades complejas con muchas categorías de datos (ej: paciente con 7+ secciones), usar tabs tipo segmented control.

### Estilos (componente local)

Los tabs se definen en el SCSS del componente (no son globales porque no todas las pantallas usan tabs):

```scss
.tabs-bar {
  background: var(--surface-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xs);
  margin-bottom: var(--spacing-xl);
}

.tabs-nav {
  display: flex;
  gap: var(--spacing-xs);

  .tab-button {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--text-tertiary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    white-space: nowrap;

    &:hover {
      color: var(--text-primary);
      background: var(--surface-tertiary);
    }

    &.active {
      color: var(--primary-400);
      background: var(--surface-primary);
      box-shadow: var(--shadow-sm);
      font-weight: var(--font-weight-semibold);
    }

    i { font-size: var(--font-size-xs); }
  }
}
```

### HTML

```html
<div class="tabs-bar">
  <div class="tabs-nav">
    <button class="tab-button" [class.active]="activeTab() === 'info'" (click)="setActiveTab('info')">
      <i class="fa-solid fa-user"></i> Información General
    </button>
    <button class="tab-button" [class.active]="activeTab() === 'medical'" (click)="setActiveTab('medical')">
      <i class="fa-solid fa-heartbeat"></i> Historia Médica
    </button>
    <!-- más tabs -->
  </div>
</div>
```

### Responsive (mobile)

```scss
@media (max-width: 768px) {
  .tabs-nav {
    flex-direction: column;
    .tab-button { justify-content: flex-start; }
  }
}
```

---

## Secciones Consolidadas

Cuando una sección tiene pocos campos relacionados (ej: Historia Médica, Datos Fiscales), **usar una sola `info-section` con `info-rows`** en lugar de múltiples secciones separadas.

### ✅ Correcto — Una sola card con filas

```html
<div class="info-section">
  <h3><i class="fa-solid fa-heartbeat"></i> Historia Médica</h3>
  <div class="info-card">
    <div class="info-row">
      <span class="info-label">Tipo de Sangre:</span>
      <span class="info-value">A+</span>
    </div>
    <div class="info-row">
      <span class="info-label">Alergias:</span>
      <span class="info-value">Penicilina</span>
    </div>
    <div class="info-row">
      <span class="info-label">Enfermedades Crónicas:</span>
      <span class="info-value">Diabetes tipo 2</span>
    </div>
  </div>
</div>
```

### ❌ Incorrecto — Múltiples cards para campos simples

```html
<!-- NO HACER: una sección por cada campo -->
<div class="info-two-col">
  <div class="info-section">
    <h3>Tipo de Sangre</h3>
    <div class="blood-type-badge">A+</div>  <!-- clase custom innecesaria -->
  </div>
  <div class="info-section">
    <h3>Enfermedades Crónicas</h3>
    <div class="info-card">...</div>
  </div>
</div>
```

### Sección con Acción Inline

Para secciones con un botón de edición (ej: Datos Fiscales):

```html
<div class="info-section">
  <div class="section-header-with-action">
    <h3><i class="fa-solid fa-file-invoice"></i> Datos Fiscales</h3>
    <button class="btn btn-outline btn-sm" (click)="toggleEdit()">
      <i class="fa-solid fa-pen"></i> Editar
    </button>
  </div>
  <div class="info-card">
    <div class="info-row">...</div>
  </div>
</div>
```

---

## Empty States

### Tab completo vacío → `.empty-state`

```html
<div class="empty-state">
  <i class="fa-solid fa-heartbeat"></i>
  <h3>Sin Historia Médica</h3>
  <p>Este paciente no tiene información médica registrada</p>
  <button class="btn btn-primary" (click)="editPatient()">
    <i class="fa-solid fa-plus"></i> Agregar Historia Médica
  </button>
</div>
```

### Sección vacía dentro de tab → `.empty-state-sm`

```html
<div class="empty-state empty-state-sm">
  <i class="fa-solid fa-folder-open"></i>
  <h3>Sin Archivos</h3>
  <p>Este paciente no tiene archivos adjuntos</p>
  <button class="btn btn-primary">Subir Primer Archivo</button>
</div>
```

### Campo vacío inline dentro de info-card → `.info-empty`

```html
<div class="info-card">
  <div class="info-empty">
    <i class="fa-solid fa-circle-info"></i>
    Sin información de contacto registrada
  </div>
</div>
```

---

## Page Header — Subtitle para Identificadores de Entidad

Cuando una entidad tiene un **código, clave, número de referencia o identificador único** visible al usuario, este debe mostrarse en el `[subtitle]` del `app-page-header`. Esto evita crear secciones `detail-header` solo para mostrar un identificador y mantiene la información clave visible de inmediato.

### Regla

> Si la entidad tiene un identificador formal (folio, número de plan, clave, número de orden, etc.), usar `[subtitle]` en el `app-page-header`. **No** crear una sección `detail-header` solo para mostrar este dato.

### ✅ Correcto — Identificador en subtitle

```html
<app-page-header
  [title]="plan()?.title || 'Plan de Tratamiento'"
  [subtitle]="plan()?.planNumber || ''"
  [icon]="'fa-clipboard-list'"
  [showBackButton]="true"
  [breadcrumbs]="breadcrumbItems">
  <div title-extra>
    <span class="badge" [ngClass]="getStatusConfig(plan()!.status).class">
      {{ getStatusConfig(plan()!.status).label }}
    </span>
  </div>
  <div actions>
    <!-- botones -->
  </div>
</app-page-header>
```

### ❌ Incorrecto — Identificador en detail-header redundante

```html
<!-- NO: crear una sección entera solo para mostrar un número de plan -->
<app-page-header [title]="plan()?.title" ...></app-page-header>
<div class="detail-header">
  <div class="header-content">
    <div class="header-info">
      <div class="info-item">
        <span class="label">Plan:</span>
        <span class="value">{{ plan()?.planNumber }}</span>
      </div>
    </div>
  </div>
</div>
```

### Entidades y sus identificadores

| Entidad | Campo para `subtitle` | Ejemplo |
|---------|----------------------|---------|
| Plan de Tratamiento | `planNumber` | `PLAN-202602-F7F97433` |
| Orden de Compra | `orderNumber` | `OC-2026-0001` |
| Factura | `serie`-`folio` | `A-0001` |
| Receta | ID corto o folio | `9D1A5FBE` |
| Cita | Fecha + Hora | `21 Feb 2026, 10:00` |
| Tratamiento | Nombre del servicio | `Limpieza Dental` |
| Paciente | *(no aplica — el nombre ES el título)* | — |
| Usuario | *(no aplica — el nombre ES el título)* | — |

### Cuándo usar `subtitle` vs `detail-header`

| Escenario | Usar |
|-----------|------|
| Solo necesitas mostrar un identificador/clave | `[subtitle]` en page-header |
| Necesitas mostrar 2-3 datos clave + acciones de workflow | `detail-header` con `header-info` + `header-action-bar` |
| El identificador ya está en una sección del body | Solo `[subtitle]`, no duplicar |

### Anatomía completa del page-header en detalle

```
┌────────────────────────────────────────────────────────────────────┐
│  ← 🏠 Dashboard > Entidades > Detalle                             │
│                                                                    │
│  📋 Título de Entidad  [● Badge Estado]    [🕐] [Acción] [Acción] │
│     CLAVE-2026-0001                                                │
│     ↑ subtitle          ↑ title-extra       ↑ actions              │
└────────────────────────────────────────────────────────────────────┘
```

---

## Page Header — Acciones y Badge de Estado

El badge de estado va en el slot `[title-extra]` y los botones de acción en el slot `[actions]` del `app-page-header`:

```html
<app-page-header [title]="'Nombre del Paciente'" [icon]="'fa-user'"
  [showBackButton]="true" [breadcrumbs]="breadcrumbItems">
  <div title-extra>
    <span class="status-badge badge-active">Activo</span>
  </div>
  <div actions>
    <button class="btn btn-icon" (click)="showAuditModal.set(true)" title="Auditoría">
      <i class="fa-solid fa-clock-rotate-left"></i>
    </button>
    <button class="btn btn-outline">
      <i class="fa-solid fa-pen"></i> Editar
    </button>
    <button class="btn btn-outline btn-danger">
      <i class="fa-solid fa-toggle-off"></i> Desactivar
    </button>
  </div>
</app-page-header>
```

**Reglas de botones en el header:**
- Auditoría → `btn btn-icon` con `fa-clock-rotate-left` (siempre primero)
- Editar → `btn btn-outline` (neutro)
- Desactivar → `btn btn-outline btn-danger` (destructivo, outline)
- Activar → `btn btn-outline btn-success` (positivo, outline)
- Acciones de estado (Confirmar, Completar) → dentro de `header-action-bar` en `detail-header`

**Reglas de badge de estado:**
- Badges van en `<div title-extra>`, **NUNCA** en `<div actions>`
- Usar `.badge` para estados con múltiples variantes
- Usar `.status-badge` para estados binarios (Activo/Inactivo)

---

## Reglas para Nuevas Pantallas "Ver Detalle"

1. **Siempre usar `detail-container`** como wrapper principal
2. **No crear h1 dentro del content** — el título va en `app-page-header`
3. **Identificador de entidad** → en `[subtitle]` del `app-page-header` (no en `detail-header`)
4. **No duplicar datos** — si un dato ya está en una sección, no repetirlo en el header
5. **Badge de estado** → en el slot `[title-extra]` del `app-page-header`
6. **Acciones de edición/desactivación** → en `app-page-header` `[actions]` con estilo outline
7. **Acciones de estado (confirmar, completar)** → en `header-action-bar` dentro de `detail-header`
8. **Usar `info-two-col` / `info-three-col`** para agrupar secciones relacionadas
9. **Usar `status-banner`** para estados terminales (entre header y body)
10. **Usar `alert-row`** para filas que requieren atención (errores, cancelaciones)
11. **Consolidar campos simples** en una sola `info-section` con `info-rows` (no múltiples cards)
12. **Tabs** para entidades con 3+ categorías de datos (copiar patrón segmented control)
13. **Empty states**: `.empty-state` para tabs vacíos, `.empty-state-sm` para secciones, `.info-empty` para inline
14. **SCSS del componente solo contiene overrides específicos** — NO redefinir clases globales
15. **Usar siempre variables CSS** — nunca hard-codear colores, spacing o font-sizes
16. **Responsive ya está resuelto globalmente** — no repetir media queries (excepto tabs)

---

## Checklist de Auditoría SCSS

Antes de dar por terminado un componente de detalle, verificar:

- [ ] No redefine `.btn-outline`, `.btn-sm`, `.btn-primary`, `.link-primary` (ya son globales)
- [ ] No usa colores hex/rgb directos — solo variables CSS (`--primary-500`, `--text-secondary`, etc.)
- [ ] No usa spacing en px — solo variables (`--spacing-md`, `--spacing-lg`, etc.)
- [ ] No usa font-sizes hard-coded — solo variables (`--font-size-sm`, `--font-size-xl`, etc.)
- [ ] Usa `.empty-state` / `.empty-state-sm` para vacíos (no clases custom `.empty-*`)
- [ ] Usa `.info-section` > `.info-card` > `.info-row` para datos (no custom cards)
- [ ] Usa `.section-header-with-action` para headers con botón (no layout custom)

---

## Archivos de Referencia

- **Design system global:** `src/styles/_components.scss` (sección DETAIL PAGE COMPONENTS)
- **Variables CSS:** `src/styles/_variables.scss`
- **Implementación simple (sin tabs):** `src/app/features/appointments/components/appointment-detail/`
- **Implementación con tabs:** `src/app/features/patients/components/patient-detail/`
