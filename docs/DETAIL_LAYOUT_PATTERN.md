# Detail Layout Pattern — SmartDentalCloud

Patrón estándar para todas las pantallas de tipo "Ver Detalle" (citas, pacientes, tratamientos, facturas, etc.).

## Principios

1. **Consistencia visual** — Todas las pantallas "ver" usan las mismas clases globales de `_components.scss`
2. **No duplicar datos** — Eliminar secciones de resumen que repitan info ya visible en tabs
3. **Una sola sección de contenido** — Consolidar datos relacionados en una `info-section` con `info-group` sub-secciones
4. **Section headers BEM** — Títulos de sección con `.section-header` > `.section-header__title` + `<hr>`
5. **Compacto pero claro** — Grid multi-columna para datos relacionados, sin desperdiciar espacio
6. **Status visible** — Badge de estado en el page-header; banners solo para estados terminales
7. **Sidebar nav para tabs** — Entidades con 2+ categorías de datos usan sidebar nav vertical con content area
8. **Empty states consistentes** — `.empty-items` (dashed) para listas vacías, `.empty-state` para tabs vacíos

---

## Variantes de Detalle

### A) Detalle con Sidebar Nav (estándar)
Para entidades con 2+ categorías de datos (ej: cita, receta, paciente). Es el patrón preferido.

```
.detail-container
├── app-page-header              ← Breadcrumbs + título + [badge] title-extra + [botones] actions
│
├── .status-banner               ← (Condicional) Banner de estado terminal
│
└── .{entity}-layout             ← Grid: sidebar 200px + content 1fr
    ├── nav.{entity}-nav         ← Sidebar vertical con tabs
    │   └── button.nav-item      ← Cada tab (icono + texto + .nav-count opcional)
    │
    └── .{entity}-content        ← Área de contenido (flatten info-section/info-card)
        └── (contenido del tab activo)
            ├── .info-section > .section-header + <hr>
            │   ├── .info-two-col > .info-group (columnas)
            │   │   └── .info-group__title + .info-card > .info-row
            │   └── .info-group (full-width)
            ├── .table-container > .table (para listas tabulares)
            ├── .empty-items (lista vacía — dashed border)
            └── .empty-state (tab completamente vacío)
```

### B) Detalle con Sidebar Nav Grande (muchas categorías)
Para entidades con 7+ categorías (ej: paciente). Sidebar de 220px con más tabs.

```
.detail-container
├── app-page-header
├── .clinical-summary-bar        ← (Opcional) Resumen clínico compacto
│
└── .patient-layout              ← Grid: sidebar 220px + content 1fr
    ├── nav.patient-nav          ← Sidebar con muchos tabs + nav-count badges
    └── .patient-content         ← Contenido del tab activo (flatten)
```

### C) Detalle Simple (sin tabs)
Para entidades con muy pocos datos donde tabs no aportan valor.

```
.detail-container
├── app-page-header
├── .status-banner               ← (Condicional)
└── .detail-body
    └── .info-section > .section-header + <hr>
        ├── .info-two-col > .info-group
        └── .info-group
```

---

## Clases Globales Disponibles (`_components.scss`)

### Contenedores

| Clase | Propósito |
|-------|-----------|
| `.detail-container` | Wrapper con max-width y padding |
| `.detail-body` | Grid de secciones con `gap: --spacing-2xl` (solo para variante C sin tabs) |

### Secciones

| Clase | Propósito |
|-------|-----------|
| `.info-section` | Card de sección (`--surface-primary`, `--shadow-sm`) |
| `.section-header` | Contenedor flex del título de sección (con espacio para botón inline) |
| `.section-header__title` | `h3` con icono — título principal de la sección |
| `<hr>` | Separador visual después del `.section-header` |
| `.info-group` | Sub-sección dentro de un `info-section` |
| `.info-group__title` | `h4` con icono — subtítulo de grupo (uppercase, smaller) |
| `.info-card` | Contenedor de filas dentro de una sección o grupo |
| `.info-row` | Fila con `.info-label` (min-width 180px) + `.info-value` |
| `.info-row.alert-row` | Fila destacada con fondo de error |
| `.info-empty` | Empty state compacto inline dentro de un `info-card` (solo icono + texto) |

### Layouts Multi-Columna

| Clase | Propósito |
|-------|-----------|
| `.info-two-col` | Grid 2 columnas (→ 1 columna en mobile) |
| `.info-three-col` | Grid 3 columnas (→ 1 columna en mobile) |

### Empty States

| Clase | Propósito |
|-------|-----------|
| `.empty-state` | Empty state completo para página o tab sin datos (icono grande, título, descripción, botón) |
| `.empty-state-sm` | Variante compacta para dentro de cards/secciones |
| `.empty-items` | Empty state con **borde dashed** para listas/colecciones vacías (ej: medicamentos, consentimientos) |
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

## Sidebar Nav — Patrón de Tabs

Para entidades con 2+ categorías de datos, usar sidebar nav vertical con content area. Los estilos se definen en el SCSS del componente (no son globales).

### Layout (SCSS del componente)

```scss
// Grid: sidebar + content
.{entity}-layout {
  display: grid;
  grid-template-columns: 200px 1fr;  // 220px para entidades con muchos tabs
  gap: var(--spacing-2xl);
  align-items: stretch;
}

// Sidebar navigation
.{entity}-nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);

  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: var(--transition-base);
    text-align: left;

    i { width: 20px; text-align: center; font-size: var(--font-size-base); }

    &:hover { background: var(--surface-secondary); color: var(--text-primary); }

    &.active {
      background: var(--primary-50);
      color: var(--primary-700);
      font-weight: var(--font-weight-semibold);
      i { color: var(--primary-600); }
    }

    .nav-count {
      margin-left: auto;
      background: var(--primary-100);
      color: var(--primary-700);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
    }
  }
}

// Content area — flatten inner cards
.{entity}-content {
  min-width: 0;
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);

  .info-section { background: none; box-shadow: none; padding: 0; border-radius: 0; }
  .info-card { border: none; background: none; box-shadow: none; padding: 0; }
}
```

### HTML

```html
<div class="{entity}-layout">
  <nav class="{entity}-nav">
    <button class="nav-item" [class.active]="activeTab() === 'info'" (click)="setActiveTab('info')">
      <i class="fa-solid fa-info-circle"></i>
      <span>Información</span>
    </button>
    <button class="nav-item" [class.active]="activeTab() === 'items'" (click)="setActiveTab('items')">
      <i class="fa-solid fa-list"></i>
      <span>Items</span>
      @if (items().length > 0) {
        <span class="nav-count">{{ items().length }}</span>
      }
    </button>
  </nav>

  <div class="{entity}-content">
    @if (activeTab() === 'info') {
      <!-- contenido del tab -->
    }
    @if (activeTab() === 'items') {
      <!-- contenido del tab -->
    }
  </div>
</div>
```

### TypeScript

```typescript
// Tab navigation
activeTab = signal<'info' | 'items'>('info');

setActiveTab(tab: 'info' | 'items'): void {
  this.activeTab.set(tab);
}

// Para tabs condicionales:
visibleTabs = computed(() => {
  const tabs: string[] = ['info'];
  if (someCondition()) tabs.push('items');
  return tabs;
});
```

### Responsive (mobile)

```scss
@media (max-width: 768px) {
  .{entity}-layout { grid-template-columns: 1fr; }
  .{entity}-nav {
    flex-direction: row;
    overflow-x: auto;
    .nav-item span { display: none; }  // solo iconos en mobile
  }
}
```

---

## Secciones Consolidadas con info-group

Usar **una sola `info-section`** con múltiples `info-group` sub-secciones en lugar de varias `info-section` separadas. Cada `info-group` tiene un subtítulo `h4` con icono.

### ✅ Correcto — Una sección con info-groups

```html
<div class="info-section">
  <div class="section-header">
    <h3 class="section-header__title">
      <i class="fa-solid fa-calendar-check"></i>
      Información de la Cita
    </h3>
  </div>
  <hr>

  <div class="info-two-col">
    <div class="info-group">
      <h4 class="info-group__title">
        <i class="fa-solid fa-clock"></i>
        Programación
      </h4>
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Fecha:</span>
          <span class="info-value">21 de febrero de 2026</span>
        </div>
        <div class="info-row">
          <span class="info-label">Hora:</span>
          <span class="info-value">10:00 - 10:30</span>
        </div>
      </div>
    </div>

    <div class="info-group">
      <h4 class="info-group__title">
        <i class="fa-solid fa-users"></i>
        Participantes
      </h4>
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Paciente:</span>
          <span class="info-value"><a class="link-primary">Juan Pérez</a></span>
        </div>
      </div>
    </div>
  </div>
</div>
```

### ❌ Incorrecto — Múltiples info-section separadas

```html
<!-- NO HACER: secciones separadas para datos relacionados -->
<div class="info-two-col">
  <div class="info-section">
    <h3>Programación</h3>
    <div class="info-card">...</div>
  </div>
  <div class="info-section">
    <h3>Participantes</h3>
    <div class="info-card">...</div>
  </div>
</div>
```

### Sección con Acción Inline

Para secciones con un botón de acción (ej: Consentimientos con "Solicitar"):

```html
<div class="info-section">
  <div class="section-header">
    <h3 class="section-header__title">
      <i class="fa-solid fa-file-signature"></i>
      Consentimientos
    </h3>
    <button class="btn btn-outline btn-sm" (click)="addConsent()">
      <i class="fa-solid fa-plus"></i> Solicitar
    </button>
  </div>
  <hr>
  <!-- contenido -->
</div>
```

---

## Empty States

### Lista/colección vacía → `.empty-items` (borde dashed)

Para listas de items que están vacías (medicamentos, consentimientos, notas clínicas). Es el **patrón preferido** para empty states dentro de tabs.

```html
<div class="empty-items">
  <i class="fa-solid fa-file-signature"></i>
  <p>No hay consentimientos vinculados a esta cita</p>
  <button class="btn btn-outline btn-sm" (click)="addConsent()">
    <i class="fa-solid fa-plus"></i>
    Solicitar primer consentimiento
  </button>
</div>
```

### Tab completo vacío → `.empty-state`

Para un tab sin ningún dato (menos común, usar solo si no hay `.empty-items` apropiado):

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

### Campo vacío inline dentro de info-card → `.info-empty`

Para un dato faltante dentro de una card que ya tiene otros datos:

```html
<div class="info-card">
  <div class="info-empty">
    <i class="fa-solid fa-circle-info"></i>
    Sin información de contacto registrada
  </div>
</div>
```

### Jerarquía de empty states

| Contexto | Clase | Ejemplo |
|----------|-------|---------|
| Lista vacía dentro de tab (medicamentos, consentimientos) | `.empty-items` | Borde dashed, icono, texto, botón de acción |
| Tab completamente vacío | `.empty-state` | Centrado full, icono grande, título, descripción |
| Dato faltante dentro de card con otros datos | `.info-empty` | Inline, solo icono + texto |

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
- Acciones de estado (Confirmar, Completar, Cancelar) → también en `[actions]` con variantes outline (`btn-success`, `btn-warning`, `btn-danger`)

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
6. **Todas las acciones** → en `app-page-header` `[actions]` con estilo outline
7. **Sidebar nav para tabs** → para entidades con 2+ categorías de datos
8. **Una sola `info-section`** por tab con `info-group` sub-secciones (no múltiples `info-section`)
9. **Section headers BEM** → `.section-header` > `.section-header__title` + `<hr>` (no `h3` suelto)
10. **Info groups** → `h4.info-group__title` con icono para sub-secciones dentro de `info-section`
11. **Usar `info-two-col`** para `info-group` en columnas dentro de la sección
12. **Usar `status-banner`** para estados terminales (entre header y layout)
13. **Usar `alert-row`** para filas que requieren atención (errores, cancelaciones)
14. **Empty states**: `.empty-items` para listas vacías (dashed), `.empty-state` para tabs vacíos, `.info-empty` para inline
15. **Content area flatten** → dentro de `{entity}-content`, resetear `info-section` y `info-card` (sin borde/fondo/shadow)
16. **SCSS del componente** contiene layout grid + sidebar nav + content flatten + overrides específicos
17. **Usar siempre variables CSS** — nunca hard-codear colores, spacing o font-sizes
18. **Responsive** → media query solo para el layout grid y nav (ya está en el template SCSS)

---

## Checklist de Auditoría SCSS

Antes de dar por terminado un componente de detalle, verificar:

- [ ] No redefine `.btn-outline`, `.btn-sm`, `.btn-primary`, `.link-primary` (ya son globales)
- [ ] No usa colores hex/rgb directos — solo variables CSS (`--primary-500`, `--text-secondary`, etc.)
- [ ] No usa spacing en px — solo variables (`--spacing-md`, `--spacing-lg`, etc.)
- [ ] No usa font-sizes hard-coded — solo variables (`--font-size-sm`, `--font-size-xl`, etc.)
- [ ] Usa `.empty-items` para listas vacías (no custom empty classes)
- [ ] Usa `.info-section` > `.section-header` > `.section-header__title` + `<hr>` para títulos
- [ ] Usa `.info-group` > `.info-group__title` para sub-secciones
- [ ] Usa `.info-card` > `.info-row` para datos (no custom cards)
- [ ] Content area hace flatten de `.info-section` y `.info-card` (sin borde/fondo)
- [ ] Sidebar nav tiene responsive con iconos-only en mobile

---

## Archivos de Referencia

- **Design system global:** `src/styles/_components.scss` (sección DETAIL PAGE COMPONENTS)
- **Variables CSS:** `src/styles/_variables.scss`
- **Sidebar nav (2-3 tabs):** `src/app/features/appointments/components/appointment-detail/`
- **Sidebar nav (2 tabs):** `src/app/features/prescriptions/components/prescription-detail/`
- **Sidebar nav grande (7+ tabs):** `src/app/features/patients/components/patient-detail/`
