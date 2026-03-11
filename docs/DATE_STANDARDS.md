# Estándar de Fechas y Horas — SmartDentalCloud

Este documento define las convenciones para el manejo de fechas y horas en todo el SaaS.

---

## Backend (.NET 8)

### Tipos de datos por propósito

| Propósito | Tipo C# | Tipo SQL Server | Ejemplo |
|-----------|---------|-----------------|---------|
| Timestamp (creación, actualización) | `DateTime` | `datetime2(7)` | `CreatedAt`, `UpdatedAt` |
| Fecha con hora (citas, eventos) | `DateTime` | `datetime2(7)` | `StartAt`, `EndAt` |
| Fecha pura (nacimiento, vencimiento) | `DateOnly` | `date` | `DateOfBirth`, `ExpiryDate` |
| Hora pura (horarios) | `TimeOnly` | `time(0)` | `StartTime`, `EndTime` |

### Reglas

- **Siempre usar `DateTime.UtcNow`** para timestamps. Nunca `DateTime.Now` ni `DateTime.Today`.
- Los defaults en SQL Server usan `GETUTCDATE()`.
- No se configura un formato global de JSON; System.Text.Json serializa `DateTime` como ISO 8601 por defecto.
- `DateOnly` y `TimeOnly` se serializan como `string` en DTOs cuando es necesario (ej: `ScheduleExceptionDto`).

---

## Frontend (Angular 20)

### Servicio centralizado: `DateFormatService`

Ubicación: `src/app/core/services/date-format.service.ts`

Todos los métodos son **estáticos**, usan `Intl.DateTimeFormat('es-MX')` y aceptan `Date | string | null | undefined`.

| Método | Formato | Uso |
|--------|---------|-----|
| `shortDate()` | `09/03/2026` | Tablas, listas, resúmenes |
| `longDate()` | `09 de marzo de 2026` | Detail views |
| `dateTime()` | `09/03/2026 14:30` | Timestamps, auditoría |
| `compactDate()` | `09 mar` | Dashboards compactos |
| `fullDate()` | `domingo, 09 de marzo de 2026` | Calendario |
| `mediumDate()` | `9 mar 2026` | Badges, etiquetas |
| `timeOnly()` | `14:30` | Horas |
| `dateForApi()` | `2026-03-09` | Enviar fecha pura al backend |
| `dateTimeForApi()` | `2026-03-09T14:30:00` | Enviar datetime al backend |

### Cuándo usar cada formato

| Contexto | Método |
|----------|--------|
| Columna de tabla / lista | `shortDate()` |
| Header de vista detalle | `longDate()` |
| Audit info (creado/actualizado) | `dateTime()` |
| Dashboard KPIs | `compactDate()` o `mediumDate()` |
| Calendario de citas | `fullDate()` |
| Slot de hora | `timeOnly()` |
| Query param / API request (fecha) | `dateForApi()` |
| Body de request (datetime) | `dateTimeForApi()` |

### Reglas

- **Nunca crear `formatDate()` local en un componente.** Usar siempre `DateFormatService`.
- **Nunca usar `toLocaleDateString()`** directamente. Usar `DateFormatService`.
- **Angular DatePipe** (`| date:'dd/MM/yyyy'`) es aceptable en templates para formatos simples que coincidan con `shortDate`.
- El **date-picker** (`flatpickr`) emite `YYYY-MM-DD` para fechas y `YYYY-MM-DDTHH:mm` para datetimes.
- Locale fijo: `es-MX` (México).

---

## Dos bases temporales en el sistema

El sistema maneja **dos bases temporales distintas**:

| Tipo | Base temporal | Cómo se genera | Ejemplo |
|------|--------------|----------------|---------|
| **Schedule time** | Local naive (timezone del tenant, sin offset) | flatpickr → `YYYY-MM-DDTHH:mm` | `StartAt`, `EndAt` |
| **Audit time** | UTC (`DateTime.UtcNow`) | Backend genera al crear/modificar | `CreatedAt`, `UpdatedAt`, `ChangedAt` |

### ⚠️ Regla crítica: comparar schedule time contra "ahora"

Las fechas de citas (`StartAt`, `EndAt`) están en **hora local del tenant** (naive, sin timezone).
Para compararlas contra "ahora", **nunca usar `DateTime.UtcNow` ni `DateTime.Now` directamente**.

**Usar siempre `ITenantTimeProvider.GetCurrentTenantTime()`**, que convierte `DateTime.UtcNow`
a la zona horaria configurada del tenant (`Tenant.TimeZone`, default: `"America/Mexico_City"`).

```csharp
// ❌ INCORRECTO — compara UTC contra hora local naive
if (startAt < DateTime.UtcNow.AddMinutes(-5))

// ❌ INCORRECTO — depende de la timezone del servidor
if (startAt < DateTime.Now.AddMinutes(-5))

// ✅ CORRECTO — usa la timezone del tenant
var now = _tenantTimeProvider.GetCurrentTenantTime();
if (startAt < now.AddMinutes(-5))
```

**Dónde se usa `ITenantTimeProvider`:**
- Validators de citas (ScheduleAppointmentCommandValidator, RescheduleAppointmentCommandValidator)
- Handlers de citas (ScheduleAppointmentCommandHandler, RescheduleAppointmentCommandHandler)
- Queries de citas (GetUpcomingAppointmentsQueryHandler)
- Domain entity Appointment (recibe `currentTenantTime` como parámetro)

---

## Flujo completo de una fecha

```
Usuario selecciona fecha en date-picker
  → flatpickr emite "2026-03-09" (date) o "2026-03-09T18:05" (datetime)
  → Angular envía string al backend via HTTP POST/PUT
  → System.Text.Json deserializa como DateTime (Kind=Unspecified)
  → Entity factory method asigna el valor
  → EF Core persiste en datetime2(7) / date
  → API responde con ISO 8601: "2026-03-09T18:05:00"
  → Frontend recibe string, DateFormatService formatea para display
```
