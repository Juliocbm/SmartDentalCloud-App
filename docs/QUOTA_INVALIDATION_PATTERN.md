# Plan Enforcement & Quota System — Frontend Architecture

Documentacion completa de como el frontend gestiona las limitaciones de plan, acceso a features, quotas de recursos y la invalidacion automatica de cache.

---

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Servicios Core](#servicios-core)
3. [Guards de Ruta](#guards-de-ruta)
4. [Interceptores HTTP](#interceptores-http)
5. [Bloqueo de Modulos en el Menu (Sidebar)](#bloqueo-de-modulos-en-el-menu-sidebar)
6. [Bloqueo de KPI Cards en Dashboard](#bloqueo-de-kpi-cards-en-dashboard)
7. [Bloqueo de Funciones Inline en Paginas](#bloqueo-de-funciones-inline-en-paginas)
8. [Quota: Indicador de Uso en Listados](#quota-indicador-de-uso-en-listados)
9. [Quota: Validacion Pre-Creacion en Botones](#quota-validacion-pre-creacion-en-botones)
10. [Quota: Modal de Limite Alcanzado](#quota-modal-de-limite-alcanzado)
11. [Quota: Banner de Advertencia](#quota-banner-de-advertencia)
12. [Quota: Invalidacion Automatica de Cache](#quota-invalidacion-automatica-de-cache)
13. [Paginas de Bloqueo (Full-Screen)](#paginas-de-bloqueo-full-screen)
14. [Flujo Completo: Diagrama de Decision](#flujo-completo-diagrama-de-decision)
15. [Constantes Compartidas](#constantes-compartidas)
16. [Como Agregar un Nuevo Recurso con Quota](#como-agregar-un-nuevo-recurso-con-quota)
17. [Referencia de Archivos](#referencia-de-archivos)

---

## Arquitectura General

El sistema de enforcement opera en **4 capas**, de mas temprana a mas tardia:

```
Capa 1: MENU (Sidebar)
  Bloquea navegacion a modulos premium antes de que el usuario intente acceder.
  Muestra icono de candado + modal "Funcion Premium".

Capa 2: GUARDS (Ruta)
  Bloquea el acceso a rutas protegidas si la feature no esta habilitada.
  Redirige a pagina de feature requerida.

Capa 3: UI (Componentes en pagina)
  Deshabilita botones, oculta opciones, muestra indicadores de quota.
  Modal preventivo al intentar crear cuando la quota esta al limite.

Capa 4: API (Interceptores HTTP)
  Ultima linea de defensa. Captura 403 (quota excedida) y 402 (suscripcion expirada).
  Muestra modal de error o redirige a pagina de bloqueo.
```

Toda la informacion de features y quotas se obtiene de un unico endpoint y se cachea en `EntitlementService`:

```
GET /subscriptions/entitlements
  Response: TenantEntitlementSummary {
    planName, enabledFeatures[], disabledFeatures{}, quotas{}, isTrial, daysRemaining
  }
```

---

## Servicios Core

### EntitlementService

**Archivo:** `src/app/core/services/entitlement.service.ts`

Servicio singleton que cachea el estado completo de features y quotas del tenant. Fuente unica de verdad para todo el sistema de enforcement.

**Modelos:**

```typescript
interface QuotaStatus {
  isAllowed: boolean;      // true si no ha excedido el limite
  currentUsage: number;    // uso actual
  limit: number | null;    // null = ilimitado
  isNearLimit: boolean;    // true si >= 80%
  usagePercent: number;    // 0-100
}

interface TenantEntitlementSummary {
  planName: string;
  enabledFeatures: string[];
  disabledFeatures: Record<string, string>;  // featureKey → minimumPlanName (del backend)
  quotas: Record<string, QuotaStatus>;
  isTrial: boolean;
  daysRemaining: number;
}
```

**Signals reactivos:**

| Signal | Tipo | Descripcion |
|--------|------|-------------|
| `entitlements` | `TenantEntitlementSummary \| null` | Datos completos cacheados |
| `loaded` | `boolean` | Gate para guards — true cuando ya se cargo |
| `planName` | `string` | Nombre del plan actual |
| `isTrial` | `boolean` | Si esta en periodo de prueba |
| `daysRemaining` | `number` | Dias restantes del trial |
| `enabledFeatures` | `string[]` | Features habilitadas |
| `nearLimitQuotas` | `Array` | Quotas con uso >= 80% |

**Metodos:**

| Metodo | Descripcion |
|--------|-------------|
| `loadEntitlements()` | Carga desde API. Llamado por `featuresLoaderGuard` |
| `hasFeature(feature)` | Verifica si la feature esta habilitada |
| `getQuota(quotaKey)` | Obtiene `QuotaStatus` por clave |
| `getQuotaLabel(key)` | Label legible: `'Quota:Users'` -> `'Usuarios'` |
| `getQuotaIcon(key)` | Icono FontAwesome: `'Quota:Users'` -> `'fa-user-doctor'` |
| `getMinimumPlanForFeature(key)` | Plan minimo para feature deshabilitada (dato del backend, no hardcodeado) |
| `reload()` | Fuerza recarga desde API (usado por interceptor de invalidacion) |
| `reset()` | Limpia cache y pone `loaded=false` (llamado por `AuthService.handleLogout()` para evitar datos stale entre sesiones) |

**Ciclo de vida entre sesiones:** `AuthService.handleLogout()` llama `reset()` en todos los servicios con cache independiente (`EntitlementService`, `UserProfileCacheService`, `FavoritesService`, `AlertsCountService`). Los servicios con `computed()` derivado de signals de auth (`PermissionService`, `FeatureService`) auto-cascadean sin reset explicito.

### FeatureService

**Archivo:** `src/app/core/services/feature.service.ts`

Wrapper sobre `EntitlementService` que agrega labels legibles y logica de plan minimo.

**Tipo PlanFeature (22 features):**

```typescript
type PlanFeature =
  // Core (Free Trial + Basico)
  | 'Patients' | 'Appointments' | 'ClinicalRecords' | 'Odontogram'
  | 'BasicInvoicing' | 'Prescriptions' | 'ConsultationNotes' | 'InformedConsents'
  // Advanced (Profesional+)
  | 'Periodontogram' | 'Cephalometry' | 'TreatmentPlans'
  | 'Inventory' | 'PurchaseOrders' | 'AdvancedReports' | 'CfdiTimbrado'
  | 'WhatsAppMessaging' | 'DataExport'
  // Enterprise (Empresarial)
  | 'MultiLocation' | 'CustomDomain' | 'ApiAccess' | 'AuditLog'
  | 'DigitalSignatures' | 'CustomBranding';
```

**Metodos:**

| Metodo | Descripcion |
|--------|-------------|
| `hasFeature(feature)` | Delega a `EntitlementService.hasFeature()` |
| `getFeatureLabel(feature)` | Label en espanol (ej: `'Inventario y Proveedores'`) |
| `getMinimumPlan(feature)` | Plan minimo requerido (delega a `EntitlementService.getMinimumPlanForFeature()` — dato del backend) |
| `planName()` | Signal con nombre del plan actual |

---

## Guards de Ruta

### featuresLoaderGuard

**Archivo:** `src/app/core/guards/features-loader.guard.ts`

Guard asincrono que carga los entitlements la primera vez que se accede a una ruta protegida. Siempre retorna `true` — su unico proposito es gatear la carga.

**Posicion en cadena:** Primero, antes de `permissionGuard` y `featureGuard`.

### featureGuard

**Archivo:** `src/app/core/guards/feature.guard.ts`

Guard parametrizado que bloquea rutas si la feature no esta habilitada.

**Uso en rutas:**

```typescript
// app.routes.ts
{
  path: 'treatments/plans',
  canActivate: [permissionGuard('TreatmentPlans:View'), featureGuard('TreatmentPlans')],
  loadChildren: () => import('./features/treatment-plans/treatment-plans.routes')
}
```

**Comportamiento cuando feature no disponible:**
1. Retorna `false` (bloquea la ruta)
2. Redirige a `/subscription/feature-required` con query params:
   - `feature`: clave de la feature
   - `featureLabel`: nombre legible
   - `minimumPlan`: plan minimo requerido
   - `currentPlan`: plan actual del tenant

**Cadena completa de guards en rutas protegidas:**

```
authGuard -> featuresLoaderGuard -> permissionGuard -> featureGuard
```

---

## Interceptores HTTP

### subscriptionInterceptor

**Archivo:** `src/app/core/interceptors/subscription.interceptor.ts`

Captura errores HTTP relacionados a suscripcion y quotas.

| Status | Condicion | Accion |
|--------|-----------|--------|
| 402 | Cualquiera (excepto `/subscriptions`) | Redirect a `/subscription/expired` |
| 403 | `errorCode === 'ERR-4034'` | Abre `QuotaExceededModalComponent` via `ModalService` |
| 403 | `error === 'limit_exceeded'` (legacy) | Abre `QuotaExceededModalComponent` con datos legacy |

**Protecciones:**
- **Anti-duplicados:** `if (!modalService.isOpen())` — evita modales apilados si multiples requests fallan simultaneamente
- **Fallback:** Si `ModalService` no tiene VCR registrado (rutas fuera del layout), cae a redirect hacia `/subscription/limit-exceeded`

### quotaInvalidationInterceptor

**Archivo:** `src/app/core/interceptors/quota-invalidation.interceptor.ts`

Invalida el cache de entitlements automaticamente cuando se detecta creacion o eliminacion de recursos.

| Condicion | Accion |
|-----------|--------|
| `POST` + respuesta `201 Created` | `entitlementService.reload()` |
| `DELETE` + respuesta `200 OK` o `204 No Content` | `entitlementService.reload()` |

**Beneficios:**
- Centralizado: 1 interceptor cubre todos los recursos (usuarios, pacientes, productos, etc.)
- Automatico: no requiere llamar `reload()` manualmente en cada formulario
- Cubre creacion Y eliminacion

**Registro en `app.config.ts`:**

```typescript
provideHttpClient(
  withInterceptors([
    authInterceptor,
    tenantInterceptor,
    errorInterceptor,
    subscriptionInterceptor,
    quotaInvalidationInterceptor  // ultimo en la cadena
  ])
)
```

---

## Bloqueo de Modulos en el Menu (Sidebar)

**Archivos:**
- `src/app/shared/components/sidebar/sidebar.ts`
- `src/app/shared/components/sidebar/sidebar.html`
- `src/app/shared/components/sidebar/sidebar.models.ts`

### Modelo MenuItem

```typescript
interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  requiredFeature?: string;  // <-- clave para bloqueo
  // ...
}
```

### Renderizado

Los items con `requiredFeature` se evaluan con `isFeatureLocked(item)`:

```typescript
isFeatureLocked(item: MenuItem): boolean {
  return !!item.requiredFeature &&
         !this.featureService.hasFeature(item.requiredFeature as PlanFeature);
}
```

**Item habilitado:** Renderiza como `<a>` con `routerLink`, navegacion normal.

**Item bloqueado:**
- Renderiza como `<button>` (no navegable)
- Clase CSS: `sidebar__menu-item--locked`
- Icono de candado (`fa-lock`) reemplaza el chevron
- Click abre `FeatureUpgradeModalComponent`

### Items actualmente bloqueados por feature

| Item de Menu | Feature Requerida | Plan Minimo |
|-------------|-------------------|-------------|
| Planes de Tratamiento | `TreatmentPlans` | Profesional |
| Inventario | `Inventory` | Profesional |
| Reportes Avanzados | `AdvancedReports` | Profesional |
| Auditoria | `AuditLog` | Empresarial |

### FeatureUpgradeModalComponent

**Archivos:** `src/app/shared/components/feature-upgrade-modal/`

Modal que se muestra al hacer click en un item bloqueado del sidebar.

```
+----------------------------------+
|  [lock icon]                  X  |
|       Funcion Premium            |
|                                  |
|    Planes de Tratamiento         |
|                                  |
|  Esta funcion requiere el plan   |
|  Profesional o superior.         |
|  Tu plan actual es Free Trial.   |
|                                  |
|  [info] Mejora tu plan para      |
|  desbloquear esta y mas          |
|  funcionalidades avanzadas.      |
|                                  |
|    [Cerrar]  [Mejorar Plan]      |
+----------------------------------+
```

---

## Bloqueo de KPI Cards en Dashboard

**Archivos:**
- `src/app/features/dashboard/dashboard.html`
- `src/app/features/dashboard/dashboard.ts`

### Comportamiento

Cards de KPI que requieren features premium se renderizan con estado bloqueado:

```html
@if (featureService.hasFeature('AdvancedReports')) {
  <!-- Card normal con datos -->
  <div class="kpi-card">...</div>
} @else {
  <!-- Card bloqueada -->
  <div class="kpi-card kpi-card--locked">
    <i class="fa-solid fa-lock"></i>
    <span>Plan Profesional</span>
    <a routerLink="/subscription">Desbloquear</a>
  </div>
}
```

**Estilo `.kpi-card--locked`:**
- Fondo gris/opaco
- Sin datos, solo icono de candado
- Link "Desbloquear" que lleva a la pagina de suscripcion

---

## Bloqueo de Funciones Inline en Paginas

### Botones condicionados por feature

**Ejemplo: Lista de Sucursales** (`src/app/features/settings/components/location-list/`)

```html
@if (featureService.hasFeature('MultiLocation')) {
  <button class="btn btn-success" (click)="createLocation()">
    Nueva Sucursal
  </button>
} @else {
  <div class="alert alert-info">
    La gestion de multiples sucursales esta disponible desde el plan
    {{ featureService.getMinimumPlan('MultiLocation') }}.
  </div>
}
```

### Opciones deshabilitadas en selects

**Ejemplo: Modal de Notificaciones** (`src/app/features/notification-center/components/send-notification-modal/`)

```typescript
hasWhatsApp = computed(() => this.featureService.hasFeature('WhatsAppMessaging'));
```

```html
<option [disabled]="!hasWhatsApp()" value="whatsapp">
  WhatsApp {{ !hasWhatsApp() ? '(Plan Profesional)' : '' }}
</option>
```

### FeatureLockedComponent (inline embebible)

**Archivo:** `src/app/shared/components/feature-locked/feature-locked.ts`

Componente reutilizable para mostrar mensaje de feature bloqueada dentro de cualquier pagina:

```html
<app-feature-locked feature="DataExport" />
```

Muestra nombre de la feature, plan actual, plan requerido, y link a suscripcion.

---

## Quota: Indicador de Uso en Listados

**Archivos:** `src/app/shared/components/quota-usage-indicator/`

### Componente: QuotaUsageIndicatorComponent

Indicador compacto inline que muestra el uso actual de una quota. Se coloca en el header de paginas de listado.

**Input:** `quotaKey: string` (requerido) — ej: `'Quota:Users'`, `'Quota:Patients'`

**Renderizado:**

```
Normal (< 80%):    [icon] Usuarios: 1 / 5  [====------]  (barra azul)
Warning (>= 80%):  [icon] Usuarios: 4 / 5  [========--]  (barra amber)
Critical (>= 95%): [icon] Usuarios: 5 / 5  [==========]  (barra roja)
Ilimitado:          (no se renderiza)
```

**Uso:**

```html
<!-- En user-list.html -->
<app-page-header title="Usuarios">
  <div actions>
    <app-quota-usage-indicator quotaKey="Quota:Users" />
    <button (click)="createUser()">Nuevo Usuario</button>
  </div>
</app-page-header>

<!-- En patient-list.html -->
<app-page-header title="Pacientes">
  <div actions>
    <app-quota-usage-indicator quotaKey="Quota:Patients" />
    <button (click)="createPatient()">Nuevo Paciente</button>
  </div>
</app-page-header>
```

**Reactividad:** Lee de `EntitlementService.getQuota()` via computed signals. Se actualiza automaticamente cuando el interceptor de invalidacion recarga los entitlements.

---

## Quota: Validacion Pre-Creacion en Botones

**Archivos:**
- `src/app/features/users/components/user-list/user-list.ts`
- `src/app/features/patients/components/patient-list/patient-list.ts`

### Comportamiento

Los botones "Nuevo Usuario" y "Nuevo Paciente" no usan `routerLink`. Usan `(click)` con un metodo que valida la quota antes de navegar:

```typescript
createUser(): void {
  const quota = this.entitlementService.getQuota('Quota:Users');
  if (quota && quota.limit !== null && quota.currentUsage >= quota.limit) {
    // Quota al limite -> mostrar modal
    this.modalService.open<QuotaExceededModalData>(QuotaExceededModalComponent, {
      data: {
        planName: this.entitlementService.planName(),
        resourceType: 'Quota:Users',
        currentUsage: quota.currentUsage,
        limit: quota.limit
      }
    });
    return;
  }
  // Quota disponible -> navegar al formulario
  this.router.navigate(['/users/new']);
}
```

**Flujo:**

```
Click "Nuevo Usuario"
  -> getQuota('Quota:Users')
  -> currentUsage >= limit?
     SI -> QuotaExceededModal (no navega)
     NO -> router.navigate('/users/new')
```

Esto evita que el usuario llene un formulario completo para recibir un error al guardar.

---

## Quota: Modal de Limite Alcanzado

**Archivos:** `src/app/shared/components/quota-exceeded-modal/`

### QuotaExceededModalComponent

Modal que se muestra cuando se intenta crear un recurso que excede la quota.

**Interface de datos:**

```typescript
interface QuotaExceededModalData {
  planName: string;        // 'Free Trial', 'Basico', etc.
  resourceType: string;    // 'Quota:Users', 'Quota:Patients', etc.
  currentUsage: number;
  limit: number;
}
```

**Visual:**

```
+------------------------------------------+
|  [warning icon]                       X  |
|     Limite de plan alcanzado             |
|                                          |
|  Tu plan Free Trial no permite agregar   |
|  mas recursos. Actualiza a un plan       |
|  superior para seguir creciendo.         |
|                                          |
|  [user icon] Usuarios        2 / 2      |
|  [==================================]    |  <- barra roja
|                                          |
|  [warning] Mejora tu plan para           |
|  aumentar tus limites y seguir           |
|  creciendo.                              |
|                                          |
|       [Cerrar]  [Actualizar Plan]        |
+------------------------------------------+
```

**Puntos de activacion:**
1. **Preventivo:** Click en boton "Nuevo" cuando quota esta al limite (desde list pages)
2. **Reactivo:** Interceptor `subscriptionInterceptor` al recibir HTTP 403 + ERR-4034

---

## Quota: Banner de Advertencia

**Archivos:** `src/app/shared/components/quota-warning-banner/`

### QuotaWarningBannerComponent

Banner proactivo que aparece cuando una quota esta cerca del limite (>= 80%).

**Input:** `quotaKey?: string` — si se omite, muestra todas las quotas near-limit.

**Renderizado:**

```
[!] Usuarios: 4 de 5 utilizados (80%)                    [Ampliar plan ->]
```

**Color coding:**
- 80-94%: fondo amber/naranja
- >= 95%: fondo rojo (critico)

**Datos:** Lee de `EntitlementService.nearLimitQuotas` (computed signal).

---

## Quota: Invalidacion Automatica de Cache

**Archivo:** `src/app/core/interceptors/quota-invalidation.interceptor.ts`

### Problema que resuelve

Cuando se crea o elimina un recurso, el cache de `EntitlementService` queda desactualizado. Sin invalidacion:
- El indicador de uso muestra el conteo viejo
- La validacion del boton "Crear" permite navegar aunque la quota este al limite
- El usuario tendria que recargar la pagina manualmente

### Solucion

Interceptor HTTP centralizado que observa TODAS las respuestas y recarga entitlements cuando detecta:

| Metodo HTTP | Status Code | Significado |
|-------------|-------------|-------------|
| `POST` | `201 Created` | Recurso creado (usuario, paciente, producto...) |
| `DELETE` | `200 OK` o `204 No Content` | Recurso eliminado |

```typescript
export const quotaInvalidationInterceptor: HttpInterceptorFn = (req, next) => {
  const entitlementService = inject(EntitlementService);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const isCreate = req.method === 'POST' && event.status === 201;
        const isDelete = req.method === 'DELETE'
                      && (event.status === 200 || event.status === 204);

        if (isCreate || isDelete) {
          entitlementService.reload();
        }
      }
    })
  );
};
```

### Ventajas del patron centralizado

- **Cero acoplamiento:** No se toca ningun formulario ni servicio de feature
- **Escalable:** Nuevos recursos con quota (productos, servicios, sucursales) quedan cubiertos automaticamente
- **Cubre DELETE:** Al eliminar un recurso, la quota se libera y el indicador se actualiza
- **Overhead minimo:** Un GET `/subscriptions/entitlements` extra por creacion/eliminacion

---

## Paginas de Bloqueo (Full-Screen)

### Feature Required Page

**Archivos:** `src/app/features/subscriptions/components/feature-required/`
**Ruta:** `/subscription/feature-required`
**Trigger:** `featureGuard` bloquea la ruta

Muestra: icono de candado, nombre de la feature, plan requerido vs actual, boton "Mejorar Plan".

### Subscription Limit Exceeded Page

**Archivos:** `src/app/features/subscriptions/components/subscription-limit-exceeded/`
**Ruta:** `/subscription/limit-exceeded`
**Trigger:** Fallback del `subscriptionInterceptor` cuando `ModalService` no esta disponible

Muestra: barra de uso, plan actual, boton "Actualizar Plan". Soporta formato nuevo (quota individual) y legacy.

### Subscription Expired Page

**Archivos:** `src/app/features/subscriptions/components/subscription-expired/`
**Ruta:** `/subscription/expired`
**Trigger:** `subscriptionInterceptor` al recibir HTTP 402

Muestra: estado de la suscripcion, dias restantes (si trial), boton de renovacion.

---

## Flujo Completo: Diagrama de Decision

```
Usuario intenta acceder a una funcionalidad
|
+--[Es un item del sidebar?]
|  |
|  +--[Tiene requiredFeature?]
|  |  |
|  |  +--[hasFeature() = true?]
|  |  |  SI -> Navega normalmente
|  |  |  NO -> Abre FeatureUpgradeModal
|  |  |
|  +--[No tiene requiredFeature]
|     -> Navega normalmente
|
+--[Es una ruta directa?]
|  |
|  +--[Tiene featureGuard?]
|  |  |
|  |  +--[hasFeature() = true?]
|  |  |  SI -> Permite acceso
|  |  |  NO -> Redirect a /subscription/feature-required
|  |  |
|  +--[No tiene featureGuard]
|     -> Permite acceso
|
+--[Es un boton "Crear" con quota?]
|  |
|  +--[getQuota() -> currentUsage >= limit?]
|     SI -> Abre QuotaExceededModal
|     NO -> Navega al formulario
|
+--[Es una llamada API?]
   |
   +--[Respuesta 201/204?]
   |  -> quotaInvalidationInterceptor -> reload()
   |
   +--[Respuesta 403 ERR-4034?]
   |  -> subscriptionInterceptor -> QuotaExceededModal
   |
   +--[Respuesta 402?]
      -> subscriptionInterceptor -> /subscription/expired
```

---

## Constantes Compartidas

**Archivo:** `src/app/core/constants/quota.constants.ts`

```typescript
export interface QuotaMetadata {
  label: string;
  icon: string;
}

export const QUOTA_METADATA: Record<string, QuotaMetadata> = {
  'Quota:Patients':  { label: 'Pacientes',           icon: 'fa-users' },
  'Quota:Users':     { label: 'Usuarios',            icon: 'fa-user-doctor' },
  'Quota:Locations': { label: 'Sucursales',           icon: 'fa-building' },
  'Quota:StorageMB': { label: 'Almacenamiento (MB)', icon: 'fa-hard-drive' }
};
```

Usado por: `EntitlementService`, `QuotaExceededModalComponent`, `SubscriptionLimitExceededComponent`.

---

## Como Agregar un Nuevo Recurso con Quota

Cuando se agregue un nuevo recurso limitado por plan (ej: Productos, Servicios):

### Backend

1. Agregar `IQuotaEnforcedCommand` al comando de creacion (ej: `CreateProductCommand`)
2. Agregar fila en `configuracion.PlanEntitlement` con el `FeatureKey` correspondiente (ej: `'Quota:Products'`)
3. El `QuotaEnforcementBehavior` del pipeline MediatR lo validara automaticamente

### Frontend

1. **Agregar metadata** en `src/app/core/constants/quota.constants.ts`:
   ```typescript
   'Quota:Products': { label: 'Productos', icon: 'fa-box' }
   ```

2. **Agregar indicador** en el HTML del listado:
   ```html
   <app-quota-usage-indicator quotaKey="Quota:Products" />
   ```

3. **Agregar validacion al boton "Crear"** en el componente del listado:
   ```typescript
   createProduct(): void {
     const quota = this.entitlementService.getQuota('Quota:Products');
     if (quota && quota.limit !== null && quota.currentUsage >= quota.limit) {
       this.modalService.open<QuotaExceededModalData>(QuotaExceededModalComponent, {
         data: {
           planName: this.entitlementService.planName(),
           resourceType: 'Quota:Products',
           currentUsage: quota.currentUsage,
           limit: quota.limit
         }
       });
       return;
     }
     this.router.navigate(['/products/new']);
   }
   ```

4. **No se necesita tocar:**
   - El interceptor de invalidacion (ya cubre POST 201 / DELETE 204 de cualquier recurso)
   - El `QuotaExceededModalComponent` (ya es generico)
   - El `subscriptionInterceptor` (ya captura ERR-4034 de cualquier quota)
   - `EntitlementService` (ya expone `getQuota()` para cualquier clave)

---

## Referencia de Archivos

### Servicios Core

| Archivo | Proposito |
|---------|-----------|
| `src/app/core/services/entitlement.service.ts` | Cache de features y quotas, fuente unica de verdad |
| `src/app/core/services/feature.service.ts` | Wrapper con labels y plan minimo |
| `src/app/core/constants/quota.constants.ts` | Metadata compartida de quotas (labels + iconos) |

### Guards

| Archivo | Proposito |
|---------|-----------|
| `src/app/core/guards/features-loader.guard.ts` | Carga entitlements al primer acceso protegido |
| `src/app/core/guards/feature.guard.ts` | Bloquea rutas por feature no habilitada |

### Interceptores

| Archivo | Proposito |
|---------|-----------|
| `src/app/core/interceptors/subscription.interceptor.ts` | Maneja 402 (expirada) y 403 (quota excedida) |
| `src/app/core/interceptors/quota-invalidation.interceptor.ts` | Recarga entitlements en POST 201 / DELETE 204 |

### Componentes Shared

| Archivo | Proposito |
|---------|-----------|
| `src/app/shared/components/feature-upgrade-modal/` | Modal "Funcion Premium" para features bloqueadas |
| `src/app/shared/components/quota-exceeded-modal/` | Modal "Limite alcanzado" para quotas excedidas |
| `src/app/shared/components/quota-usage-indicator/` | Indicador inline de uso de quota |
| `src/app/shared/components/quota-warning-banner/` | Banner de advertencia para quotas near-limit |
| `src/app/shared/components/feature-locked/` | Componente inline de feature bloqueada |
| `src/app/shared/components/sidebar/` | Menu lateral con bloqueo de items premium |

### Paginas de Bloqueo

| Archivo | Ruta | Trigger |
|---------|------|---------|
| `src/app/features/subscriptions/components/feature-required/` | `/subscription/feature-required` | `featureGuard` |
| `src/app/features/subscriptions/components/subscription-limit-exceeded/` | `/subscription/limit-exceeded` | Fallback del interceptor |
| `src/app/features/subscriptions/components/subscription-expired/` | `/subscription/expired` | HTTP 402 |

### Configuracion

| Archivo | Proposito |
|---------|-----------|
| `src/app/app.config.ts` | Registro de interceptores en cadena |
| `src/app/app.routes.ts` | Definicion de rutas con `featureGuard` |
