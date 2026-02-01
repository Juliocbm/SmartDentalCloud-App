# Features Directory

Esta carpeta contiene todos los features específicos del dominio de la aplicación, organizados por funcionalidad.

## 📁 Estructura de un Feature

Cada feature debe seguir esta estructura:

```
{feature-name}/
├── services/              ← Servicios de acceso a datos
│   └── *.service.ts
├── models/                ← Interfaces y tipos TypeScript
│   └── *.models.ts
├── components/            ← Componentes UI del feature
│   ├── {name}-list/
│   ├── {name}-form/
│   └── {name}-detail/
├── {feature-name}.ts      ← Componente principal
├── {feature-name}.html
├── {feature-name}.scss
└── {feature-name}.routes.ts  ← Rutas del feature (opcional)
```

## 🎯 Features Implementados

### ✅ Dashboard
**Ruta:** `/dashboard`  
**Descripción:** Panel principal con estadísticas y métricas clave  
**Archivos:**
- `services/dashboard.service.ts` - Obtiene stats, appointments, productos
- `models/dashboard.models.ts` - Interfaces DashboardStats, UpcomingAppointment, etc.

### ✅ Auth
**Ruta:** `/login`  
**Descripción:** Autenticación de usuarios  
**Archivos:**
- Componente de login con formulario reactivo

## 🚀 Features Futuros

### 🔜 Patients
**Ruta:** `/patients`  
**Backend:** `PatientsController`  
**Operaciones:** CRUD completo de pacientes

### 🔜 Appointments
**Ruta:** `/appointments`  
**Backend:** `AppointmentsController`  
**Operaciones:** Gestión de citas médicas

### 🔜 Treatments
**Ruta:** `/treatments`  
**Backend:** `TreatmentsController`  
**Operaciones:** Planes y tratamientos dentales

### 🔜 Billing
**Ruta:** `/billing`  
**Backend:** `InvoicesController`, `PaymentsController`  
**Operaciones:** Facturación y pagos

### 🔜 Inventory
**Ruta:** `/inventory`  
**Backend:** `ProductsController`, `SuppliersController`  
**Operaciones:** Gestión de productos y proveedores

### 🔜 Reports
**Ruta:** `/reports`  
**Backend:** `ReportsController`  
**Operaciones:** Reportes y estadísticas avanzadas

## 📝 Cómo Crear un Nuevo Feature

1. **Crear carpeta:** `features/{nombre}/`
2. **Crear modelos:** Define interfaces en `models/`
3. **Crear servicio:** Implementa API calls en `services/`
4. **Crear componentes:** UI en `components/`
5. **Configurar rutas:** Opcional en `{nombre}.routes.ts`

Ver guía completa en: `docs/ARCHITECTURE.md`
