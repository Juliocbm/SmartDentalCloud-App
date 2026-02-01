# SmartDentalCloud-App

Frontend moderno para el sistema de gestión dental SmartDentalCloud, desarrollado con Angular 19 y un sistema de diseño profesional basado en variables CSS.

## 🎨 Características del Diseño

Este proyecto fue creado utilizando el excelente diseño visual del proyecto dentalPro, pero completamente reorganizado con:

- **Sistema de variables CSS globales** para colores, espaciado, tipografía y más
- **Componentes reutilizables** con estilos consistentes
- **Arquitectura escalable** con separación clara entre core, shared y features
- **Soporte para temas** (claro, oscuro, alto contraste)
- **Diseño responsive** optimizado para todos los dispositivos
- **Paleta de colores profesional** basada en el sistema original

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── core/                    # Servicios y funcionalidades core
│   │   ├── services/           # ApiService, ThemeService
│   │   └── interceptors/       # HTTP interceptors (auth, tenant)
│   ├── shared/                  # Componentes compartidos
│   │   └── components/
│   │       ├── layout/         # Layout principal
│   │       ├── sidebar/        # Sidebar de navegación
│   │       ├── header/         # Header con búsqueda y notificaciones
│   │       └── theme-toggle/   # Toggle de tema
│   ├── features/                # Módulos de funcionalidades
│   │   └── dashboard/          # Dashboard principal
│   └── app.config.ts           # Configuración de la app
├── styles/                      # Sistema de diseño global
│   ├── _variables.scss         # Variables CSS (colores, espaciado, etc.)
│   ├── _components.scss        # Estilos de componentes globales
│   └── _layout.scss            # Layouts y utilidades
├── environments/                # Configuración de entornos
└── styles.scss                 # Punto de entrada de estilos
```

## 🎨 Sistema de Diseño

### Variables CSS Principales

El proyecto utiliza un sistema completo de variables CSS:

```scss
// Colores de marca
--primary-500: #3b82f6
--primary-600: #2563eb

// Superficies
--surface-primary: #ffffff
--surface-secondary: #f8fafc
--surface-tertiary: #f1f5f9

// Texto
--text-primary: #1e293b
--text-secondary: #475569
--text-tertiary: #64748b

// Estados
--success-500: #10b981
--error-500: #ef4444
--warning-500: #f59e0b
```

### Componentes Globales Reutilizables

- **Botones**: `.btn`, `.btn-primary`, `.btn-outline`, `.btn-success`, etc.
- **Tarjetas KPI**: `.kpi-card` con header, contenido y mini-charts
- **Tablas**: `.table-container` con estilos consistentes
- **Badges**: `.badge`, `.badge-success`, `.badge-error`, etc.
- **Alertas**: `.alert`, `.alert-error`, `.alert-success`, etc.
- **Formularios**: `.form-control`, `.form-label`, `.form-group`
- **Modales**: `.modal`, `.modal-overlay`

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ 
- npm o yarn
- Angular CLI 19+

### Instalación

```bash
# Clonar el repositorio
cd SmartDentalCloud-App

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
ng serve
```

Navega a `http://localhost:4200/` para ver la aplicación.

### Configuración del Backend

Actualiza la URL del backend en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7001/api'  // Tu URL de backend
};
```

## 🔧 Configuración

### Variables de Entorno

- `environment.ts` - Desarrollo
- `environment.development.ts` - Desarrollo específico

### Interceptores HTTP

El proyecto incluye interceptores configurados para:
- **Auth Interceptor**: Agrega automáticamente el token JWT a las peticiones
- **Tenant Interceptor**: Agrega el header X-Tenant-Id para multi-tenancy

## 🎯 Componentes Principales

### Layout Component
Estructura principal con sidebar, header y área de contenido.

### Dashboard Component
Página de inicio con:
- 4 tarjetas KPI con gráficos
- Tabla de próximas citas
- Acciones rápidas
- Diseño completamente responsive

### Theme Service
Servicio para gestión de temas:
```typescript
themeService.setTheme('dark');
themeService.toggleTheme();
themeService.cycleTheme();
```

## 🛠️ Comandos Útiles

```bash
# Desarrollo
ng serve                    # Servidor de desarrollo
ng build                    # Build de producción
ng test                     # Ejecutar tests
ng lint                     # Linter

# Generar componentes
ng generate component features/nombre
ng generate service core/services/nombre
```

## 📱 Responsive Design

El diseño se adapta a:
- **Desktop**: > 1024px - Layout completo con sidebar expandido
- **Tablet**: 768px - 1024px - Layout adaptado
- **Mobile**: < 768px - Sidebar colapsado, navegación móvil

## 🎨 Paleta de Colores

### Primarios
- Azul principal: `#3b82f6`
- Azul oscuro: `#2563eb`

### Estados
- Success: `#10b981`
- Error: `#ef4444`
- Warning: `#f59e0b`
- Info: `#06b6d4`

### Neutrales
- Gris 100: `#f3f4f6`
- Gris 500: `#6b7280`
- Gris 900: `#111827`

## 🔐 Autenticación

El proyecto está preparado para integrarse con el backend SmartDentalCloud:
- Interceptor de autenticación automático
- Almacenamiento seguro de tokens
- Manejo de sesiones

## 📝 Próximos Pasos

1. Conectar con el backend SmartDentalCloud API
2. Implementar módulos de pacientes, citas, tratamientos
3. Agregar gráficos y reportes avanzados
4. Implementar gestión de roles y permisos
5. Agregar tests unitarios y e2e

## 🤝 Integración con Backend

El proyecto está configurado para conectarse con el backend .NET de SmartDentalCloud en `https://localhost:7001/api`

## 📄 Licencia

Proyecto privado - SmartDentalCloud

## 👥 Equipo

Desarrollado para SmartDentalCloud con diseño basado en dentalPro.
