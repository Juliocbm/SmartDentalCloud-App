# Horario Laboral Configurable — Plan de Implementación

## 1. Estado Actual en el Código

### Backend
- **Campo existente:** `WorkingHours` es un `string?` (`varchar(255)`) en la entidad `Tenant`.
- **Uso actual:** Se muestra en Configuración → General como texto plano (ej: "Lun-Vie 8:00-18:00").
- **Problema:** No tiene estructura, no es parseable, y no influye en ninguna lógica del sistema.
- **Archivos relevantes:**
  - `SmartDentalCloud.Infrastructure/Data/Entities/Tenant.cs` → `WorkingHours` property
  - `SmartDentalCloud.Application/Common/DTOs/TenantSettingsDto.cs` → `WorkingHours` DTO
  - `SmartDentalCloud.Infrastructure/Services/TenantService.cs` → GET/PUT settings

### Frontend — Calendario
- **Componente:** `appointment-calendar.ts` usa FullCalendar con valores **hardcodeados**:
  ```typescript
  slotMinTime: '08:00:00',
  slotMaxTime: '19:00:00',
  slotDuration: '00:30:00',
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '18:00'
  }
  ```
- **Problema:** Asume L-V 8:00-18:00 fijo, sin considerar configuración del consultorio.

### Frontend — Configuración
- **Componente:** `settings-page.ts` tiene un campo de texto libre `generalWorkingHours`.
- **Problema:** El usuario escribe texto libre que no se valida ni se usa programáticamente.

---

## 2. Benchmark de la Industria

| Plataforma | Implementación |
|-----------|---------------|
| **Dentrix** | Horario por consultorio + horario por dentista |
| **Open Dental** | Horario por proveedor + bloqueos por día |
| **Clinicminds** | Horario semanal configurable + excepciones |
| **Dentalink** | Horario por sede + horario por profesional |
| **Doctoralia** | Horario por profesional + excepciones puntuales |

**Patrón estándar (jerarquía 2-3 niveles):**
1. Horario del consultorio (cuándo está abierto el local)
2. Horario por dentista (cuándo atiende cada profesional)
3. Excepciones/bloqueos (vacaciones, días festivos, emergencias)

---

## 3. Propuesta de Valor

| Beneficio | Descripción |
|-----------|-------------|
| **Prevención de errores** | No se pueden agendar citas a las 6am o domingos por error |
| **UX del calendario** | Muestra solo las horas relevantes, no un rango genérico |
| **Base para funcionalidades futuras** | Disponibilidad online, auto-agendamiento, ocupación |
| **Reportes precisos** | "Ocupación de Agenda" necesita horas disponibles reales para calcular % |

---

## 4. Riesgos y Mitigaciones

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Horarios irregulares (L-J 9-18, V 9-14, S 9-13) | Media | Soportar horario diferente por día |
| Excepciones puntuales (festivos, abierto un domingo especial) | Media | No implementar — Fase 2 |
| Horarios diferentes por dentista | Alta | No implementar — Fase 2 |
| Citas de emergencia fuera de horario | Alta | ⭐ Nunca bloquear creación, solo guiar visualmente |
| Cambio retroactivo de horario con citas existentes fuera | Media | Solo aplicar hacia adelante |

### ⭐ Regla de Oro: El horario debe GUIAR, no BLOQUEAR

- El **calendario visual** solo muestra las horas configuradas
- El **formulario de cita** permite cualquier hora (con advertencia si está fuera de horario)
- Las **citas existentes** fuera de horario nunca se invalidan
- El **backend no rechaza** citas fuera de horario

---

## 5. Plan de Fases

### Fase 1 — Horario del Consultorio ← IMPLEMENTAR AHORA
- Horario semanal configurable (7 días × { activo, horaInicio, horaFin })
- Calendario consume datos dinámicamente
- Form de cita muestra advertencia visual (no bloqueo)
- **Esfuerzo: ~10-12 hrs**

### Fase 2 — Horario por Dentista (futuro)
- Cada dentista tiene su propio horario semanal
- Calendario filtra por dentista (ya existe filtro `onDentistChange`)
- Disponibilidad real por profesional

### Fase 3 — Excepciones y Bloqueos (futuro)
- Días festivos, vacaciones, bloqueos puntuales
- Tabla `ScheduleException` (fecha, razón, tipo)

---

## 6. Modelo de Datos — Fase 1

### Estructura JSON

```json
{
  "monday":    { "isOpen": true,  "startTime": "08:00", "endTime": "18:00" },
  "tuesday":   { "isOpen": true,  "startTime": "08:00", "endTime": "18:00" },
  "wednesday": { "isOpen": true,  "startTime": "08:00", "endTime": "18:00" },
  "thursday":  { "isOpen": true,  "startTime": "08:00", "endTime": "18:00" },
  "friday":    { "isOpen": true,  "startTime": "09:00", "endTime": "14:00" },
  "saturday":  { "isOpen": true,  "startTime": "09:00", "endTime": "13:00" },
  "sunday":    { "isOpen": false, "startTime": null,     "endTime": null    }
}
```

### Opción A — JSON en campo existente (recomendada para Fase 1)

Reutilizar el campo `WorkingHours` expandiéndolo a `nvarchar(max)` y almacenar JSON estructurado.

**Ventajas:** Sin migración de esquema compleja, un solo campo, fácil de serializar/deserializar.
**Desventajas:** No es relacional, no se puede indexar por día individual.

### Opción B — Tabla separada (recomendada si se planea Fase 2)

```sql
CREATE TABLE TenantWorkSchedule (
    Id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TenantId    UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    DayOfWeek   INT NOT NULL,          -- 0=Sunday, 1=Monday, ..., 6=Saturday
    IsOpen      BIT NOT NULL DEFAULT 1,
    StartTime   TIME NULL,             -- NULL si IsOpen=false
    EndTime     TIME NULL,
    CONSTRAINT UQ_TenantWorkSchedule_Day UNIQUE (TenantId, DayOfWeek)
);
```

**Ventajas:** Relacional, extensible a Fase 2 (agregar UserId para horarios por dentista).
**Desventajas:** Requiere nueva tabla y repositorio.

### Decisión: Opción A (JSON en Tenant.WorkingHours)

Razones:
- Fase 1 solo necesita 1 horario global por tenant
- No hay queries por día individual
- Simplicidad de implementación
- Si Fase 2 lo requiere, se migra a tabla sin romper la API

---

## 7. Plan de Implementación Detallado — Fase 1

### 7.1 Backend

#### 7.1.1 Cambio de esquema
**Script SQL manual** (no EF Migrations):
```sql
-- Expandir campo WorkingHours para almacenar JSON estructurado
ALTER TABLE Tenants ALTER COLUMN WorkingHours NVARCHAR(MAX) NULL;
```

#### 7.1.2 Domain — Modelo de valor
**Archivo:** `SmartDentalCloud.Domain/ValueObjects/WorkSchedule.cs`
```
WorkSchedule
├── DaySchedule[] Days (7 elementos)
│   ├── DayOfWeek Day
│   ├── bool IsOpen
│   ├── TimeOnly? StartTime
│   └── TimeOnly? EndTime
├── static WorkSchedule Default()     → L-V 08:00-18:00
└── bool IsWithinSchedule(DateTime)   → Verifica si una fecha/hora cae en horario
```

#### 7.1.3 Application — DTOs
**Archivo:** `SmartDentalCloud.Application/Common/DTOs/WorkScheduleDto.cs`
```
WorkScheduleDto
├── DayScheduleDto[] Days
│   ├── string DayOfWeek        → "monday", "tuesday", ...
│   ├── bool IsOpen
│   ├── string? StartTime       → "08:00"
│   └── string? EndTime         → "18:00"
```

**Archivo:** `SmartDentalCloud.Application/Tenants/Validators/WorkScheduleDtoValidator.cs`
- Validar que días abiertos tengan StartTime < EndTime
- Validar que al menos 1 día esté abierto
- Validar formato de hora (HH:mm)

#### 7.1.4 Application — Queries y Commands
**Archivo:** `SmartDentalCloud.Application/Tenants/Queries/GetWorkScheduleQuery.cs`
- Request: `GetWorkScheduleQuery : IRequest<WorkScheduleDto>`
- Handler: Lee `Tenant.WorkingHours`, deserializa JSON, retorna DTO
- Si el campo es null/vacío, retorna horario por defecto (L-V 08:00-18:00)

**Archivo:** `SmartDentalCloud.Application/Tenants/Commands/UpdateWorkScheduleCommand.cs`
- Request: `UpdateWorkScheduleCommand : IRequest<WorkScheduleDto>` con `DayScheduleDto[] Days`
- Handler: Valida, serializa a JSON, actualiza `Tenant.WorkingHours`

#### 7.1.5 API — Endpoints
**Archivo:** `SmartDentalCloud.Api/Controllers/TenantController.cs`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `GET` | `/api/tenants/work-schedule` | `[Authorize]` | Obtener horario (cualquier usuario autenticado) |
| `PUT` | `/api/tenants/work-schedule` | `[RequirePermission(Permissions.TenantsManage)]` | Actualizar horario |

---

### 7.2 Frontend

#### 7.2.1 Modelos
**Archivo:** `src/app/features/settings/models/work-schedule.models.ts`
```typescript
export interface DaySchedule {
  dayOfWeek: string;     // 'monday', 'tuesday', ...
  isOpen: boolean;
  startTime: string | null;  // 'HH:mm'
  endTime: string | null;
}

export interface WorkSchedule {
  days: DaySchedule[];
}

export const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

export const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  days: [
    { dayOfWeek: 'monday',    isOpen: true,  startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'tuesday',   isOpen: true,  startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'wednesday', isOpen: true,  startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'thursday',  isOpen: true,  startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'friday',    isOpen: true,  startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'saturday',  isOpen: false, startTime: null,     endTime: null    },
    { dayOfWeek: 'sunday',    isOpen: false, startTime: null,     endTime: null    }
  ]
};
```

#### 7.2.2 Servicio
**Archivo:** `src/app/features/settings/services/settings.service.ts` (agregar métodos)
```typescript
getWorkSchedule(): Observable<WorkSchedule>
updateWorkSchedule(schedule: WorkSchedule): Observable<WorkSchedule>
```

#### 7.2.3 Componente — Editor de Horario en Configuración
**Archivo nuevo:** `src/app/features/settings/components/work-schedule-editor/`
- `work-schedule-editor.ts`
- `work-schedule-editor.html`
- `work-schedule-editor.scss`

**Diseño UI:**
```
┌─────────────────────────────────────────────────────────┐
│  ⚙ Horario Laboral                                     │
│  Configura los días y horarios de atención              │
├─────────────────────────────────────────────────────────┤
│  Día          │ Abierto │ Hora Inicio │ Hora Fin        │
│  ─────────────┼─────────┼─────────────┼────────────     │
│  Lunes        │  [✓]    │  [08:00 ▼]  │  [18:00 ▼]     │
│  Martes       │  [✓]    │  [08:00 ▼]  │  [18:00 ▼]     │
│  Miércoles    │  [✓]    │  [08:00 ▼]  │  [18:00 ▼]     │
│  Jueves       │  [✓]    │  [08:00 ▼]  │  [18:00 ▼]     │
│  Viernes      │  [✓]    │  [09:00 ▼]  │  [14:00 ▼]     │
│  Sábado       │  [✓]    │  [09:00 ▼]  │  [13:00 ▼]     │
│  Domingo      │  [ ]    │  ────────   │  ────────       │
├─────────────────────────────────────────────────────────┤
│  [💾 Guardar Horario]                                   │
└─────────────────────────────────────────────────────────┘
```

**Comportamiento:**
- Toggle "Abierto" desactiva/grisea los selectores de hora
- Selectores de hora: dropdown cada 30 min (06:00 a 23:00)
- Validación: StartTime < EndTime, al menos 1 día abierto
- Señales: `schedule = signal<DaySchedule[]>([])`, `saving = signal(false)`

#### 7.2.4 Integración en `settings-page`
- Agregar nueva pestaña "Horario" o sección dentro de "General"
- Opción recomendada: **Nueva pestaña** `{ key: 'schedule', label: 'Horario', icon: 'fa-clock' }`
- Renderiza `<app-work-schedule-editor>` cuando `activeTab() === 'schedule'`

#### 7.2.5 Calendario — Consumir Horario Dinámicamente
**Archivo:** `appointment-calendar.ts`

Cambios:
1. Inyectar `SettingsService`
2. En `ngOnInit()`, llamar `getWorkSchedule()` antes de configurar el calendario
3. Mapear `WorkSchedule` → FullCalendar options:

```typescript
private applyWorkSchedule(schedule: WorkSchedule): void {
  const openDays = schedule.days.filter(d => d.isOpen);

  // FullCalendar businessHours format
  const businessHours = openDays.map(d => ({
    daysOfWeek: [this.dayNameToNumber(d.dayOfWeek)],
    startTime: d.startTime,
    endTime: d.endTime
  }));

  // slotMinTime/slotMaxTime = el rango más amplio de todos los días abiertos
  const allStarts = openDays.map(d => d.startTime!).sort();
  const allEnds = openDays.map(d => d.endTime!).sort();
  const slotMinTime = allStarts[0] + ':00';
  const slotMaxTime = allEnds[allEnds.length - 1] + ':00';

  // Weekends: mostrar solo si sábado o domingo están abiertos
  const weekends = openDays.some(d =>
    d.dayOfWeek === 'saturday' || d.dayOfWeek === 'sunday'
  );

  this.calendarOptions.update(options => ({
    ...options,
    businessHours,
    slotMinTime,
    slotMaxTime,
    weekends
  }));
}
```

#### 7.2.6 Form de Cita — Advertencia Visual
**Archivo:** `appointment-form.ts` / `appointment-form.html`

- Al seleccionar hora, verificar si cae dentro del horario laboral
- Si está fuera: mostrar badge de advertencia (no bloquear)
```html
@if (isOutsideWorkSchedule()) {
  <div class="badge badge-warning">
    <i class="fa-solid fa-triangle-exclamation"></i>
    Fuera del horario laboral configurado
  </div>
}
```

---

## 8. Orden de Implementación (Paso a Paso)

### Backend (primero)
1. Script SQL: expandir `WorkingHours` a `NVARCHAR(MAX)`
2. Crear `WorkSchedule` value object en Domain
3. Crear DTOs: `WorkScheduleDto`, `DayScheduleDto`
4. Crear validador: `WorkScheduleDtoValidator`
5. Crear `GetWorkScheduleQuery` + Handler
6. Crear `UpdateWorkScheduleCommand` + Handler
7. Agregar endpoints GET/PUT en `TenantController`
8. Probar con Swagger

### Frontend (después)
9. Crear modelos: `work-schedule.models.ts`
10. Agregar métodos al `SettingsService`
11. Crear componente `work-schedule-editor`
12. Integrar pestaña "Horario" en `settings-page`
13. Modificar `appointment-calendar.ts` para consumir horario
14. Agregar advertencia en `appointment-form`
15. Build + verificación visual

---

## 9. Criterios de Aceptación — Fase 1

- [ ] El administrador puede configurar horario de atención por día de la semana
- [ ] Cada día puede activarse/desactivarse con hora inicio y hora fin independientes
- [ ] El calendario de citas refleja dinámicamente el horario configurado
- [ ] Los fines de semana aparecen en el calendario solo si están configurados como abiertos
- [ ] El rango de horas del calendario (slotMin/slotMax) se ajusta al horario más amplio configurado
- [ ] Si no hay horario configurado, se usa el default (L-V 08:00-18:00)
- [ ] El formulario de cita permite agendar fuera de horario pero muestra advertencia visual
- [ ] Las citas existentes fuera de horario no se invalidan al cambiar la configuración
- [ ] El backend NO rechaza citas fuera de horario (guía, no bloqueo)

---

## 10. Archivos Afectados

### Backend — Nuevos
| Archivo | Descripción |
|---------|-------------|
| `Domain/ValueObjects/WorkSchedule.cs` | Modelo de valor con lógica de horario |
| `Application/Common/DTOs/WorkScheduleDto.cs` | DTO de respuesta |
| `Application/Common/DTOs/DayScheduleDto.cs` | DTO por día |
| `Application/Tenants/Validators/WorkScheduleDtoValidator.cs` | Validación FluentValidation |
| `Application/Tenants/Queries/GetWorkScheduleQuery.cs` | Query + Handler |
| `Application/Tenants/Commands/UpdateWorkScheduleCommand.cs` | Command + Handler |

### Backend — Modificados
| Archivo | Cambio |
|---------|--------|
| `Api/Controllers/TenantController.cs` | 2 endpoints nuevos (GET/PUT work-schedule) |
| `Infrastructure/Data/Entities/Tenant.cs` | `WorkingHours` ya existe, sin cambio de código |
| SQL Script | `ALTER COLUMN WorkingHours NVARCHAR(MAX)` |

### Frontend — Nuevos
| Archivo | Descripción |
|---------|-------------|
| `features/settings/models/work-schedule.models.ts` | Interfaces y constantes |
| `features/settings/components/work-schedule-editor/work-schedule-editor.ts` | Componente editor |
| `features/settings/components/work-schedule-editor/work-schedule-editor.html` | Template |
| `features/settings/components/work-schedule-editor/work-schedule-editor.scss` | Estilos |

### Frontend — Modificados
| Archivo | Cambio |
|---------|--------|
| `features/settings/services/settings.service.ts` | +2 métodos (getWorkSchedule, updateWorkSchedule) |
| `features/settings/components/settings-page/settings-page.ts` | +1 pestaña "Horario" |
| `features/settings/components/settings-page/settings-page.html` | Renderizar work-schedule-editor |
| `features/appointments/components/appointment-calendar/appointment-calendar.ts` | Consumir horario dinámico |
| `features/appointments/components/appointment-form/appointment-form.ts` | Verificar horario para advertencia |
| `features/appointments/components/appointment-form/appointment-form.html` | Badge "Fuera de horario" |

---

*Última actualización: Febrero 2026*
