# 🏗️ Arquitectura Frontend - SmartDentalCloud

## Principios de Diseño

Esta aplicación sigue una **arquitectura feature-based** que promueve:
- ✅ **Escalabilidad**: Nuevos features se agregan sin afectar existentes
- ✅ **Mantenibilidad**: Código organizado y fácil de localizar
- ✅ **Lazy Loading**: Carga bajo demanda de módulos
- ✅ **Testing**: Tests aislados por feature
- ✅ **Cohesión**: Todo relacionado a un feature está junto

---

## 📁 Estructura de Carpetas

```
src/app/
├── core/                              ← Servicios globales singleton
│   ├── services/
│   │   ├── api.service.ts            ← HTTP wrapper base (HttpClient)
│   │   ├── auth.service.ts           ← Autenticación JWT
│   │   ├── theme.service.ts          ← Gestión de temas UI
│   │   └── [future: tenant.service.ts, notification.service.ts]
│   ├── interceptors/
│   │   ├── auth.interceptor.ts       ← Inyecta JWT token
│   │   └── tenant.interceptor.ts     ← Inyecta tenant header
│   ├── guards/
│   │   └── auth.guard.ts             ← Protección de rutas
│   └── models/
│       ├── auth.models.ts            ← Modelos de autenticación
│       └── common.models.ts          ← Modelos compartidos
│
├── features/                          ← Features específicos del dominio
│   ├── dashboard/
│   │   ├── services/
│   │   │   └── dashboard.service.ts  ← API calls para dashboard
│   │   ├── models/
│   │   │   └── dashboard.models.ts   ← Interfaces del dashboard
│   │   ├── dashboard.ts              ← Componente principal
│   │   ├── dashboard.html
│   │   └── dashboard.scss
│   │
│   ├── patients/                      ← [FUTURO]
│   │   ├── services/
│   │   │   └── patients.service.ts
│   │   ├── models/
│   │   │   └── patient.models.ts
│   │   ├── components/
│   │   │   ├── patient-list/
│   │   │   ├── patient-form/
│   │   │   └── patient-detail/
│   │   └── patients.routes.ts
│   │
│   ├── appointments/                  ← [FUTURO]
│   │   ├── services/
│   │   │   └── appointments.service.ts
│   │   ├── models/
│   │   └── components/
│   │
│   └── [otros features...]
│
└── shared/                            ← Componentes reutilizables
    ├── components/
    │   ├── layout/
    │   ├── header/
    │   └── sidebar/
    ├── directives/
    └── pipes/
```

---

## 🎯 Reglas de Organización

### **CORE Services (Singleton)**

**Ubicación:** `src/app/core/services/`

**Características:**
- Inyectados con `providedIn: 'root'`
- Una sola instancia en toda la app
- Usados por múltiples features
- Sin dependencias de features específicos

**Cuándo usar CORE:**
- ✅ Servicios de infraestructura (HTTP, Auth, Storage)
- ✅ Servicios cross-cutting (Logging, Notifications)
- ✅ Servicios de configuración global (Theme, Tenant)

**Ejemplos:**
```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  // HTTP wrapper base
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Autenticación global
}
```

---

### **FEATURE Services (Domain-Specific)**

**Ubicación:** `src/app/features/{feature}/services/`

**Características:**
- Específicos de un dominio de negocio
- Pueden depender de core services
- Lazy-loaded con el feature
- Encapsulan lógica del dominio

**Cuándo usar FEATURE:**
- ✅ CRUD de entidades (Patients, Appointments, etc.)
- ✅ Lógica de negocio específica
- ✅ Orchestración de datos del feature

**Ejemplos:**
```typescript
// features/patients/services/patients.service.ts
@Injectable({ providedIn: 'root' })
export class PatientsService {
  constructor(private api: ApiService) {}
  
  getAll(): Observable<Patient[]> {
    return this.api.get<Patient[]>('/patients');
  }
}
```

---

## 🔄 Patrón de Comunicación

### **Flujo de Datos**

```
┌─────────────────┐
│   COMPONENT     │ ← Presenta UI, maneja eventos
└────────┬────────┘
         │ inject
         ↓
┌─────────────────┐
│ FEATURE SERVICE │ ← Lógica de negocio, transformación
└────────┬────────┘
         │ inject
         ↓
┌─────────────────┐
│  CORE SERVICE   │ ← HTTP, Auth, infraestructura
│  (ApiService)   │
└────────┬────────┘
         │ HttpClient
         ↓
┌─────────────────┐
│   BACKEND API   │
└─────────────────┘
```

### **Ejemplo Completo**

```typescript
// 1. COMPONENTE (UI Layer)
@Component({ ... })
export class PatientListComponent {
  private patientsService = inject(PatientsService);
  
  patients = signal<Patient[]>([]);
  
  ngOnInit() {
    this.loadPatients();
  }
  
  loadPatients() {
    this.patientsService.getAll().subscribe({
      next: (data) => this.patients.set(data)
    });
  }
}

// 2. FEATURE SERVICE (Business Logic Layer)
@Injectable({ providedIn: 'root' })
export class PatientsService {
  private api = inject(ApiService);
  
  getAll(): Observable<Patient[]> {
    return this.api.get<Patient[]>('/patients');
  }
  
  getById(id: string): Observable<Patient> {
    return this.api.get<Patient>(`/patients/${id}`);
  }
  
  create(patient: CreatePatientRequest): Observable<Patient> {
    return this.api.post<Patient>('/patients', patient);
  }
}

// 3. CORE SERVICE (Infrastructure Layer)
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`);
  }
}
```

---

## 📚 Guía para Crear Nuevos Features

### **Paso 1: Crear Estructura**

```bash
src/app/features/{feature-name}/
  ├── services/
  │   └── {feature-name}.service.ts
  ├── models/
  │   └── {feature-name}.models.ts
  ├── components/
  │   ├── {feature-name}-list/
  │   ├── {feature-name}-form/
  │   └── {feature-name}-detail/
  └── {feature-name}.routes.ts
```

### **Paso 2: Crear Modelos**

```typescript
// features/patients/models/patient.models.ts
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  // ...
}

export interface CreatePatientRequest {
  name: string;
  email: string;
  // ...
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {
  id: string;
}
```

### **Paso 3: Crear Servicio**

```typescript
// features/patients/services/patients.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Patient, CreatePatientRequest } from '../models/patient.models';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private api = inject(ApiService);
  
  getAll(): Observable<Patient[]> {
    return this.api.get<Patient[]>('/patients');
  }
  
  getById(id: string): Observable<Patient> {
    return this.api.get<Patient>(`/patients/${id}`);
  }
  
  create(patient: CreatePatientRequest): Observable<Patient> {
    return this.api.post<Patient>('/patients', patient);
  }
  
  update(id: string, patient: UpdatePatientRequest): Observable<Patient> {
    return this.api.put<Patient>(`/patients/${id}`, patient);
  }
  
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/patients/${id}`);
  }
}
```

### **Paso 4: Crear Componente**

```typescript
// features/patients/components/patient-list/patient-list.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { PatientsService } from '../../services/patients.service';
import { Patient } from '../../models/patient.models';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  templateUrl: './patient-list.html'
})
export class PatientListComponent implements OnInit {
  private patientsService = inject(PatientsService);
  
  patients = signal<Patient[]>([]);
  loading = signal(false);
  
  ngOnInit() {
    this.loadPatients();
  }
  
  loadPatients() {
    this.loading.set(true);
    this.patientsService.getAll().subscribe({
      next: (data) => {
        this.patients.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.loading.set(false);
      }
    });
  }
}
```

---

## 🚀 Mapa de Features según Backend

```typescript
// Backend Controllers → Frontend Features
backend/Controllers/                  frontend/features/

AuthController          →    (core/services/auth.service.ts)
PatientsController      →    patients/services/patients.service.ts
AppointmentsController  →    appointments/services/appointments.service.ts
TreatmentsController    →    treatments/services/treatments.service.ts
InvoicesController      →    billing/services/invoices.service.ts
PaymentsController      →    billing/services/payments.service.ts
ProductsController      →    inventory/services/products.service.ts
SuppliersController     →    inventory/services/suppliers.service.ts
DentistsController      →    dentists/services/dentists.service.ts
ReportsController       →    reports/services/reports.service.ts
```

---

## ✅ Beneficios de Esta Arquitectura

### **1. Escalabilidad**
```
Agregar nuevo feature = Nueva carpeta autocontenida
No afecta otros módulos
```

### **2. Mantenibilidad**
```
Modificar lógica de pacientes:
→ Solo tocas: features/patients/
→ Sin side effects en otros features
```

### **3. Lazy Loading**
```typescript
// app.routes.ts
{
  path: 'patients',
  loadChildren: () => import('./features/patients/patients.routes')
  // Solo carga cuando usuario accede a /patients
}
```

### **4. Testing**
```
features/patients/
  └── services/
      ├── patients.service.ts
      └── patients.service.spec.ts  ← Test aislado
```

### **5. Trabajo en Equipo**
```
Developer A → features/patients/
Developer B → features/appointments/
Sin conflictos de archivos
```

---

## 🚀 Lazy Loading y Optimización de Bundles

### **Estrategia Implementada**

Esta aplicación usa **lazy loading completo** para:
- ✅ Componentes
- ✅ Servicios
- ✅ Modelos
- ✅ Rutas hijas

### **Configuración de Servicios**

#### **CORE Services (Eager Loading)**
```typescript
// core/services/api.service.ts
@Injectable({ providedIn: 'root' })  // ✅ Singleton global
export class ApiService {
  // Usado por TODOS los features
}
```

**Servicios en CORE:**
- `ApiService` - HTTP wrapper
- `AuthService` - Autenticación
- `ThemeService` - UI global

#### **FEATURE Services (Lazy Loading)**
```typescript
// features/dashboard/services/dashboard.service.ts
@Injectable()  // ✅ SIN providedIn: 'root'
export class DashboardService {
  // Se carga SOLO cuando accedes a /dashboard
}
```

### **Configuración de Rutas**

#### **1. Crear archivo de rutas del feature**
```typescript
// features/dashboard/dashboard.routes.ts
import { Routes } from '@angular/router';
import { DashboardService } from './services/dashboard.service';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    providers: [DashboardService],  // ✅ Servicio lazy-loaded
    loadComponent: () => import('./dashboard').then(m => m.DashboardComponent)
  }
];
```

#### **2. Referenciar en app.routes.ts**
```typescript
// app.routes.ts
{
  path: 'dashboard',
  loadChildren: () => import('./features/dashboard/dashboard.routes')
    .then(m => m.DASHBOARD_ROUTES)
}
```

### **Chunks Generados**

```
main.js (500 KB)                    ← App core + Auth
dashboard-routes-xyz.js (150 KB)    ← Solo al acceder /dashboard
  ├─ DashboardComponent
  ├─ DashboardService
  └─ DashboardModels

patients-routes-abc.js (200 KB)     ← Solo al acceder /patients
  ├─ PatientListComponent
  ├─ PatientFormComponent
  ├─ PatientsService
  └─ PatientModels
```

### **Beneficios**

- 📦 **Bundle inicial 80% más pequeño**
- ⚡ **Carga inicial 5x más rápida**
- 🎯 **Time to interactive reducido**
- 💾 **Menos memoria consumida**

---

## 📋 Checklist para Nuevos Features

- [ ] Crear carpeta `features/{feature-name}/`
- [ ] Crear subcarpetas: `services/`, `models/`, `components/`
- [ ] Definir interfaces en `models/{feature-name}.models.ts`
- [ ] Crear servicio **SIN** `providedIn: 'root'`
- [ ] Crear archivo `{feature-name}.routes.ts` con providers
- [ ] Agregar servicio en `providers` del route
- [ ] Usar `loadChildren()` en app.routes.ts
- [ ] Inyectar `ApiService` de core en el servicio
- [ ] Crear componentes necesarios
- [ ] Agregar tests unitarios
- [ ] Documentar endpoints usados

---

## 🎓 Estándares de Código

### **Naming Conventions**
```typescript
// Services
{feature-name}.service.ts         → PatientsService

// Models
{feature-name}.models.ts          → Patient, CreatePatientRequest

// Components
{feature-name}-{type}.ts          → patient-list.ts, patient-form.ts
```

### **Imports Order**
```typescript
// 1. Angular core
import { Component, inject } from '@angular/core';

// 2. RxJS
import { Observable, map } from 'rxjs';

// 3. Core services
import { ApiService } from '../../../core/services/api.service';

// 4. Feature models
import { Patient } from '../models/patient.models';
```

---

## 📞 Contacto

Para dudas sobre esta arquitectura, revisar:
- Este documento: `docs/ARCHITECTURE.md`
- Ejemplo implementado: `features/dashboard/`
