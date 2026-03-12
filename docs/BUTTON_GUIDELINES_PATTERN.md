# 🎨 Guía de Jerarquía y Uso de Botones

## 📋 Tabla de Contenidos
1. [Tipos de Botones](#tipos-de-botones)
2. [Jerarquía Visual](#jerarquía-visual)
3. [Guía de Uso por Contexto](#guía-de-uso-por-contexto)
4. [Variables Globales](#variables-globales)
5. [Ejemplos de Implementación](#ejemplos-de-implementación)

---

## 🎯 Tipos de Botones

### 1. **`btn-primary`** - Acción Principal
**Estilo:**
- Fondo: `var(--primary-500)` (Azul vibrante)
- Texto: Blanco
- Hover: Elevación + `var(--primary-600)`

**Cuándo usar:**
- ✅ Crear nuevo registro (Nuevo Paciente, Nueva Cita, Nuevo Usuario)
- ✅ Guardar cambios en formularios
- ✅ Confirmar acción importante
- ✅ Acción principal de la pantalla

**Reglas:**
- 🚨 **Solo 1 botón primary por sección/header**
- 🚨 Debe ser la acción más importante visualmente

---

### 2. **`btn-outline`** - Acción Secundaria / Navegación
**Estilo:**
- Fondo: Transparente con borde
- Borde: `var(--border-medium)`
- Texto: `var(--text-secondary)`
- Hover: `var(--surface-secondary)`

**Cuándo usar:**
- ✅ Navegación a otra vista (Calendario, Lista, Gestionar Roles)
- ✅ Búsqueda avanzada
- ✅ Filtros
- ✅ Ver detalles
- ✅ Acciones complementarias que NO son la acción principal

**Reglas:**
- ✅ Múltiples permitidos en la misma pantalla
- ✅ Ideal para headers junto a `btn-primary`

---

### 3. **`btn-secondary`** - Acciones Neutras / Cancelar
**Estilo:**
- Fondo: `var(--neutral-500)` (Gris)
- Texto: Blanco
- Hover: `var(--neutral-600)`

**Cuándo usar:**
- ✅ Cancelar en modales/formularios
- ✅ Reintentar en estados de error
- ✅ Volver/Regresar
- ✅ Acciones sin impacto importante

**Reglas:**
- 🚫 **NO usar en headers principales**
- ✅ Usar en modales, mensajes de error, y acciones de escape

---

### 4. **`btn-danger`** - Acciones Destructivas
**Estilo:**
- Fondo: `var(--error-500)` (Rojo)
- Texto: Blanco
- Hover: `var(--error-600)`

**Cuándo usar:**
- ✅ Eliminar registros
- ✅ Desactivar usuarios
- ✅ Acciones irreversibles o peligrosas

**Reglas:**
- 🚨 **SIEMPRE requiere confirmación** (modal/diálogo)
- 🚨 Usar con moderación

---

### 5. **`btn-success`** - Confirmaciones Positivas
**Estilo:**
- Fondo: `var(--success-500)` (Verde)
- Texto: Blanco

**Cuándo usar:**
- ✅ Aprobar/Completar tareas
- ✅ Confirmar cita
- ✅ Activar usuario

---

### 6. **`btn-warning`** - Advertencias
**Estilo:**
- Fondo: `var(--warning-500)` (Amarillo)
- Texto: Blanco

**Cuándo usar:**
- ✅ Acciones que requieren atención
- ✅ Estados intermedios

---

## 📊 Jerarquía Visual

### En Headers de Página:
```
┌──────────────────────────────────────────────┐
│  📄 Título de Página                         │
│  Subtítulo descriptivo                       │
│                                               │
│  [btn-outline]  [btn-outline]  [btn-primary] │
│  Secundaria 1   Secundaria 2   Principal ⭐  │
└──────────────────────────────────────────────┘
```

**Orden visual (de izquierda a derecha):**
1. Acciones secundarias (`btn-outline`)
2. Acción principal (`btn-primary`) - **Siempre al final**

### En Modales/Formularios:
```
┌──────────────────────────────┐
│  Modal / Formulario          │
│  ...contenido...             │
│                               │
│  [btn-secondary] [btn-primary]│
│  Cancelar        Confirmar ⭐ │
└──────────────────────────────┘
```

---

## 🎯 Guía de Uso por Contexto

### **Headers de Listados (List Views)**

Los botones de "Crear/Nuevo" en listados usan `btn btn-outline btn-success` (borde verde).
Los botones de navegación secundaria usan `btn btn-outline` (borde neutro).

#### ✅ CORRECTO:
```html
<app-page-header [title]="'Citas'">
  <div actions>
    <a routerLink="/appointments/calendar" class="btn btn-outline">
      <i class="fa-solid fa-calendar"></i>
      Calendario
    </a>
    <a routerLink="/appointments/new" class="btn btn-outline btn-success">
      <i class="fa-solid fa-plus"></i>
      Nueva Cita
    </a>
  </div>
</app-page-header>
```

#### ❌ INCORRECTO:
```html
<!-- ❌ btn-primary para crear -->
<a class="btn btn-primary">Nueva Cita</a>

<!-- ❌ btn-secondary en header -->
<a class="btn btn-secondary">Calendario</a>
```

#### Botones en empty states de listados:
```html
<div class="empty-state">
  <i class="fa-solid fa-calendar-xmark"></i>
  <h3>No hay citas</h3>
  <p>Comienza creando tu primera cita</p>
  <a routerLink="/appointments/new" class="btn btn-outline btn-success">
    <i class="fa-solid fa-plus"></i>
    Crear Primera Cita
  </a>
</div>
```

---

### **Formularios (Crear / Editar)**

Los formularios usan botones en el `<div actions class="header-form-actions">` del `page-header`.

#### Cancelar: `btn btn-outline` + `fa-times`
#### Guardar/Crear: `btn btn-outline btn-success` + icono dinámico + texto dinámico

#### ✅ Form con edit + create (isEditMode):
```html
<div actions class="header-form-actions">
  <button type="button" class="btn btn-outline" (click)="cancel()" [disabled]="loading()">
    <i class="fa-solid fa-times"></i>
    Cancelar
  </button>
  <button type="button" class="btn btn-outline btn-success" (click)="onSubmit()" [disabled]="loading() || form.invalid">
    @if (loading()) {
      <span class="btn-spinner"></span>
      Guardando...
    } @else {
      <i class="fa-solid" [class.fa-floppy-disk]="isEditMode()" [class.fa-plus]="!isEditMode()"></i>
      {{ isEditMode() ? 'Guardar Cambios' : 'Crear {Entidad}' }}
    }
  </button>
</div>
```

#### ✅ Form solo creación:
```html
<div actions class="header-form-actions">
  <button type="button" class="btn btn-outline" (click)="cancel()" [disabled]="loading()">
    <i class="fa-solid fa-times"></i>
    Cancelar
  </button>
  <button type="button" class="btn btn-outline btn-success" (click)="onSubmit()" [disabled]="loading() || form.invalid">
    @if (loading()) {
      <span class="btn-spinner"></span>
      Guardando...
    } @else {
      <i class="fa-solid fa-plus"></i>
      Crear {Entidad}
    }
  </button>
</div>
```

#### Reglas para formularios

| Elemento | Clase | Icono | Texto |
|----------|-------|-------|-------|
| Cancelar | `btn btn-outline` | `fa-times` | "Cancelar" |
| Guardar (edit) | `btn btn-outline btn-success` | `fa-floppy-disk` | "Guardar Cambios" |
| Crear | `btn btn-outline btn-success` | `fa-plus` | "Crear {Entidad}" o "Registrar {Entidad}" |
| Loading | `btn btn-outline btn-success` (disabled) | `btn-spinner` | "Guardando..." |

- **SIEMPRE** usar `btn btn-outline btn-success` para el botón de submit (borde verde)
- **SIEMPRE** usar `btn btn-outline` para cancelar (borde neutro)
- **SIEMPRE** usar `fa-floppy-disk` para editar y `fa-plus` para crear
- **SIEMPRE** mostrar "Guardando..." como texto de loading (NO "Creando..." ni "Registrando...")
- Los botones van en `<div actions class="header-form-actions">` del `page-header`
- Los estilos de `header-form-actions` y `btn-spinner` están en `_components.scss` (global)

---

### **Estados de Error**

#### ✅ CORRECTO:
```html
<div class="error-state">
  <i class="fa-solid fa-exclamation-triangle"></i>
  <p>{{ error() }}</p>
  <button class="btn btn-secondary" (click)="retry()">
    Reintentar
  </button>
</div>
```

---

### **Acciones en Tablas**

Todas las acciones en tablas usan **`btn-icon`** (32×32, borde, solo ícono) + variantes semánticas + `title` tooltip. **NUNCA** usar `btn btn-sm btn-outline` con texto en tablas.

#### ✅ CORRECTO:
```html
<td class="actions-cell">
  <button class="btn-icon btn-icon-view" title="Ver detalle" [routerLink]="['/items', item.id]">
    <i class="fa-solid fa-eye"></i>
  </button>
  <button class="btn-icon btn-icon-edit" title="Editar" [routerLink]="['/items', item.id, 'edit']">
    <i class="fa-solid fa-pen"></i>
  </button>
  <button class="btn-icon btn-icon-danger" title="Eliminar" (click)="delete(item)">
    <i class="fa-solid fa-trash"></i>
  </button>
</td>
```

#### ❌ INCORRECTO:
```html
<!-- ❌ btn btn-sm btn-outline con texto en tablas -->
<button class="btn btn-sm btn-outline">
  <i class="fa-solid fa-eye"></i> Ver
</button>
```

#### Variantes disponibles:
| Variante | Color | Uso |
|----------|-------|-----|
| `btn-icon-view` | Info | Ver detalle |
| `btn-icon-edit` | Primary | Editar |
| `btn-icon-delete` / `btn-icon-danger` | Error | Eliminar |
| `btn-icon-success` | Success | Completar, agendar cita |
| `btn-icon-warning` | Warning | Cancelar cita |
| `btn-icon-print` | Neutral | Imprimir PDF |
| `btn-icon-email` | Primary | Enviar email |
| `btn-icon-notes` | Info | Notas clínicas |
| `btn-icon-toggle-on` / `btn-icon-toggle-off` | Success/Error | Activar/Desactivar |

---

## 🎨 Variables Globales

Todos los estilos de botones usan variables globales definidas en `_variables.scss` y `_components.scss`:

### Colores:
```scss
--primary-500      // Azul principal
--primary-600      // Azul hover
--neutral-500      // Gris secundario
--neutral-600      // Gris hover
--success-500      // Verde
--error-500        // Rojo
--warning-500      // Amarillo
--border-medium    // Borde outline
```

### Espaciado:
```scss
--spacing-sm       // Gap entre ícono y texto
--radius-md        // Border radius
```

### Tipografía:
```scss
--font-size-sm     // Tamaño base de texto
--font-size-xs     // Tamaño btn-sm
--font-size-base   // Tamaño btn-lg
--font-weight-medium
```

### Transiciones:
```scss
--transition-base  // Hover y estados
--shadow-md        // Elevación en hover
```

---

## 📐 Tamaños de Botones

### Tamaño Normal (Default):
```html
<button class="btn btn-primary">Guardar</button>
```
- Padding: `8px 14px`
- Font-size: `var(--font-size-sm)`

### Pequeño (`btn-sm`):
```html
<button class="btn btn-sm btn-primary">Editar</button>
```
- Padding: `5px 10px`
- Font-size: `var(--font-size-xs)`
- **Uso:** Botones en tablas, cards compactas

### Grande (`btn-lg`):
```html
<button class="btn btn-lg btn-primary">Continuar</button>
```
- Padding: `12px 20px`
- Font-size: `var(--font-size-base)`
- **Uso:** CTAs importantes, landing pages

### Ancho Completo (`btn-block`):
```html
<button class="btn btn-primary btn-block">Guardar Cambios</button>
```
- Width: `100%`
- **Uso:** Formularios en móvil, modales

---

## 🔍 Pantallas de Detalle (Detail Views)

En las pantallas de detalle, **todos los botones de acción usan variantes outline** (`btn btn-outline`). Nunca se usan botones sólidos (`btn-primary`, `btn-danger`, `btn-success`) directamente.

### Estatus junto al título (`title-extra`)

Los **badges/chips de estatus** (Activo/Inactivo, En Progreso, Pagada, etc.) se colocan **junto al título** usando el slot `<div title-extra>`, **NO** dentro de `<div actions>`.

```
┌──────────────────────────────────────────────────────────────────────┐
│  📄 Título de Entidad  [● Estatus]        [🕐] [Editar] [Desactivar]│
│     ← title-extra →                       ← actions (solo botones) →│
└──────────────────────────────────────────────────────────────────────┘
```

- **`<div title-extra>`** — Solo badges/chips de estatus (`badge`, `status-badge`)
- **`<div actions>`** — **Solo botones** (`btn btn-icon`, `btn btn-outline`, etc.)

### Orden estándar en `<div actions>`

1. **Botón auditoría** — `<button class="btn btn-icon">` con `fa-clock-rotate-left`
2. **Acciones normales** — `btn btn-outline` (Editar, Imprimir, Exportar, Reagendar, etc.)
3. **Acciones con contexto** — `btn btn-outline btn-success` / `btn btn-outline btn-danger` (Activar, Desactivar, Aprobar, Rechazar, Eliminar)

> ⚠️ **NUNCA** colocar badges, chips o indicadores de estatus dentro de `<div actions>`. Usar siempre `<div title-extra>`.

### Clases de badge para estatus

Existen **dos clases base** de badge definidas globalmente en `_components.scss`:

| Clase base | Forma | Uso |
|------------|-------|-----|
| `.badge` | Rectángulo (`border-radius: var(--radius-sm)`) | Estatus con múltiples variantes (Pagada, En Progreso, etc.) |
| `.status-badge` | Píldora (`border-radius: var(--radius-full)`) | Estatus binario (Activo/Inactivo) |

**Variantes de color** (se combinan con cualquiera de las clases base):

| Variante | Background | Uso |
|----------|------------|-----|
| `.badge-active` | `var(--success-500)` | Activo, Habilitado |
| `.badge-success` | `var(--success-500)` | Completado, Pagada |
| `.badge-primary` | `var(--primary-500)` | En Progreso, Programada |
| `.badge-info` | `var(--info-500)` | Planificado, Informativo |
| `.badge-warning` | `var(--warning-500)` | Expirada, Pendiente |
| `.badge-error` | `var(--error-500)` | Cancelada, Error |
| `.badge-neutral` / `.badge-inactive` | `var(--neutral-500)` | Inactivo, Deshabilitado |

#### Ejemplo: Estatus binario (Activo/Inactivo)

```html
<div title-extra>
  <span class="status-badge" [class.badge-active]="entity.isActive" [class.badge-inactive]="!entity.isActive">
    {{ entity.isActive ? 'Activo' : 'Inactivo' }}
  </span>
</div>
```

#### Ejemplo: Estatus con múltiples variantes

```html
<div title-extra>
  <span class="badge" [ngClass]="getStatusConfig(entity.status).class">
    <i [class]="'fa-solid ' + getStatusConfig(entity.status).icon"></i>
    {{ getStatusConfig(entity.status).label }}
  </span>
</div>
```

### Clases por tipo de acción

| Acción | Clase | Icono |
|--------|-------|-------|
| Editar | `btn btn-outline` | `fa-pen` |
| Reagendar | `btn btn-outline` | `fa-calendar-pen` |
| Imprimir | `btn btn-outline` | `fa-print` |
| Exportar CSV | `btn btn-outline` | `fa-file-csv` |
| Iniciar | `btn btn-outline` | `fa-play` |
| Aprobar | `btn btn-outline btn-success` | `fa-circle-check` |
| Activar | `btn btn-outline btn-success` | `fa-toggle-on` |
| Rechazar | `btn btn-outline btn-danger` | `fa-circle-xmark` |
| Desactivar | `btn btn-outline btn-danger` | `fa-toggle-off` |
| Eliminar | `btn btn-outline btn-danger` | `fa-trash` |
| Auditoría | `btn btn-icon` | `fa-clock-rotate-left` |

### Ejemplo: Entidad con Editar + Desactivar

```html
<app-page-header [title]="entity()?.name || 'Entidad'" [icon]="'fa-box'" [showBackButton]="true" [breadcrumbs]="breadcrumbItems">
  <div title-extra>
    @if (entity(); as e) {
      <span class="status-badge" [class.badge-active]="e.isActive" [class.badge-inactive]="!e.isActive">
        {{ e.isActive ? 'Activo' : 'Inactivo' }}
      </span>
    }
  </div>
  <div actions>
    @if (entity(); as e) {
      <button class="btn btn-icon" (click)="showAuditModal.set(true)" title="Auditoría">
        <i class="fa-solid fa-clock-rotate-left"></i>
      </button>
      <button class="btn btn-outline" (click)="edit()">
        <i class="fa-solid fa-pen"></i>
        Editar
      </button>
      @if (e.isActive) {
        <button class="btn btn-outline btn-danger" (click)="toggleActive()">
          <i class="fa-solid fa-toggle-off"></i>
          Desactivar
        </button>
      } @else {
        <button class="btn btn-outline btn-success" (click)="toggleActive()">
          <i class="fa-solid fa-toggle-on"></i>
          Activar
        </button>
      }
    }
  </div>
</app-page-header>
```

### Ejemplo: Entidad de solo lectura (Imprimir)

```html
<app-page-header [title]="'Factura'" [icon]="'fa-file-invoice-dollar'" [showBackButton]="true" [breadcrumbs]="breadcrumbItems">
  <div title-extra>
    @if (invoice(); as inv) {
      <span class="badge" [ngClass]="getStatusConfig(inv.status).class">
        <i [class]="'fa-solid ' + getStatusConfig(inv.status).icon"></i>
        {{ getStatusConfig(inv.status).label }}
      </span>
    }
  </div>
  <div actions>
    @if (invoice(); as inv) {
      <button class="btn btn-icon" (click)="showAuditModal.set(true)" title="Auditoría">
        <i class="fa-solid fa-clock-rotate-left"></i>
      </button>
      <button class="btn btn-outline" (click)="print()">
        <i class="fa-solid fa-print"></i>
        Imprimir
      </button>
    }
  </div>
</app-page-header>
```

### Ejemplo: Entidad con acciones de workflow

```html
<app-page-header [title]="'Plan de Tratamiento'" [icon]="'fa-clipboard-list'" [showBackButton]="true" [breadcrumbs]="breadcrumbItems">
  <div actions>
    <button class="btn btn-icon" (click)="showAuditModal.set(true)" title="Auditoría">
      <i class="fa-solid fa-clock-rotate-left"></i>
    </button>
    @if (canApprove()) {
      <button class="btn btn-outline btn-success" (click)="onApprove()">
        <i class="fa-solid fa-circle-check"></i>
        Aprobar
      </button>
      <button class="btn btn-outline btn-danger" (click)="onReject()">
        <i class="fa-solid fa-circle-xmark"></i>
        Rechazar
      </button>
    }
  </div>
</app-page-header>
```

### Reglas para pantallas de detalle

- **NUNCA** usar `btn-primary` o `btn-secondary` en pantallas de detalle
- **SIEMPRE** usar variantes `btn btn-outline` (con modificador de color si aplica)
- **SIEMPRE** incluir el botón de auditoría (`btn btn-icon` + `fa-clock-rotate-left`)
- **SIEMPRE** incluir un ícono Font Awesome antes del texto del botón
- Los badges de estado van **antes** del botón de auditoría
- Las acciones destructivas van **al final** (derecha)

### Pantallas implementadas

| Pantalla | Acciones |
|----------|----------|
| appointment-detail | Reagendar (condicional) |
| service-detail | Editar, Eliminar |
| treatment-detail | Editar (condicional) |
| patient-detail | Editar, Desactivar/Activar |
| invoice-detail | Imprimir |
| prescription-detail | Imprimir |
| payment-detail | Solo auditoría |
| treatment-plan-detail | Aprobar, Rechazar, Iniciar Plan (condicionales) |
| product-detail | Editar |
| supplier-detail | Editar |
| category-detail | Editar |
| purchase-order-detail | Solo badge + auditoría |
| user-detail | Editar, Desactivar/Activar |

---

## ✅ Checklist de Implementación

Antes de agregar un botón, pregúntate:

- [ ] ¿Es la acción **más importante** de la pantalla? → `btn-primary`
- [ ] ¿Es navegación o acción complementaria? → `btn-outline`
- [ ] ¿Es cancelar o acción neutra? → `btn-secondary`
- [ ] ¿Es eliminar/desactivar? → `btn-danger`
- [ ] ¿Ya hay un `btn-primary` en esta sección? → Usa `btn-outline`
- [ ] ¿El botón tiene ícono? → Usa `<i class="fa-solid fa-..."></i>`
- [ ] ¿Necesita confirmación? → Usa modal + `btn-danger`

---

## 🚀 Casos de Uso Reales

### Ejemplo 1: Listado de Pacientes
```html
<app-page-header [title]="'Pacientes'">
  <div actions>
    <button class="btn btn-outline" (click)="exportToCsv()">
      <i class="fa-solid fa-file-csv"></i>
      Exportar CSV
    </button>
    <button class="btn btn-outline btn-success" routerLink="/patients/new">
      <i class="fa-solid fa-plus"></i>
      Nuevo Paciente
    </button>
  </div>
</app-page-header>
```

### Ejemplo 2: Listado de Usuarios
```html
<app-page-header [title]="'Usuarios del Consultorio'">
  <div actions>
    <a class="btn btn-outline" routerLink="/users/roles">
      <i class="fa-solid fa-key"></i>
      Gestionar Roles
    </a>
    <a class="btn btn-outline btn-success" routerLink="/users/new">
      <i class="fa-solid fa-user-plus"></i>
      Nuevo Usuario
    </a>
  </div>
</app-page-header>
```

### Ejemplo 3: Listado de Citas
```html
<app-page-header [title]="'Citas'">
  <div actions>
    <a class="btn btn-outline" routerLink="/appointments/calendar">
      <i class="fa-solid fa-calendar"></i>
      Calendario
    </a>
    <a class="btn btn-outline btn-success" routerLink="/appointments/new">
      <i class="fa-solid fa-plus"></i>
      Nueva Cita
    </a>
  </div>
</app-page-header>
```

---

## 🔄 Migraciones y Actualizaciones

### Si encuentras código que no sigue esta guía:

1. **Identifica el contexto** (header, formulario, tabla, etc.)
2. **Aplica la jerarquía correcta** según esta guía
3. **Elimina estilos locales** - usa solo clases globales
4. **Verifica variables** - asegúrate de usar `var(--*)` globales
5. **Prueba responsive** - verifica en móvil/tablet

### Archivos a NO modificar:
- `src/styles/_components.scss` - Definiciones globales de botones
- `src/styles/_variables.scss` - Variables de color y espaciado

### Archivos donde ELIMINAR estilos locales:
- Cualquier `.scss` de componente con definiciones `.btn { ... }`
- Usar solo clases globales de `_components.scss`

---

## 📚 Referencias

- **Estilos globales:** `src/styles/_components.scss` (líneas 5-120)
- **Variables:** `src/styles/_variables.scss`
- **Componente header:** `src/app/shared/components/page-header/`

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0  
**Mantenedor:** Equipo SmartDentalCloud
