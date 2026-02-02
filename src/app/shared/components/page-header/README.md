# PageHeaderComponent

Componente estandarizado para headers de página con breadcrumbs, botón de retroceso y área de acciones.

## 📋 Características

- ✅ Título y subtítulo estandarizados
- ✅ Breadcrumbs de navegación jerárquica
- ✅ Botón de retroceso configurable
- ✅ Área para botones/acciones (slot)
- ✅ Estilos usando variables globales
- ✅ Responsive design
- ✅ Accesibilidad (ARIA labels)

## 🎯 Uso Básico

### Ejemplo Simple (Solo Título)

```typescript
import { PageHeaderComponent } from '@shared/components/page-header/page-header';

@Component({
  imports: [PageHeaderComponent, ...],
  ...
})
```

```html
<app-page-header
  [title]="'Usuarios del Consultorio'"
  [subtitle]="'Gestiona usuarios, roles y permisos'"
  [icon]="'fa-users'">
</app-page-header>
```

### Ejemplo con Botón de Retroceso

```html
<app-page-header
  [title]="'Nuevo Usuario'"
  [subtitle]="'Crea un nuevo usuario del consultorio'"
  [icon]="'fa-user-plus'"
  [showBackButton]="true"
  [backRoute]="'/users'">
</app-page-header>
```

### Ejemplo con Breadcrumbs

```typescript
export class UserFormComponent {
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Usuarios', route: '/users', icon: 'fa-users' },
    { label: 'Nuevo Usuario' }
  ];
}
```

```html
<app-page-header
  [title]="'Nuevo Usuario'"
  [subtitle]="'Crea un nuevo usuario del consultorio'"
  [icon]="'fa-user-plus'"
  [showBackButton]="true"
  [breadcrumbs]="breadcrumbItems">
</app-page-header>
```

### Ejemplo con Acciones

```html
<app-page-header
  [title]="'Usuarios del Consultorio'"
  [subtitle]="'Gestiona usuarios, roles y permisos'"
  [icon]="'fa-users'">
  
  <!-- Proyección de acciones -->
  <div actions>
    <button class="btn btn-outline" routerLink="/users/roles">
      <i class="fa-solid fa-key"></i>
      Gestionar Roles
    </button>
    <button class="btn btn-primary" routerLink="/users/new">
      <i class="fa-solid fa-user-plus"></i>
      Nuevo Usuario
    </button>
  </div>
</app-page-header>
```

### Ejemplo Completo

```typescript
import { Component } from '@angular/core';
import { PageHeaderComponent, BreadcrumbItem } from '@shared/components/page-header/page-header';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './user-form.html'
})
export class UserFormComponent {
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Usuarios', route: '/users', icon: 'fa-users' },
    { label: 'Nuevo Usuario' }
  ];
}
```

```html
<div class="user-form-container">
  <app-page-header
    [title]="'Nuevo Usuario'"
    [subtitle]="'Crea un nuevo usuario del consultorio'"
    [icon]="'fa-user-plus'"
    [showBackButton]="true"
    [backRoute]="'/users'"
    [breadcrumbs]="breadcrumbItems">
    
    <div actions>
      <button class="btn btn-secondary" (click)="onCancel()">
        Cancelar
      </button>
      <button class="btn btn-primary" (click)="onSave()">
        Guardar Usuario
      </button>
    </div>
  </app-page-header>

  <!-- Resto del contenido -->
</div>
```

## 📊 Props (Inputs)

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | `string` | `''` | **Requerido.** Título principal de la página |
| `subtitle` | `string?` | `undefined` | Subtítulo descriptivo (opcional) |
| `icon` | `string?` | `undefined` | Clase de icono FontAwesome (ej: `'fa-users'`) |
| `showBackButton` | `boolean` | `false` | Mostrar botón de retroceso |
| `backRoute` | `string?` | `undefined` | Ruta específica de retroceso. Si no se provee, usa `Location.back()` |
| `breadcrumbs` | `BreadcrumbItem[]` | `[]` | Array de items para breadcrumb |

## 🔧 Interfaces

### BreadcrumbItem

```typescript
interface BreadcrumbItem {
  label: string;      // Texto del breadcrumb
  route?: string;     // Ruta de navegación (opcional para el último item)
  icon?: string;      // Icono FontAwesome (opcional)
}
```

## 🎨 Estilos

El componente usa **variables globales CSS** definidas en `_variables.scss`:

- `--font-size-3xl`, `--font-size-2xl`, etc.
- `--font-weight-bold`, `--font-weight-medium`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--spacing-*` para espaciado
- `--border-primary`
- `--primary-500`, `--primary-600`
- `--transition-base`

## 📱 Responsive

- **Desktop:** Layout horizontal con botón izquierda, contenido centro, acciones derecha
- **Tablet (< 768px):** Layout vertical apilado
- **Mobile (< 480px):** Texto más pequeño, breadcrumbs con scroll horizontal

## ♿ Accesibilidad

- ✅ ARIA labels en botón de retroceso
- ✅ Navegación semántica con `<nav>` y `role="navigation"`
- ✅ Lista ordenada para breadcrumbs
- ✅ Soporte de teclado en breadcrumbs

## 🔄 Migración desde Headers Antiguos

### Antes:
```html
<div class="page-header">
  <div class="header-content">
    <h1 class="page-title">
      <i class="fa-solid fa-users"></i>
      Usuarios
    </h1>
    <p class="page-subtitle">Gestiona usuarios</p>
  </div>
  <div class="header-actions">
    <button class="btn btn-primary">Nuevo</button>
  </div>
</div>
```

### Después:
```html
<app-page-header
  [title]="'Usuarios'"
  [subtitle]="'Gestiona usuarios'"
  [icon]="'fa-users'">
  <div actions>
    <button class="btn btn-primary">Nuevo</button>
  </div>
</app-page-header>
```

## 📝 Notas

- El componente es **standalone** - puede importarse directamente
- El botón de retroceso usa `Location.back()` si no se especifica `backRoute`
- Los breadcrumbs automáticamente marcan el último item como activo
- Las acciones se proyectan usando `<ng-content select="[actions]">`
