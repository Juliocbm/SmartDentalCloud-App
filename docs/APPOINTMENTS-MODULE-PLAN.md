# 📅 Plan de Desarrollo: Módulo de Citas (Appointments)

## 🎯 Objetivo

Desarrollar un módulo completo, funcional y optimizado para la gestión de citas médicas dentales, siguiendo la arquitectura feature-based con lazy loading.

---

## 📋 FASE 1: FUNDAMENTOS (Modelos y Servicio)

### **1.1 Modelos e Interfaces** ⏱️ 30 min

**Archivo:** `features/appointments/models/appointment.models.ts`

```typescript
// Interfaces principales
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  userId: string | null;
  doctorName: string | null;
  startAt: Date;
  endAt: Date;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
}

export enum AppointmentStatus {
  Scheduled = 'Scheduled',
  Confirmed = 'Confirmed',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  NoShow = 'NoShow'
}

// Request DTOs
export interface CreateAppointmentRequest {
  patientId: string;
  userId: string;
  startAt: Date;
  endAt: Date;
  reason: string;
}

export interface RescheduleAppointmentRequest {
  newStartAt: Date;
  newEndAt: Date;
}

export interface UpdateAppointmentNotesRequest {
  notes: string;
}

export interface CancelAppointmentRequest {
  cancellationReason?: string;
}

// Query DTOs
export interface AppointmentFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  patientId?: string;
  status?: AppointmentStatus;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface AppointmentStatistics {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  noShowRate: number;
}

// UI Models
export interface AppointmentListItem extends Appointment {
  displayTime: string;
  displayDate: string;
  statusColor: string;
  statusLabel: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  extendedProps: {
    appointment: Appointment;
  };
}
```

**Tareas:**
- [ ] Crear interfaces principales
- [ ] Definir enum de estados
- [ ] Crear DTOs de request/response
- [ ] Crear modelos para UI (lista, calendario)

---

### **1.2 Appointments Service** ⏱️ 1 hora

**Archivo:** `features/appointments/services/appointments.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Appointment,
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
  AppointmentFilters,
  TimeSlot,
  AppointmentStatistics
} from '../models/appointment.models';

@Injectable() // SIN providedIn: 'root' - Lazy loaded
export class AppointmentsService {
  private api = inject(ApiService);

  // CRUD Básico
  getById(id: string): Observable<Appointment> {
    return this.api.get<Appointment>(`/appointments/${id}`);
  }

  create(request: CreateAppointmentRequest): Observable<Appointment> {
    return this.api.post<Appointment>('/appointments', request);
  }

  reschedule(id: string, request: RescheduleAppointmentRequest): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/reschedule`, request);
  }

  cancel(id: string, reason?: string): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/cancel`, { 
      cancellationReason: reason 
    });
  }

  complete(id: string): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/complete`, {});
  }

  markAsNoShow(id: string): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/no-show`, {});
  }

  updateNotes(id: string, notes: string): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/notes`, { notes });
  }

  // Consultas
  getByDate(date: Date, userId?: string): Observable<Appointment[]> {
    return this.api.get<Appointment[]>('/appointments', {
      date: date.toISOString(),
      userId
    });
  }

  getByPatient(patientId: string): Observable<Appointment[]> {
    return this.api.get<Appointment[]>(`/appointments/patient/${patientId}`);
  }

  getMyAppointments(startDate?: Date, endDate?: Date): Observable<Appointment[]> {
    return this.api.get<Appointment[]>('/appointments/my-appointments', {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });
  }

  getByRange(startDate: Date, endDate: Date, userId?: string, status?: string): Observable<Appointment[]> {
    return this.api.get<Appointment[]>('/appointments/range', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      userId,
      status
    });
  }

  getUpcoming(limit: number = 10, userId?: string): Observable<Appointment[]> {
    return this.api.get<Appointment[]>('/appointments/upcoming', {
      limit,
      userId
    });
  }

  // Disponibilidad
  getAvailability(date: Date, userId?: string, durationMinutes: number = 60): Observable<TimeSlot[]> {
    return this.api.get<TimeSlot[]>('/appointments/availability', {
      date: date.toISOString(),
      userId,
      durationMinutes
    });
  }

  // Estadísticas
  getStatistics(startDate?: Date, endDate?: Date, userId?: string): Observable<AppointmentStatistics> {
    return this.api.get<AppointmentStatistics>('/appointments/statistics', {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      userId
    });
  }
}
```

**Tareas:**
- [ ] Implementar CRUD completo
- [ ] Implementar consultas especiales
- [ ] Agregar mapeo de fechas ISO
- [ ] Agregar manejo de errores
- [ ] Sin `providedIn: 'root'` para lazy loading

---

## 📋 FASE 2: COMPONENTES (UI)

### **2.1 Lista de Citas** ⏱️ 2 horas

**Archivo:** `features/appointments/components/appointment-list/appointment-list.ts`

**Funcionalidades:**
- ✅ Tabla/tarjetas de citas
- ✅ Filtros por fecha, doctor, estado
- ✅ Búsqueda por paciente
- ✅ Paginación
- ✅ Ordenamiento
- ✅ Acciones rápidas (completar, cancelar, editar)
- ✅ Estados visuales con colores
- ✅ Vista de lista y vista de tarjetas

**Vista Desktop:**
```
┌──────────────────────────────────────────────────────┐
│ 📅 Citas                                     [+ Nueva]│
├──────────────────────────────────────────────────────┤
│ Filtros: [Fecha] [Doctor] [Estado] [Búsqueda]       │
├────┬─────────┬──────────┬─────────┬────────┬─────────┤
│ Hora│ Paciente│  Doctor  │  Motivo │ Estado │ Acciones│
├────┼─────────┼──────────┼─────────┼────────┼─────────┤
│ 9:00│ Juan P. │ Dra. Ana │ Limpieza│🟢 Prog │ [🗓][✓][✕]│
│10:30│ María G.│ Dr. Luis │ Revisión│🟡 Conf │ [🗓][✓][✕]│
└────┴─────────┴──────────┴─────────┴────────┴─────────┘
```

**Tareas:**
- [ ] Crear componente standalone
- [ ] Implementar tabla responsive
- [ ] Agregar filtros con signals
- [ ] Implementar búsqueda en tiempo real
- [ ] Agregar paginación
- [ ] Estados visuales con badges
- [ ] Acciones rápidas con confirmación

---

### **2.2 Formulario de Cita** ⏱️ 2.5 horas

**Archivo:** `features/appointments/components/appointment-form/appointment-form.ts`

**Funcionalidades:**
- ✅ Selección de paciente (autocomplete)
- ✅ Selección de doctor
- ✅ Selector de fecha y hora
- ✅ Duración de cita
- ✅ Motivo de consulta
- ✅ Verificación de disponibilidad
- ✅ Detección de conflictos
- ✅ Validaciones en tiempo real
- ✅ Modo crear/editar

**Vista:**
```
┌─────────────────────────────────────────────┐
│ Nueva Cita                           [X]    │
├─────────────────────────────────────────────┤
│ Paciente *                                  │
│ [Buscar paciente...]          🔍           │
│                                             │
│ Doctor *                                    │
│ [Seleccionar doctor ▼]                     │
│                                             │
│ Fecha y Hora *                              │
│ [📅 01/02/2026]  [⏰ 09:00] - [⏰ 10:00]  │
│                                             │
│ ✅ Horario disponible                       │
│                                             │
│ Motivo de consulta *                        │
│ [Limpieza dental, revisión, etc.]          │
│                                             │
│                   [Cancelar] [Guardar Cita]│
└─────────────────────────────────────────────┘
```

**Tareas:**
- [ ] Reactive forms con validaciones
- [ ] Autocomplete de pacientes
- [ ] Select de doctores
- [ ] Date/time pickers
- [ ] Validar disponibilidad en tiempo real
- [ ] Mostrar slots disponibles
- [ ] Detectar conflictos
- [ ] Modo edición (reschedule)

---

### **2.3 Vista de Calendario** ⏱️ 3 horas

**Archivo:** `features/appointments/components/appointment-calendar/appointment-calendar.ts`

**Funcionalidades:**
- ✅ Vista mensual
- ✅ Vista semanal
- ✅ Vista diaria
- ✅ Arrastrar y soltar (drag & drop)
- ✅ Click para crear cita
- ✅ Click en cita para ver detalle
- ✅ Colores por estado
- ✅ Filtro por doctor
- ✅ Navegación entre fechas

**Vista Semanal:**
```
┌──────────────────────────────────────────────────────┐
│ [◀] Semana 01-07 Feb 2026 [▶]    [Vista: Semana ▼]  │
├────┬────────┬────────┬────────┬────────┬────────┬────┤
│    │  Lun   │  Mar   │  Mié   │  Jue   │  Vie   │Sáb │
├────┼────────┼────────┼────────┼────────┼────────┼────┤
│09:00│Juan P. │        │Ana M.  │        │Carlos R│    │
│    │Limpieza│        │Revisión│        │Endodon.│    │
├────┼────────┼────────┼────────┼────────┼────────┼────┤
│10:00│        │María G.│        │Pedro L.│        │    │
│    │        │Ortod.  │        │Implante│        │    │
└────┴────────┴────────┴────────┴────────┴────────┴────┘
```

**Librerías Recomendadas:**
- `@fullcalendar/angular` - Calendario profesional
- O implementación custom con Angular Signals

**Tareas:**
- [ ] Integrar FullCalendar o crear custom
- [ ] Implementar vistas (mes/semana/día)
- [ ] Drag & drop para reagendar
- [ ] Click para crear cita en slot
- [ ] Popup de detalle al hacer click
- [ ] Filtros por doctor
- [ ] Colores por estado
- [ ] Navegación de fechas
- [ ] Responsive para móvil

---

### **2.4 Detalle de Cita** ⏱️ 1.5 horas

**Archivo:** `features/appointments/components/appointment-detail/appointment-detail.ts`

**Funcionalidades:**
- ✅ Información completa de la cita
- ✅ Historia del paciente
- ✅ Notas de la cita
- ✅ Acciones (completar, cancelar, reagendar)
- ✅ Timeline de cambios
- ✅ Links a paciente y tratamientos

**Vista:**
```
┌─────────────────────────────────────────────┐
│ Cita #12345                    [Editar][✕] │
├─────────────────────────────────────────────┤
│ 🟢 Programada                               │
│                                             │
│ 👤 Paciente: Juan Pérez García              │
│ 👨‍⚕️ Doctor: Dra. María González            │
│ 📅 Fecha: Lunes, 03 Feb 2026                │
│ ⏰ Hora: 09:00 - 10:00 (60 min)             │
│ 📝 Motivo: Limpieza dental                  │
│                                             │
│ Notas:                                      │
│ [Paciente llega 10 min antes...]           │
│                                             │
│ Acciones:                                   │
│ [✓ Completar] [🗓 Reagendar] [✕ Cancelar] │
└─────────────────────────────────────────────┘
```

**Tareas:**
- [ ] Mostrar información completa
- [ ] Editar notas inline
- [ ] Botones de acción con confirmación
- [ ] Link a perfil del paciente
- [ ] Historial de cambios
- [ ] Responsive design

---

## 📋 FASE 3: RUTAS Y NAVEGACIÓN

### **3.1 Configuración de Rutas** ⏱️ 30 min

**Archivo:** `features/appointments/appointments.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { AppointmentsService } from './services/appointments.service';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    providers: [AppointmentsService], // Lazy-loaded service
    children: [
      {
        path: '',
        loadComponent: () => import('./components/appointment-list/appointment-list')
          .then(m => m.AppointmentListComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./components/appointment-calendar/appointment-calendar')
          .then(m => m.AppointmentCalendarComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./components/appointment-form/appointment-form')
          .then(m => m.AppointmentFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./components/appointment-detail/appointment-detail')
          .then(m => m.AppointmentDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/appointment-form/appointment-form')
          .then(m => m.AppointmentFormComponent)
      }
    ]
  }
];
```

**Rutas:**
- `/appointments` - Lista
- `/appointments/calendar` - Vista calendario
- `/appointments/new` - Crear nueva
- `/appointments/:id` - Detalle
- `/appointments/:id/edit` - Editar/Reagendar

**Tareas:**
- [ ] Crear archivo de rutas
- [ ] Configurar providers
- [ ] Usar loadComponent para chunks
- [ ] Actualizar app.routes.ts

---

### **3.2 Actualizar app.routes.ts** ⏱️ 5 min

```typescript
{
  path: 'appointments',
  loadChildren: () => import('./features/appointments/appointments.routes')
    .then(m => m.APPOINTMENTS_ROUTES)
}
```

---

## 📋 FASE 4: FEATURES AVANZADOS

### **4.1 Filtros y Búsqueda** ⏱️ 1 hora

**Funcionalidades:**
- ✅ Filtro por rango de fechas
- ✅ Filtro por doctor
- ✅ Filtro por estado
- ✅ Búsqueda por nombre de paciente
- ✅ Búsqueda en tiempo real (debounce)
- ✅ Resetear filtros
- ✅ Guardar filtros en localStorage

**Componente:** `appointment-filters.ts`

---

### **4.2 Validaciones y Errores** ⏱️ 1 hora

**Validaciones:**
- ✅ Fecha no puede ser en el pasado
- ✅ Hora fin > hora inicio
- ✅ Doctor disponible en ese horario
- ✅ Paciente no tiene otra cita al mismo tiempo
- ✅ Duración mínima/máxima
- ✅ Horario de trabajo del consultorio

**Manejo de Errores:**
- ✅ Mensajes user-friendly
- ✅ Toasts de confirmación
- ✅ Diálogos de confirmación
- ✅ Rollback en caso de error

---

### **4.3 Estados y Acciones** ⏱️ 45 min

**Estados Visuales:**
```typescript
const statusConfig = {
  Scheduled: { color: 'primary', icon: 'calendar', label: 'Programada' },
  Confirmed: { color: 'success', icon: 'check-circle', label: 'Confirmada' },
  Completed: { color: 'success', icon: 'check', label: 'Completada' },
  Cancelled: { color: 'error', icon: 'x-circle', label: 'Cancelada' },
  NoShow: { color: 'warning', icon: 'alert-circle', label: 'No asistió' }
};
```

**Acciones Rápidas:**
- ✅ Confirmar cita
- ✅ Completar cita
- ✅ Marcar como no show
- ✅ Reagendar
- ✅ Cancelar
- ✅ Ver detalle
- ✅ Editar notas

---

## 📋 FASE 5: OPTIMIZACIONES

### **5.1 Performance** ⏱️ 30 min

**Optimizaciones:**
- ✅ Virtual scrolling para listas largas
- ✅ Lazy loading de imágenes
- ✅ Debounce en búsquedas
- ✅ Caché de consultas frecuentes
- ✅ OnPush change detection
- ✅ TrackBy en *ngFor

---

### **5.2 UX Enhancements** ⏱️ 1 hora

**Mejoras:**
- ✅ Loading skeletons
- ✅ Empty states
- ✅ Confirmaciones con diálogos
- ✅ Toasts de feedback
- ✅ Animaciones suaves
- ✅ Keyboard shortcuts
- ✅ Accesibilidad (ARIA labels)

---

### **5.3 Responsive Design** ⏱️ 1 hora

**Breakpoints:**
- Mobile: < 768px - Vista de tarjetas
- Tablet: 768px - 1024px - Tabla simplificada
- Desktop: > 1024px - Tabla completa

**Adaptaciones Mobile:**
- ✅ Bottom sheet para formularios
- ✅ Swipe actions en lista
- ✅ Calendar vista día por defecto
- ✅ FAB para crear cita

---

## 📋 FASE 6: TESTING Y DOCUMENTACIÓN

### **6.1 Tests Unitarios** ⏱️ 2 horas

**Archivos:**
- `appointments.service.spec.ts`
- `appointment-list.component.spec.ts`
- `appointment-form.component.spec.ts`
- `appointment-calendar.component.spec.ts`

**Cobertura:**
- ✅ Servicios: CRUD operations
- ✅ Componentes: Render y eventos
- ✅ Formularios: Validaciones
- ✅ Filtros: Lógica de búsqueda

---

### **6.2 Documentación** ⏱️ 1 hora

**Crear:**
- `features/appointments/README.md` - Guía del módulo
- Actualizar `docs/ARCHITECTURE.md`
- Actualizar `features/README.md`

---

## 📊 ESTIMACIÓN TOTAL

| Fase | Tiempo Estimado |
|------|-----------------|
| **1. Fundamentos** | 1.5 horas |
| **2. Componentes** | 9 horas |
| **3. Rutas** | 0.5 horas |
| **4. Features Avanzados** | 2.75 horas |
| **5. Optimizaciones** | 2.5 horas |
| **6. Testing** | 3 horas |
| **TOTAL** | **~19 horas** |

**En días de trabajo:**
- 1 desarrollador: 2-3 días
- Con pair programming: 1.5-2 días

---

## 🎯 PRIORIDADES

### **MVP (Mínimo Viable):** ~8 horas
1. ✅ Modelos e interfaces
2. ✅ Appointments Service
3. ✅ Lista básica de citas
4. ✅ Formulario de crear/editar
5. ✅ Rutas configuradas

### **V1 (Funcional Completo):** +6 horas
6. ✅ Vista de calendario
7. ✅ Detalle de cita
8. ✅ Filtros y búsqueda
9. ✅ Acciones rápidas

### **V2 (Optimizado):** +5 horas
10. ✅ Optimizaciones de performance
11. ✅ UX enhancements
12. ✅ Responsive completo
13. ✅ Tests unitarios

---

## 🚀 ORDEN RECOMENDADO DE DESARROLLO

### **Día 1: Base Sólida**
1. Modelos e interfaces (30 min)
2. AppointmentsService completo (1 hora)
3. Rutas configuradas (30 min)
4. Lista básica de citas (2 horas)

**Resultado:** Puedes ver y listar citas existentes ✅

---

### **Día 2: Crear y Editar**
5. Formulario de cita (2.5 horas)
6. Detalle de cita (1.5 horas)
7. Filtros básicos (1 hora)

**Resultado:** CRUD completo funcional ✅

---

### **Día 3: Calendario y Pulir**
8. Vista de calendario (3 horas)
9. Optimizaciones (2 horas)
10. Tests críticos (1 hora)

**Resultado:** Módulo completo y optimizado ✅

---

## 📦 DEPENDENCIAS RECOMENDADAS

```json
{
  "dependencies": {
    "@fullcalendar/angular": "^6.1.0",
    "@fullcalendar/core": "^6.1.0",
    "@fullcalendar/daygrid": "^6.1.0",
    "@fullcalendar/timegrid": "^6.1.0",
    "@fullcalendar/interaction": "^6.1.0"
  }
}
```

**Alternativas:**
- Angular CDK (drag & drop)
- date-fns (manipulación de fechas)
- RxJS operators (debounce, distinctUntilChanged)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Setup**
- [ ] Crear carpeta `features/appointments/`
- [ ] Crear subcarpetas: `services/`, `models/`, `components/`
- [ ] Instalar dependencias (FullCalendar si se usa)

### **Modelos**
- [ ] Crear `appointment.models.ts` con todas las interfaces
- [ ] Definir enum `AppointmentStatus`
- [ ] Crear DTOs de request/response

### **Servicio**
- [ ] Crear `appointments.service.ts` **SIN** `providedIn: 'root'`
- [ ] Implementar CRUD completo
- [ ] Implementar consultas especiales
- [ ] Agregar manejo de fechas ISO

### **Componentes**
- [ ] Lista de citas con filtros
- [ ] Formulario de crear/editar
- [ ] Vista de calendario
- [ ] Detalle de cita
- [ ] Componente de filtros (shared)

### **Rutas**
- [ ] Crear `appointments.routes.ts` con providers
- [ ] Configurar lazy loading
- [ ] Actualizar `app.routes.ts`

### **Features**
- [ ] Validaciones en formularios
- [ ] Verificación de disponibilidad
- [ ] Acciones rápidas (completar, cancelar)
- [ ] Estados visuales
- [ ] Responsive design

### **Optimización**
- [ ] Lazy loading completo
- [ ] Performance optimizations
- [ ] Loading states
- [ ] Error handling

### **Testing**
- [ ] Tests de servicio
- [ ] Tests de componentes
- [ ] Tests de formularios

### **Documentación**
- [ ] README del módulo
- [ ] Actualizar arquitectura general

---

## 🎨 DISEÑO Y UX

### **Colores por Estado:**
```scss
$appointment-colors: (
  scheduled: #3b82f6,    // Azul
  confirmed: #10b981,    // Verde
  completed: #6b7280,    // Gris
  cancelled: #ef4444,    // Rojo
  no-show: #f59e0b      // Naranja
);
```

### **Iconos:**
- 📅 Calendar - Cita general
- ✓ Check - Completada
- ✕ X - Cancelada
- ⚠️ Alert - No show
- 🕐 Clock - Hora
- 👤 User - Paciente
- 👨‍⚕️ Doctor - Profesional

---

## 💡 MEJORES PRÁCTICAS

### **Código:**
- ✅ Signals para estado reactive
- ✅ Standalone components
- ✅ Lazy loading completo
- ✅ Type-safe con TypeScript
- ✅ Immutability en estado

### **UX:**
- ✅ Feedback inmediato
- ✅ Confirmaciones en acciones destructivas
- ✅ Loading states
- ✅ Empty states amigables
- ✅ Errores claros

### **Performance:**
- ✅ OnPush change detection
- ✅ Virtual scrolling
- ✅ Debounce en búsquedas
- ✅ TrackBy en listas
- ✅ Caché inteligente

---

## 📞 SIGUIENTE PASO

¿Quieres que comience con:
1. **MVP (8 horas)** - Lo esencial para funcionar
2. **V1 Completo (14 horas)** - Funcional y pulido
3. **Paso a paso** - Guiarte en cada fase

Recomiendo empezar con el **MVP** y luego iterar. ¿Procedemos?
