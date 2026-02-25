# Multi-Sucursal (Multi-Location) — Plan de Implementación

Plan completo para agregar soporte de múltiples ubicaciones físicas (sucursales) dentro de un mismo tenant, abarcando citas, horarios, inventario y gestión administrativa.

---

## Regla de Oro

> **"Si el tenant tiene solo 1 ubicación, el sistema se comporta exactamente igual que hoy. Cero cambios visibles. Los selectores de ubicación solo aparecen cuando existen ≥2 ubicaciones activas."**

Esta regla aplica a **todo** componente frontend y a las respuestas de API.

---

## Decisiones de Diseño (Confirmadas)

| Pregunta | Decisión |
|----------|----------|
| ¿Inventario por sucursal? | **Sí**, desde el inicio |
| ¿Facturas por sucursal? | **No**, facturación no necesita segmentación |
| ¿Paciente por sucursal? | **No**, paciente es global del tenant |
| ¿RFC por sucursal? | **No**, mismo RFC/razón social — son sucursales del mismo negocio |
| ¿Implementación por fases? | **Sí**, todas las fases pero en orden de prioridad |

---

## Modelo de Datos

### Nueva Entidad: `Location` (Sucursal)

```
[configuracion].[Location]
├── Id                  UNIQUEIDENTIFIER PK DEFAULT NEWID()
├── TenantId            UNIQUEIDENTIFIER NOT NULL FK → [configuracion].[Tenant]
├── Name                NVARCHAR(150) NOT NULL        -- "Consultorio Apodaca"
├── Address             NVARCHAR(500) NOT NULL         -- "Apodaca #132, Col. San José"
├── Phone               NVARCHAR(20) NULL
├── Email               NVARCHAR(150) NULL
├── IsActive            BIT NOT NULL DEFAULT 1
├── IsDefault           BIT NOT NULL DEFAULT 0         -- Sucursal principal
├── SortOrder           INT NOT NULL DEFAULT 0
├── CreatedAt           DATETIME2 NOT NULL DEFAULT GETUTCDATE()
└── UpdatedAt           DATETIME2 NULL
```

**Reglas de negocio:**
- Siempre debe existir **exactamente 1** ubicación con `IsDefault = 1` por tenant
- Al crear el primer Location, se marca como `IsDefault = 1` automáticamente
- No se puede desactivar la ubicación default si es la única activa
- `Name` debe ser único dentro del tenant

### Nueva Tabla Puente: `UserLocation`

```
[configuracion].[UserLocation]
├── UserId              UNIQUEIDENTIFIER NOT NULL FK → [seguridad].[User]
├── LocationId          UNIQUEIDENTIFIER NOT NULL FK → [configuracion].[Location]
├── TenantId            UNIQUEIDENTIFIER NOT NULL FK → [configuracion].[Tenant]
└── PK compuesto: (UserId, LocationId)
```

**Regla:** Un usuario (dentista) puede estar asignado a múltiples ubicaciones.

### Columnas nuevas en entidades existentes

| Tabla | Esquema | Campo nuevo | Tipo | Nullable | Nota |
|-------|---------|------------|------|----------|------|
| `Appointment` | `citas` | `LocationId` | `UNIQUEIDENTIFIER` | `NULL` | Retrocompatibilidad: citas viejas sin ubicación |
| `WorkSchedules` | `configuracion` | `LocationId` | `UNIQUEIDENTIFIER` | `NULL` | `NULL` = horario global |
| `ScheduleExceptions` | `configuracion` | `LocationId` | `UNIQUEIDENTIFIER` | `NULL` | `NULL` = aplica a todas |
| `Stock` | `inventario` | `LocationId` | `UNIQUEIDENTIFIER` | `NOT NULL` | **Cambia PK** de `(ProductId)` a `(ProductId, LocationId)` |
| `StockMovement` | `inventario` | `LocationId` | `UNIQUEIDENTIFIER` | `NOT NULL` | Trazabilidad por sucursal |
| `PurchaseOrder` | `inventario` | `LocationId` | `UNIQUEIDENTIFIER` | `NULL` | ¿A qué sucursal se entrega? |

### Impacto en Stock (Cambio de PK)

El cambio más significativo: `Stock` pasa de relación 1:1 (`Product → Stock`) a relación 1:N (`Product → Stock[]`), una fila por cada combinación `(ProductId, LocationId)`.

**Antes:** Un producto tiene UN registro de stock global.
**Después:** Un producto tiene UN registro de stock **por cada ubicación**.

Esto requiere:
- Cambiar PK de `Stock` de `(ProductId)` a `(ProductId, LocationId)`
- Actualizar el trigger `trg_UpdateStockOnMovement` para considerar `LocationId`
- Actualizar vistas SQL (`vw_LowStock`, `vw_InventoryValuation`) para incluir `LocationId`
- Actualizar el Domain entity `Stock` para incluir `LocationId`

---

## Fases de Implementación

### FASE 1 — Backend: Location Entity + CRUD + SQL

**Objetivo:** Crear la base de datos, entidades de dominio e infraestructura, CRUD completo via API.

#### 1.1 SQL Script Manual

```sql
-- =============================================
-- FASE MULTISUCURSAL: Script de base de datos
-- =============================================

-- 1. Tabla Location
CREATE TABLE [configuracion].[Location] (
    Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TenantId        UNIQUEIDENTIFIER NOT NULL,
    Name            NVARCHAR(150)    NOT NULL,
    Address         NVARCHAR(500)    NOT NULL,
    Phone           NVARCHAR(20)     NULL,
    Email           NVARCHAR(150)    NULL,
    IsActive        BIT              NOT NULL DEFAULT 1,
    IsDefault       BIT              NOT NULL DEFAULT 0,
    SortOrder       INT              NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NULL,
    CONSTRAINT PK_Location PRIMARY KEY (Id),
    CONSTRAINT FK_Location_Tenant FOREIGN KEY (TenantId)
        REFERENCES [configuracion].[Tenant](Id),
    CONSTRAINT UQ_Location_Name UNIQUE (TenantId, Name)
);

CREATE INDEX IX_Location_TenantId ON [configuracion].[Location](TenantId);
CREATE INDEX IX_Location_IsActive ON [configuracion].[Location](TenantId, IsActive);

-- 2. Tabla puente UserLocation
CREATE TABLE [configuracion].[UserLocation] (
    UserId          UNIQUEIDENTIFIER NOT NULL,
    LocationId      UNIQUEIDENTIFIER NOT NULL,
    TenantId        UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT PK_UserLocation PRIMARY KEY (UserId, LocationId),
    CONSTRAINT FK_UserLocation_User FOREIGN KEY (UserId)
        REFERENCES [seguridad].[User](Id),
    CONSTRAINT FK_UserLocation_Location FOREIGN KEY (LocationId)
        REFERENCES [configuracion].[Location](Id),
    CONSTRAINT FK_UserLocation_Tenant FOREIGN KEY (TenantId)
        REFERENCES [configuracion].[Tenant](Id)
);

CREATE INDEX IX_UserLocation_LocationId ON [configuracion].[UserLocation](LocationId);
CREATE INDEX IX_UserLocation_TenantId ON [configuracion].[UserLocation](TenantId);

-- 3. LocationId en Appointment
ALTER TABLE [citas].[Appointment]
    ADD LocationId UNIQUEIDENTIFIER NULL
    CONSTRAINT FK_Appointment_Location FOREIGN KEY (LocationId)
        REFERENCES [configuracion].[Location](Id);

CREATE INDEX IX_Appointment_LocationId ON [citas].[Appointment](LocationId);

-- 4. LocationId en WorkSchedules
ALTER TABLE [configuracion].[WorkSchedules]
    ADD LocationId UNIQUEIDENTIFIER NULL
    CONSTRAINT FK_WorkSchedules_Location FOREIGN KEY (LocationId)
        REFERENCES [configuracion].[Location](Id);

CREATE INDEX IX_WorkSchedules_LocationId ON [configuracion].[WorkSchedules](LocationId);

-- 5. LocationId en ScheduleExceptions
ALTER TABLE [configuracion].[ScheduleExceptions]
    ADD LocationId UNIQUEIDENTIFIER NULL
    CONSTRAINT FK_ScheduleExceptions_Location FOREIGN KEY (LocationId)
        REFERENCES [configuracion].[Location](Id);

CREATE INDEX IX_ScheduleExceptions_LocationId ON [configuracion].[ScheduleExceptions](LocationId);

-- 6. Stock: cambio de PK para soportar multi-location
--    IMPORTANTE: Requiere migración de datos existentes

-- 6a. Agregar LocationId a Stock
ALTER TABLE [inventario].[Stock]
    ADD LocationId UNIQUEIDENTIFIER NULL;

-- 6b. Agregar LocationId a StockMovement
ALTER TABLE [inventario].[StockMovement]
    ADD LocationId UNIQUEIDENTIFIER NULL;

-- 6c. LocationId en PurchaseOrder
ALTER TABLE [inventario].[PurchaseOrder]
    ADD LocationId UNIQUEIDENTIFIER NULL
    CONSTRAINT FK_PurchaseOrder_Location FOREIGN KEY (LocationId)
        REFERENCES [configuracion].[Location](Id);

-- NOTA: La migración de datos existentes (asignar LocationId default)
-- se hará DESPUÉS de crear la primera Location por tenant.
-- Ver script de migración de datos más abajo.
```

#### 1.2 Domain Layer

**Nuevo archivo:** `SmartDentalCloud.Domain/Entities/Location.cs`

```csharp
public class Location
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string Name { get; private set; }
    public string Address { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public bool IsActive { get; private set; }
    public bool IsDefault { get; private set; }
    public int SortOrder { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private Location() { }

    public static Location Create(Guid tenantId, string name, string address,
        string? phone, string? email, bool isDefault = false, int sortOrder = 0) { ... }

    public void Update(string name, string address, string? phone, string? email, int sortOrder) { ... }
    public void SetAsDefault() { ... }
    public void Activate() { ... }
    public void Deactivate() { ... }
}
```

**Modificaciones:**
- `Appointment.Schedule()` → agregar parámetro `Guid? locationId`
- `WorkSchedule.CreateOpen()` / `CreateClosed()` → agregar `Guid? locationId`
- `ScheduleException.CreateClosed()` / `CreateModifiedHours()` → agregar `Guid? locationId`
- `Stock.Initialize()` → agregar `Guid locationId`
- `PurchaseOrder.Create()` → agregar `Guid? locationId`

#### 1.3 Infrastructure Layer

**Nuevos archivos:**
- `Data/Entities/Location.cs` — EF entity con navigation properties
- `Data/Entities/UserLocation.cs` — EF join entity

**Modificaciones:**
- `SmartDentalCloudDbContext.cs`:
  - Agregar `DbSet<Location>`, `DbSet<UserLocation>`
  - Agregar `LocationId` a entidades existentes de EF
  - Configurar entity mappings en `OnModelCreating`
  - Agregar query filter para Location
- `Mappings/` — AutoMapper profiles para Location ↔ Domain
- Actualizar infrastructure entities: `Appointment`, `WorkSchedule`, `ScheduleException`, `Stock`, `StockMovement`, `PurchaseOrder`

#### 1.4 Application Layer

**Nuevos archivos (feature folder `Locations/`):**

```
Application/
└── Locations/
    ├── Commands/
    │   ├── CreateLocationCommand.cs
    │   ├── CreateLocationCommandHandler.cs
    │   ├── CreateLocationCommandValidator.cs
    │   ├── UpdateLocationCommand.cs
    │   ├── UpdateLocationCommandHandler.cs
    │   ├── UpdateLocationCommandValidator.cs
    │   ├── DeleteLocationCommand.cs
    │   ├── DeleteLocationCommandHandler.cs
    │   ├── AssignUsersToLocationCommand.cs
    │   ├── AssignUsersToLocationCommandHandler.cs
    │   ├── RemoveUserFromLocationCommand.cs
    │   └── RemoveUserFromLocationCommandHandler.cs
    └── Queries/
        ├── GetAllLocationsQuery.cs
        ├── GetAllLocationsQueryHandler.cs
        ├── GetLocationQuery.cs
        └── GetLocationQueryHandler.cs
```

**Nuevos DTOs:**
- `LocationDto` — Id, TenantId, Name, Address, Phone, Email, IsActive, IsDefault, SortOrder, AssignedUsers[]
- `LocationSummaryDto` — Id, Name (para dropdowns)
- `CreateLocationRequest` / `UpdateLocationRequest`

**Permisos nuevos en `Permissions.cs`:**
```csharp
// Sucursales
public const string LocationsView = "locations.view";
public const string LocationsCreate = "locations.create";
public const string LocationsEdit = "locations.edit";
public const string LocationsDelete = "locations.delete";
```

#### 1.5 API Layer

**Nuevo archivo:** `Controllers/LocationsController.cs`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `GET` | `/api/locations` | `locations.view` | Listar ubicaciones del tenant |
| `GET` | `/api/locations/{id}` | `locations.view` | Detalle de ubicación |
| `POST` | `/api/locations` | `locations.create` | Crear ubicación |
| `PUT` | `/api/locations/{id}` | `locations.edit` | Actualizar ubicación |
| `DELETE` | `/api/locations/{id}` | `locations.delete` | Desactivar ubicación |
| `POST` | `/api/locations/{id}/users` | `locations.edit` | Asignar usuarios |
| `DELETE` | `/api/locations/{id}/users/{userId}` | `locations.edit` | Remover usuario |

#### 1.6 Servicio auxiliar: `ILocationService`

```csharp
public interface ILocationService
{
    Task<bool> HasMultipleLocationsAsync(Guid tenantId, CancellationToken ct);
    Task<Guid?> GetDefaultLocationIdAsync(Guid tenantId, CancellationToken ct);
    Task<List<LocationSummaryDto>> GetActiveLocationsAsync(Guid tenantId, CancellationToken ct);
}
```

Este servicio se inyecta donde se necesite saber si el tenant tiene multi-location habilitado (para la regla de oro).

---

### FASE 2 — Frontend: UI de Gestión de Sucursales

**Objetivo:** Pantalla en Configuración para CRUD de ubicaciones y asignación de doctores.

#### 2.1 Nuevos archivos (feature `settings/`)

```
features/settings/
├── components/
│   ├── location-list/
│   │   ├── location-list.ts
│   │   ├── location-list.html
│   │   └── location-list.scss
│   └── location-form/
│       ├── location-form.ts        -- Modal para crear/editar
│       ├── location-form.html
│       └── location-form.scss
├── models/
│   └── location.models.ts          -- Interfaces + DTOs
└── services/
    └── locations.service.ts         -- API calls
```

#### 2.2 Componentes compartidos nuevos

```
shared/components/
└── location-selector/
    ├── location-selector.ts         -- Dropdown reutilizable
    ├── location-selector.html
    └── location-selector.scss
```

**`LocationSelectorComponent`**: Dropdown que solo se muestra si `hasMultipleLocations()`. Acepta `[locationId]` input y emite `(locationChange)`. Si hay solo 1 ubicación, se oculta completamente (regla de oro).

#### 2.3 Servicio frontend: `LocationsService`

```typescript
@Injectable({ providedIn: 'root' })
export class LocationsService {
  // Cache de locations para evitar llamadas repetidas
  private locationsCache = signal<LocationSummary[]>([]);
  hasMultipleLocations = computed(() => this.locationsCache().length > 1);

  getAll(): Observable<Location[]>
  getById(id: string): Observable<Location>
  create(data: CreateLocationRequest): Observable<Location>
  update(id: string, data: UpdateLocationRequest): Observable<Location>
  delete(id: string): Observable<void>
  assignUsers(locationId: string, userIds: string[]): Observable<void>
  removeUser(locationId: string, userId: string): Observable<void>
  getSummaries(): Observable<LocationSummary[]>  // Para dropdowns
}
```

#### 2.4 Integración en Settings Page

- Nueva tab/sección "Sucursales" en la página de configuración
- Tabla con: Nombre, Dirección, Teléfono, Estado (activa/inactiva), Default badge
- Botón "Nueva Sucursal" abre modal
- Click en fila abre modal de edición
- Sección de "Doctores asignados" dentro del modal de edición

---

### FASE 3 — Integrar Location con Citas

**Objetivo:** Al agendar una cita, seleccionar en qué sucursal se atenderá.

#### 3.1 Backend

**Modificaciones:**
- `ScheduleAppointmentCommand` → agregar `Guid? LocationId`
- `ScheduleAppointmentCommandHandler`:
  - Validar que `LocationId` existe si se proporciona
  - Resolver `LocationName` para el DTO
  - Overlap check: solo comparar citas **del mismo doctor en la misma ubicación**
- `AppointmentDto` → agregar `LocationId?`, `LocationName?`
- `GetAllAppointmentsQueryHandler` → incluir LocationName en resultados
- `RescheduleAppointmentCommand` → permitir cambiar LocationId
- Availability query → filtrar por ubicación

#### 3.2 Frontend

**Modificaciones:**
- `appointment.models.ts` → agregar `locationId?`, `locationName?` a interfaces
- `appointment-form.ts/html` → agregar `<app-location-selector>` (solo visible si multi-location)
- `appointment-calendar.ts/html` → agregar filtro por ubicación en header del calendario
- `appointment-detail.ts/html` → mostrar ubicación en info de la cita
- `appointment-list.ts/html` → columna "Sucursal" (solo si multi-location)
- `appointments-dashboard.ts/html` → filtro y estadísticas por ubicación

---

### FASE 4 — Integrar con Horarios y Excepciones

**Objetivo:** Configurar horarios laborales y excepciones por sucursal.

#### 4.1 Backend

**Modificaciones:**
- `WorkSchedule` entity → `LocationId?` en factory methods y Update
- `ScheduleException` entity → `LocationId?` en factory methods y Update
- `ITenantService`:
  - `GetWorkScheduleAsync(tenantId, userId?, locationId?)`
  - `SaveWorkScheduleAsync(tenantId, userId?, locationId?, schedules)`
  - `GetScheduleExceptionsAsync(tenantId, from?, to?, userId?, locationId?)`
  - `CreateScheduleExceptionAsync(exception)` — ya incluye LocationId en entity
- DTOs actualizados: `WorkScheduleDto.LocationId?`, `ScheduleExceptionDto.LocationId?`, `LocationName?`
- Availability service → considerar horarios y excepciones por ubicación

#### 4.2 Frontend

**Modificaciones:**
- `work-schedule-editor` → agregar selector de ubicación: "Horario de [Sucursal X]"
- `dentist-schedule-manager` → filtrar por ubicación: "Horario del Dr. José en [Sucursal]"
- `schedule-exceptions-manager` → filtro de ubicación + mostrar columna Sucursal
- `schedule-exception.models.ts` → agregar `locationId?`, `locationName?`
- `work-schedule.models.ts` → agregar `locationId?`

---

### FASE 5 — Integrar con Inventario

**Objetivo:** Stock exclusivo por sucursal. Cada ubicación tiene su propio inventario.

#### 5.1 Backend — Cambios de modelo

**El cambio más significativo del plan.** `Stock` pasa de ser 1:1 con `Product` a ser 1:N.

**Domain:**
- `Stock.Initialize()` → requiere `Guid locationId` (ya no nullable)
- `Stock.LocationId` → nueva propiedad required
- Nuevos métodos en `Stock`: considerar `LocationId` en todas las operaciones

**Infrastructure:**
- `Stock` EF entity → agregar `LocationId`, **cambiar PK** de `(ProductId)` a `(ProductId, LocationId)`
- `StockMovement` EF entity → agregar `LocationId`
- `PurchaseOrder` EF entity → agregar `LocationId?`
- Actualizar `SmartDentalCloudDbContext.OnModelCreating`:
  - Stock: `entity.HasKey(e => new { e.ProductId, e.LocationId })`
  - Nuevos índices y FK
- `Product.Stock` navigation: cambiar de `Stock?` (1:1) a `ICollection<Stock>` (1:N)

**Application — Inventory:**
- Todos los handlers de Stock y StockMovement deben recibir/usar `LocationId`
- `CreateStockMovementCommand` → agregar `LocationId`
- `GetProductStockQuery` → filtrar por `LocationId?` o agregar totales
- `ReceivePurchaseOrderCommandHandler` → crear stock en la ubicación correcta
- Reportes de inventario → filtrar por ubicación + vista agregada

**SQL:**
- Actualizar trigger `trg_UpdateStockOnMovement` para considerar `LocationId`
- Actualizar vistas `vw_LowStock`, `vw_InventoryValuation` para incluir `LocationId`
- Script de migración de datos existentes

#### 5.2 Frontend — Inventario

**Modificaciones:**
- `inventory/` components → agregar `<app-location-selector>` como filtro global
- `product-detail` → mostrar stock desglosado por ubicación (tabla)
- `stock-movements` → filtrar por ubicación
- `purchase-order-form` → selector de sucursal destino
- `inventory-dashboard` → KPIs por ubicación o total
- `low-stock-alerts` → incluir nombre de ubicación

#### 5.3 Script de Migración de Datos

```sql
-- Para tenants existentes sin ubicaciones:
-- 1. Crear una Location default por cada tenant que tenga stock

INSERT INTO [configuracion].[Location] (Id, TenantId, Name, Address, IsActive, IsDefault, SortOrder)
SELECT NEWID(), t.Id, t.Name, ISNULL(t.Address, 'Dirección principal'), 1, 1, 0
FROM [configuracion].[Tenant] t
WHERE NOT EXISTS (
    SELECT 1 FROM [configuracion].[Location] l WHERE l.TenantId = t.Id
);

-- 2. Asignar LocationId default al stock existente
UPDATE s
SET s.LocationId = l.Id
FROM [inventario].[Stock] s
INNER JOIN [configuracion].[Location] l ON l.TenantId = s.TenantId AND l.IsDefault = 1
WHERE s.LocationId IS NULL;

-- 3. Asignar LocationId default a StockMovements existentes
UPDATE sm
SET sm.LocationId = l.Id
FROM [inventario].[StockMovement] sm
INNER JOIN [configuracion].[Location] l ON l.TenantId = sm.TenantId AND l.IsDefault = 1
WHERE sm.LocationId IS NULL;

-- 4. Cambiar PK de Stock (DESPUÉS de migrar datos)
ALTER TABLE [inventario].[Stock] DROP CONSTRAINT PK_Stock; -- nombre real puede variar
ALTER TABLE [inventario].[Stock] ALTER COLUMN LocationId UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE [inventario].[Stock] ADD CONSTRAINT PK_Stock PRIMARY KEY (ProductId, LocationId);
ALTER TABLE [inventario].[Stock] ADD CONSTRAINT FK_Stock_Location
    FOREIGN KEY (LocationId) REFERENCES [configuracion].[Location](Id);

-- 5. NOT NULL en StockMovement.LocationId
ALTER TABLE [inventario].[StockMovement] ALTER COLUMN LocationId UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE [inventario].[StockMovement] ADD CONSTRAINT FK_StockMovement_Location
    FOREIGN KEY (LocationId) REFERENCES [configuracion].[Location](Id);
```

---

## Orden de Implementación (Prioridad)

| # | Fase | Descripción | Dependencias |
|---|------|-------------|-------------|
| 1 | **Fase 1** | Backend: Location entity + CRUD + SQL | Ninguna |
| 2 | **Fase 2** | Frontend: UI gestión sucursales | Fase 1 |
| 3 | **Fase 3** | Integrar con Citas | Fase 1 + 2 |
| 4 | **Fase 4** | Integrar con Horarios | Fase 1 + 2 |
| 5 | **Fase 5** | Integrar con Inventario | Fase 1 + 2 |

Las fases 3, 4 y 5 son **independientes entre sí** y pueden implementarse en cualquier orden después de completar Fases 1+2.

---

## Checklist de Archivos (Estimado)

### Backend (~35 archivos)

**Nuevos:**
- `Domain/Entities/Location.cs`
- `Infrastructure/Data/Entities/Location.cs`
- `Infrastructure/Data/Entities/UserLocation.cs`
- `Infrastructure/Mappings/LocationMappingProfile.cs`
- `Application/Locations/Commands/Create*.cs` (3 archivos)
- `Application/Locations/Commands/Update*.cs` (3 archivos)
- `Application/Locations/Commands/Delete*.cs` (2 archivos)
- `Application/Locations/Commands/AssignUsers*.cs` (2 archivos)
- `Application/Locations/Commands/RemoveUser*.cs` (2 archivos)
- `Application/Locations/Queries/GetAll*.cs` (2 archivos)
- `Application/Locations/Queries/Get*.cs` (2 archivos)
- `Application/Common/DTOs/LocationDto.cs`
- `Application/Common/DTOs/LocationSummaryDto.cs`
- `Application/Common/Interfaces/ILocationService.cs`
- `Infrastructure/Services/LocationService.cs`
- `Api/Controllers/LocationsController.cs`
- SQL script de migración

**Modificados:**
- `Domain/Entities/Appointment.cs` — agregar LocationId
- `Domain/Entities/WorkSchedule.cs` — agregar LocationId
- `Domain/Entities/ScheduleException.cs` — agregar LocationId
- `Domain/Entities/Stock.cs` — agregar LocationId + cambiar inicialización
- `Domain/Entities/PurchaseOrder.cs` — agregar LocationId
- `Domain/Constants/Permissions.cs` — nuevos permisos locations.*
- `Infrastructure/Data/Context/SmartDentalCloudDbContext.cs` — DbSets + mappings + query filters
- `Infrastructure/Data/Entities/Appointment.cs` — LocationId + navigation
- `Infrastructure/Data/Entities/Stock.cs` — LocationId
- `Infrastructure/Data/Entities/StockMovement.cs` — LocationId
- `Infrastructure/Data/Entities/PurchaseOrder.cs` — LocationId
- `Application/Appointments/Commands/ScheduleAppointmentCommand.cs`
- `Application/Appointments/Commands/ScheduleAppointmentCommandHandler.cs`
- `Application/Common/DTOs/AppointmentDto.cs`
- `Application/Common/Interfaces/ITenantService.cs`
- `Infrastructure/Services/TenantService.cs`
- Handlers de inventario que manejan Stock/StockMovement

### Frontend (~20 archivos)

**Nuevos:**
- `features/settings/models/location.models.ts`
- `features/settings/services/locations.service.ts`
- `features/settings/components/location-list/*` (3 archivos)
- `features/settings/components/location-form/*` (3 archivos)
- `shared/components/location-selector/*` (3 archivos)

**Modificados:**
- `features/appointments/models/appointment.models.ts`
- `features/appointments/components/appointment-form/*`
- `features/appointments/components/appointment-calendar/*`
- `features/appointments/components/appointment-detail/*`
- `features/appointments/components/appointment-list/*`
- `features/settings/components/work-schedule-editor/*`
- `features/settings/components/dentist-schedule-manager/*`
- `features/settings/components/schedule-exceptions-manager/*`
- `features/settings/components/settings-page/*`
- `features/inventory/` — múltiples componentes
- `features/settings/models/work-schedule.models.ts`
- `features/settings/models/schedule-exception.models.ts`

---

## Regla de Oro — Implementación Técnica

### Backend

El servicio `ILocationService.HasMultipleLocationsAsync()` es la fuente de verdad. Los DTOs incluyen `LocationId?` y `LocationName?` siempre, pero el frontend decide qué mostrar.

### Frontend

El componente `LocationSelectorComponent` encapsula la lógica:

```typescript
@Component({
  selector: 'app-location-selector',
  template: `
    @if (locationsService.hasMultipleLocations()) {
      <div class="form-group">
        <label class="form-label">{{ label }}</label>
        <select class="form-control" ...>
          @for (loc of locations(); track loc.id) {
            <option [value]="loc.id">{{ loc.name }}</option>
          }
        </select>
      </div>
    }
  `
})
```

En listas/tablas, la columna "Sucursal" solo se renderiza si `hasMultipleLocations()`:

```html
@if (locationsService.hasMultipleLocations()) {
  <th>Sucursal</th>
}
```

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Stock PK change rompe datos existentes | Media | Alto | Script de migración detallado con backup previo. Ejecutar en ventana de mantenimiento |
| Trigger `trg_UpdateStockOnMovement` falla con LocationId | Media | Alto | Actualizar trigger ANTES de cambiar PK |
| Performance con JOINs adicionales | Baja | Bajo | Índices en todas las FK de LocationId |
| UX confusa para 1-ubicación | Media | Alto | Regla de oro: ocultar todo si solo hay 1 ubicación |
| Overlap check incorrecto en citas | Media | Alto | Test exhaustivo: mismo doctor, misma hora, diferente ubicación = OK |
