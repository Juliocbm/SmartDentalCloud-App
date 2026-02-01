# 📅 Módulo de Citas (Appointments)

## Descripción

Módulo completo para la gestión de citas médicas dentales con funcionalidades de creación, edición, listado, filtrado y acciones rápidas.

---

## 🚀 Características Implementadas (MVP)

### ✅ Modelos e Interfaces
- `AppointmentStatus` enum (Scheduled, Confirmed, Completed, Cancelled, NoShow)
- Interfaces completas para CRUD
- DTOs de request/response
- Configuración visual de estados

### ✅ Servicio (Lazy Loaded)
- **CRUD Completo:**
  - `getById()` - Obtener cita por ID
  - `create()` - Crear nueva cita
  - `reschedule()` - Reagendar
  - `cancel()` - Cancelar
  - `complete()` - Completar
  - `markAsNoShow()` - Marcar no presentado
  - `updateNotes()` - Actualizar notas

- **Consultas Especiales:**
  - `getByDate()` - Por fecha
  - `getByPatient()` - Por paciente
  - `getMyAppointments()` - Del doctor actual
  - `getByRange()` - Por rango (calendario)
  - `getUpcoming()` - Próximas citas
  - `getAvailability()` - Slots disponibles
  - `getStatistics()` - Estadísticas

### ✅ Componentes

#### Lista de Citas (`appointment-list`)
- Tabla responsive con todas las citas
- Filtros por fecha, estado
- Búsqueda por paciente/motivo
- Acciones rápidas (completar, cancelar)
- Estados visuales con colores
- Empty state cuando no hay citas

#### Formulario de Citas (`appointment-form`)
- Creación de nuevas citas
- Reagendado de citas existentes
- Validaciones en tiempo real
- Campos: Paciente, Doctor, Fecha/Hora, Motivo
- Manejo de errores

---

## 📁 Estructura del Módulo

```
appointments/
├── models/
│   └── appointment.models.ts        # Interfaces y enums
├── services/
│   └── appointments.service.ts      # Servicio lazy-loaded
├── components/
│   ├── appointment-list/           # Lista de citas
│   │   ├── appointment-list.ts
│   │   ├── appointment-list.html
│   │   └── appointment-list.scss
│   └── appointment-form/           # Formulario crear/editar
│       ├── appointment-form.ts
│       ├── appointment-form.html
│       └── appointment-form.scss
├── appointments.routes.ts          # Configuración de rutas
└── README.md                       # Este archivo
```

---

## 🛣️ Rutas

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/appointments` | AppointmentListComponent | Lista de citas |
| `/appointments/new` | AppointmentFormComponent | Crear nueva cita |
| `/appointments/:id/edit` | AppointmentFormComponent | Reagendar cita |

---

## 🎨 Estados de Cita

| Estado | Color | Descripción |
|--------|-------|-------------|
| **Scheduled** | Azul | Cita programada |
| **Confirmed** | Verde | Cita confirmada |
| **Completed** | Gris | Cita completada |
| **Cancelled** | Rojo | Cita cancelada |
| **NoShow** | Amarillo | Paciente no se presentó |

---

## 📊 API Endpoints Utilizados

```typescript
// Backend: AppointmentsController
GET    /api/appointments                     // Lista por fecha
GET    /api/appointments/{id}                // Detalle
POST   /api/appointments                     // Crear
PATCH  /api/appointments/{id}/reschedule     // Reagendar
PATCH  /api/appointments/{id}/complete       // Completar
PATCH  /api/appointments/{id}/cancel         // Cancelar
PATCH  /api/appointments/{id}/no-show        // No show
PATCH  /api/appointments/{id}/notes          // Actualizar notas

GET    /api/appointments/patient/{id}        // Por paciente
GET    /api/appointments/my-appointments     // Del doctor
GET    /api/appointments/range               // Por rango
GET    /api/appointments/upcoming            // Próximas
GET    /api/appointments/availability        // Disponibilidad
GET    /api/appointments/statistics          // Estadísticas
```

---

## 🔧 Uso del Servicio

```typescript
import { AppointmentsService } from './services/appointments.service';

// Obtener citas del día
this.appointmentsService.getByDate(new Date()).subscribe(appointments => {
  console.log(appointments);
});

// Crear nueva cita
this.appointmentsService.create({
  patientId: '...',
  userId: '...',
  startAt: new Date(),
  endAt: new Date(),
  reason: 'Limpieza dental'
}).subscribe(appointment => {
  console.log('Cita creada:', appointment);
});

// Completar cita
this.appointmentsService.complete(appointmentId).subscribe(() => {
  console.log('Cita completada');
});
```

---

## 🎯 Próximas Mejoras (Post-MVP)

### V1 - Funcionalidades Avanzadas
- [ ] Vista de calendario (mes/semana/día)
- [ ] Componente de detalle de cita
- [ ] Autocomplete de pacientes
- [ ] Select de doctores con disponibilidad
- [ ] Verificación de disponibilidad en tiempo real
- [ ] Drag & drop para reagendar

### V2 - UX y Performance
- [ ] Virtual scrolling en listas largas
- [ ] Caché de consultas frecuentes
- [ ] Optimistic updates
- [ ] Notificaciones push
- [ ] Recordatorios automáticos
- [ ] Exportar a PDF/Excel

### V3 - Integración
- [ ] Integración con calendario Google/Outlook
- [ ] Notificaciones por email/SMS
- [ ] Sistema de confirmaciones
- [ ] Pagos online
- [ ] Videollamadas

---

## 💡 Notas Técnicas

### Lazy Loading
- Servicio configurado con lazy loading (sin `providedIn: 'root'`)
- Providers en `appointments.routes.ts`
- Chunks separados por ruta

### Manejo de Fechas
- Todas las fechas se manejan como objetos `Date`
- Conversión a ISO string para API
- Formateo localizado para México (`es-MX`)

### Validaciones
- Formularios reactivos con validaciones
- Campos requeridos: patientId, userId, startAt, endAt, reason
- Validación de longitud mínima en motivo

---

## 🐛 Problemas Conocidos

1. **IDs Temporales:** Actualmente se requieren IDs de GUID para paciente y doctor. Se integrará con selectors en V1.

2. **Sin Verificación de Disponibilidad:** No se verifica disponibilidad en tiempo real al crear. Se implementará en V1.

3. **Sin Manejo de Conflictos:** No detecta citas duplicadas en el mismo horario. Pendiente para V1.

---

## 📚 Referencias

- [Plan Completo](../../docs/APPOINTMENTS-MODULE-PLAN.md)
- [Arquitectura General](../../docs/ARCHITECTURE.md)
- [Lazy Loading Guide](../../docs/LAZY-LOADING.md)

---

## ✅ Checklist de Testing

- [ ] Listar citas por fecha
- [ ] Filtrar por estado
- [ ] Buscar por paciente
- [ ] Crear nueva cita
- [ ] Reagendar cita existente
- [ ] Completar cita
- [ ] Cancelar cita
- [ ] Validaciones de formulario
- [ ] Manejo de errores
- [ ] Responsive en mobile

---

**Estado Actual:** MVP Completo ✅  
**Última Actualización:** 01 Feb 2026  
**Desarrollado con:** Angular 19 + Signals + Lazy Loading
