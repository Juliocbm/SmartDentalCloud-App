# Sistema de Diseño - SmartDentalCloud-App

Guía rápida para utilizar el sistema de diseño global del proyecto.

## 📐 Variables CSS Disponibles

### Colores

```scss
// Marca principal
--primary-500: #3b82f6
--primary-600: #2563eb
--primary-700: #1e40af

// Superficies
--surface-primary: #ffffff
--surface-secondary: #f8fafc
--surface-tertiary: #f1f5f9

// Texto
--text-primary: #1e293b
--text-secondary: #475569
--text-tertiary: #64748b
--text-muted: #94a3b8

// Estados
--success-500: #10b981
--error-500: #ef4444
--warning-500: #f59e0b
--info-500: #06b6d4
```

### Espaciado

```scss
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 24px
--spacing-2xl: 32px
--spacing-3xl: 40px
```

### Border Radius

```scss
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px
```

## 🎨 Componentes Reutilizables

### Botones

```html
<!-- Botón primario -->
<button class="btn btn-primary">
  <i class="fa-solid fa-plus"></i>
  Crear Nuevo
</button>

<!-- Botón outline -->
<button class="btn btn-outline">
  <i class="fa-solid fa-download"></i>
  Exportar
</button>

<!-- Botón success -->
<button class="btn btn-success">Guardar</button>

<!-- Botón danger -->
<button class="btn btn-danger">Eliminar</button>

<!-- Tamaños -->
<button class="btn btn-primary btn-sm">Pequeño</button>
<button class="btn btn-primary">Normal</button>
<button class="btn btn-primary btn-lg">Grande</button>

<!-- Botón de bloque -->
<button class="btn btn-primary btn-block">Ancho completo</button>
```

### Tarjetas KPI

```html
<div class="kpi-card">
  <div class="kpi-header">
    <div class="kpi-icon-wrapper">
      <i class="fa-solid fa-users"></i>
    </div>
    <div class="kpi-trend positive">
      <i class="fa-solid fa-arrow-up"></i>
      <span>+12%</span>
    </div>
  </div>
  <div class="kpi-content">
    <div class="kpi-value">1234</div>
    <div class="kpi-label">Total Pacientes</div>
    <div class="kpi-sublabel">Registrados este mes</div>
  </div>
  <div class="kpi-chart">
    <div class="mini-chart">
      <div class="chart-bar" style="height: 60%"></div>
      <div class="chart-bar" style="height: 80%"></div>
      <div class="chart-bar" style="height: 45%"></div>
      <div class="chart-bar" style="height: 90%"></div>
      <div class="chart-bar" style="height: 75%"></div>
    </div>
  </div>
</div>
```

### Alertas

```html
<!-- Alerta de éxito -->
<div class="alert alert-success">
  <i class="fa-solid fa-check-circle"></i>
  <span>Operación completada exitosamente</span>
</div>

<!-- Alerta de error -->
<div class="alert alert-error">
  <i class="fa-solid fa-exclamation-triangle"></i>
  <span>Ha ocurrido un error</span>
</div>

<!-- Alerta de advertencia -->
<div class="alert alert-warning">
  <i class="fa-solid fa-exclamation-circle"></i>
  <span>Ten cuidado con esta acción</span>
</div>
```

### Badges

```html
<span class="badge badge-primary">Nuevo</span>
<span class="badge badge-success">Activo</span>
<span class="badge badge-error">Cancelado</span>
<span class="badge badge-warning">Pendiente</span>
<span class="badge badge-neutral">Neutral</span>
```

### Tablas

```html
<div class="table-container">
  <table class="table">
    <thead>
      <tr>
        <th>Columna 1</th>
        <th>Columna 2</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Dato 1</td>
        <td>Dato 2</td>
        <td>
          <button class="btn btn-sm btn-outline">Ver</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Formularios

```html
<div class="form-group">
  <label class="form-label">Nombre</label>
  <input type="text" class="form-control" placeholder="Ingresa tu nombre">
</div>

<div class="form-group">
  <label class="form-label">Descripción</label>
  <textarea class="form-control" placeholder="Ingresa una descripción"></textarea>
</div>

<div class="form-group">
  <label class="form-label">Selecciona una opción</label>
  <select class="form-select">
    <option>Opción 1</option>
    <option>Opción 2</option>
  </select>
</div>
```

### Cards

```html
<div class="card">
  <div class="card-header">
    <h3>Título de la tarjeta</h3>
  </div>
  <div class="card-body">
    Contenido de la tarjeta
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Acción</button>
  </div>
</div>
```

### Modal

```html
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2>Título del Modal</h2>
      <button class="close-btn">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      Contenido del modal
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline">Cancelar</button>
      <button class="btn btn-primary">Confirmar</button>
    </div>
  </div>
</div>
```

### Quick Action Cards

```html
<button class="quick-action-card">
  <div class="action-icon">
    <i class="fa-solid fa-user-plus"></i>
  </div>
  <div class="action-content">
    <div class="action-title">Nuevo Paciente</div>
    <div class="action-subtitle">Registrar un nuevo paciente</div>
  </div>
</button>
```

## 📱 Layout y Grid System

### Container

```html
<div class="container">
  Contenido con max-width de 1400px
</div>

<div class="container-fluid">
  Contenido de ancho completo
</div>
```

### Grid

```html
<div class="grid grid-cols-3 gap-lg">
  <div>Columna 1</div>
  <div>Columna 2</div>
  <div>Columna 3</div>
</div>

<!-- Grid auto-fit -->
<div class="grid grid-cols-auto gap-xl">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Flexbox

```html
<div class="flex items-center justify-between gap-md">
  <div>Izquierda</div>
  <div>Derecha</div>
</div>

<div class="flex flex-col gap-lg">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## 🎯 Estructura de Página Estándar

```html
<div class="dashboard-container">
  <!-- Header -->
  <div class="dashboard-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="page-title">
          <i class="fa-solid fa-icon"></i>
          Título de Página
        </h1>
        <p class="page-subtitle">Descripción</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline">Acción</button>
        <button class="btn btn-primary">Acción Principal</button>
      </div>
    </div>
  </div>

  <!-- KPI Section -->
  <div class="kpi-section">
    <div class="kpi-grid">
      <!-- KPI Cards aquí -->
    </div>
  </div>

  <!-- Content Section -->
  <div class="content-section">
    <div class="content-container">
      <!-- Contenido principal aquí -->
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="quick-actions-section">
    <div class="section-header">
      <h3 class="section-title">
        <i class="fa-solid fa-bolt"></i>
        Acciones Rápidas
      </h3>
    </div>
    <div class="quick-actions-grid">
      <!-- Quick action cards aquí -->
    </div>
  </div>
</div>
```

## 🛠️ Utilidades CSS

### Espaciado

```html
<!-- Padding -->
<div class="p-0">Sin padding</div>
<div class="p-4">Padding normal</div>
<div class="pt-4 pb-6">Padding top y bottom</div>

<!-- Margin -->
<div class="m-0">Sin margin</div>
<div class="mt-4">Margin top</div>
<div class="mb-6">Margin bottom</div>
```

### Texto

```html
<div class="text-left">Izquierda</div>
<div class="text-center">Centro</div>
<div class="text-right">Derecha</div>

<div class="text-sm">Texto pequeño</div>
<div class="text-base">Texto normal</div>
<div class="text-xl">Texto grande</div>

<div class="font-normal">Normal</div>
<div class="font-semibold">Semi-bold</div>
<div class="font-bold">Bold</div>

<div class="text-primary">Color primario</div>
<div class="text-secondary">Color secundario</div>
<div class="text-muted">Color atenuado</div>
```

### Display

```html
<div class="hidden">Oculto</div>
<div class="block">Block</div>
<div class="flex">Flex</div>
```

### Ancho y Alto

```html
<div class="w-full">Ancho completo</div>
<div class="h-full">Alto completo</div>
```

## 🎨 Temas

### Cambiar tema programáticamente

```typescript
import { ThemeService } from './core/services/theme.service';

// Inyectar el servicio
themeService = inject(ThemeService);

// Cambiar tema
themeService.setTheme('dark');      // Tema oscuro
themeService.setTheme('light');     // Tema claro
themeService.setTheme('high-contrast'); // Alto contraste

// Toggle entre claro/oscuro
themeService.toggleTheme();

// Ciclar entre todos los temas
themeService.cycleTheme();

// Obtener tema actual
const currentTheme = themeService.currentTheme();
```

## 🚀 Buenas Prácticas

1. **Usa variables CSS** en lugar de valores hardcoded
2. **Reutiliza clases globales** para componentes comunes
3. **Mantén consistencia** en espaciado y colores
4. **Sigue la estructura** de página estándar para consistencia
5. **Usa iconos Font Awesome** con prefijo `fa-solid`
6. **Componentes standalone** para mejor tree-shaking
7. **Lazy loading** para rutas y módulos

## 📚 Recursos

- Variables CSS: `src/styles/_variables.scss`
- Componentes: `src/styles/_components.scss`
- Layout: `src/styles/_layout.scss`
- Ejemplos: Ver `dashboard.component.html`
