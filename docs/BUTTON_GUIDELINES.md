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

#### ✅ CORRECTO:
```html
<app-page-header [title]="'Citas'">
  <div actions>
    <a routerLink="/appointments/calendar" class="btn btn-outline">
      <i class="fa-solid fa-calendar"></i>
      Calendario
    </a>
    <a routerLink="/appointments/new" class="btn btn-primary">
      <i class="fa-solid fa-plus"></i>
      Nueva Cita
    </a>
  </div>
</app-page-header>
```

#### ❌ INCORRECTO:
```html
<!-- ❌ Dos botones primary -->
<a class="btn btn-primary">Calendario</a>
<a class="btn btn-primary">Nueva Cita</a>

<!-- ❌ btn-secondary en header -->
<a class="btn btn-secondary">Calendario</a>
```

---

### **Formularios**

#### ✅ CORRECTO:
```html
<div class="form-actions">
  <button type="button" class="btn btn-secondary" (click)="cancel()">
    Cancelar
  </button>
  <button type="submit" class="btn btn-primary" [disabled]="!form.valid">
    Guardar
  </button>
</div>
```

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

#### ✅ CORRECTO:
```html
<div class="action-buttons">
  <button class="btn btn-sm btn-primary" (click)="edit(item)">
    <i class="fa-solid fa-pen"></i>
    Editar
  </button>
  <button class="btn btn-sm btn-danger" (click)="delete(item)">
    <i class="fa-solid fa-trash"></i>
    Eliminar
  </button>
</div>
```

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
    <button class="btn btn-outline" routerLink="/patients/search">
      <i class="fa-solid fa-filter"></i>
      Búsqueda Avanzada
    </button>
    <button class="btn btn-primary" routerLink="/patients/new">
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
    <a class="btn btn-primary" routerLink="/users/new">
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
    <a class="btn btn-primary" routerLink="/appointments/new">
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
