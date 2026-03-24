# Patrón de Servicio de Contexto para Formularios

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Cuándo Usar Este Patrón](#cuándo-usar-este-patrón)
3. [Arquitectura del Patrón](#arquitectura-del-patrón)
4. [Guía de Implementación](#guía-de-implementación)
5. [Ejemplos Implementados](#ejemplos-implementados)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Descripción General

El **Patrón de Servicio de Contexto** es una solución arquitectónica para gestionar el comportamiento dinámico de formularios según su contexto de navegación. Permite que un formulario se adapte automáticamente dependiendo desde dónde fue llamado, sin necesidad de parámetros en la URL.

### Problema que Resuelve

**❌ Antes (con queryParams):**
```typescript
// Código disperso en templates
<a [routerLink]="['/users/new']" 
   [queryParams]="{context: 'Dentista', requiredRole: 'Dentista', returnUrl: '/dentists'}">
</a>

// Parsing manual en el formulario
const context = this.route.snapshot.queryParams['context']; // string sin validar
const role = this.route.snapshot.queryParams['requiredRole']; // any
```

**Problemas:**
- ❌ No type-safe
- ❌ Magic strings dispersos en templates
- ❌ Parámetros visibles y manipulables en URL
- ❌ Difícil de mantener y testear

**✅ Ahora (con Context Service):**
```typescript
// Servicio centralizado type-safe
navigateToNewDentist(): void {
  this.contextService.setContext(DENTIST_CONTEXT);
  this.router.navigate(['/users/new']);
}

// Consumo reactivo en formulario
backRoute = computed(() => this.contextService.context().returnUrl);
```

**Beneficios:**
- ✅ Type-safe con TypeScript
- ✅ Constantes reutilizables
- ✅ Estado interno protegido
- ✅ Fácil de mantener y testear
- ✅ Reactivo con signals

---

## Cuándo Usar Este Patrón

### ✅ Casos de Uso Ideales

1. **Formularios con Comportamiento Contextual**
   - Títulos dinámicos según origen
   - Campos preseleccionados y bloqueados
   - Navegación de retorno dinámica

2. **Navegación entre Vistas Relacionadas**
   - Crear cita desde vista de dentistas
   - Crear usuario desde vista de roles
   - Editar desde diferentes módulos

3. **Flujos de Trabajo Multi-Paso**
   - Wizards con estado temporal
   - Formularios que dependen de selecciones previas

### ❌ Cuándo NO Usar

- Parámetros que deben ser bookmarkeables (usar URL params)
- Datos que necesitan persistir en refresh (usar localStorage/sessionStorage)
- Configuración global de la app (usar configuration service)

### Matriz de Decisión: QueryParams vs Context Service

| Criterio | QueryParams | Context Service |
|----------|------------|-----------------|
| **Type-safe** | ❌ Strings sin validar | ✅ Interfaces TypeScript |
| **Bloqueo de campos** | ❌ No soportado | ✅ `lockField: true` |
| **URL limpia** | ❌ Parámetros visibles | ✅ Sin parámetros en URL |
| **Bookmarkeable** | ✅ Se preserva en URL | ❌ Se pierde en refresh |
| **Complejidad** | Baja (0 archivos nuevos) | Media (modelo + servicio) |
| **Datos ricos** | ❌ Solo strings/números | ✅ Objetos, arrays, dates |

**Regla general:** Si necesitas **bloquear campos** o pasar **más de 2 parámetros** con comportamiento contextual, usa Context Service. Si solo necesitas pasar un ID simple y bookmarkeable, usa QueryParams.

> **Nota:** Para el comportamiento del back-button (`backRoute` vs `defaultBackRoute`), ver `NAVIGATION_BACK_PATTERN.md`.

---

## Arquitectura del Patrón

### Componentes del Patrón

```
┌─────────────────────────────────────────────────────┐
│                   ARQUITECTURA                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. MODELO (Interface + Defaults)                   │
│     └─ Define estructura type-safe                  │
│                                                      │
│  2. SERVICIO (Injectable con Signals)               │
│     └─ Gestiona estado reactivo                     │
│                                                      │
│  3. COMPONENTE CONSUMIDOR (Formulario)              │
│     └─ Lee contexto y se adapta                     │
│                                                      │
│  4. COMPONENTE LLAMADOR (Vista origen)              │
│     └─ Establece contexto antes de navegar          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
Vista Origen                Context Service           Formulario
    │                             │                       │
    ├─ setContext(CUSTOM_CTX) ────►                       │
    │                             │                       │
    ├─ navigate(['/form/new']) ──────────────────────────►│
    │                             │                       │
    │                             │◄──── getCurrentContext()
    │                             │                       │
    │                             │         Aplica preselecciones
    │                             │         Configura bloqueos
    │                             │         Define returnUrl
    │                             │                       │
    │◄──────────────────────────────── navigate([returnUrl])
    │                             │                       │
    │                             │◄──────── resetContext()
    │                             │                       │
```

---

## Guía de Implementación

### Paso 1: Crear el Modelo de Contexto

**Ubicación:** `features/[feature]/models/[feature]-form-context.model.ts`

```typescript
import { ROUTES } from '../../../core/constants/routes.constants';

/**
 * Contexto para el formulario de [Feature]
 */
export interface FeatureFormContext {
  /**
   * Campo preseleccionado 1
   */
  preselectedField1: string | null;

  /**
   * Campo preseleccionado 2
   */
  preselectedField2: string | null;

  /**
   * URL de retorno al cancelar o después de guardar
   */
  returnUrl: string;

  /**
   * Si el campo está bloqueado y no puede cambiarse
   */
  lockField: boolean;
}

/**
 * Contexto por defecto (formulario genérico)
 */
export const DEFAULT_FEATURE_CONTEXT: FeatureFormContext = {
  preselectedField1: null,
  preselectedField2: null,
  returnUrl: ROUTES.FEATURES,  // ✅ Usa constantes centralizadas
  lockField: false
};

/**
 * Contexto personalizado para caso de uso específico
 */
export const CUSTOM_FEATURE_CONTEXT = (
  field1: string,
  field2: string
): Partial<FeatureFormContext> => ({
  preselectedField1: field1,
  preselectedField2: field2,
  returnUrl: ROUTES.CUSTOM_VIEW,  // ✅ Usa constantes centralizadas
  lockField: true
});
```

**Principios:**
- ✅ Usar JSDoc para documentar cada propiedad
- ✅ Tipos nullables para campos opcionales
- ✅ Funciones factory para contextos dinámicos
- ✅ `Partial<>` en contextos personalizados para merge
- ✅ Usar `ROUTES` constantes en lugar de magic strings

---

### Paso 2: Crear el Servicio de Contexto

**Ubicación:** `features/[feature]/services/[feature]-form-context.service.ts`

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { FeatureFormContext, DEFAULT_FEATURE_CONTEXT } from '../models/feature-form-context.model';

/**
 * Servicio para gestionar el contexto del formulario de [Feature]
 * 
 * @example
 * // Desde vista origen
 * this.contextService.setContext({
 *   preselectedField1: 'value',
 *   returnUrl: '/origin',
 *   lockField: true
 * });
 * this.router.navigate(['/features/new']);
 */
@Injectable({
  providedIn: 'root'
})
export class FeatureFormContextService {
  private contextState = signal<FeatureFormContext>(DEFAULT_FEATURE_CONTEXT);

  /**
   * Contexto actual del formulario (reactivo)
   */
  context = computed(() => this.contextState());

  /**
   * Establece un nuevo contexto para el formulario
   * Hace merge con el contexto por defecto
   */
  setContext(context: Partial<FeatureFormContext>): void {
    this.contextState.set({
      ...DEFAULT_FEATURE_CONTEXT,
      ...context
    });
  }

  /**
   * Restaura el contexto a los valores por defecto
   * Llamar después de guardar/cancelar
   */
  resetContext(): void {
    this.contextState.set(DEFAULT_FEATURE_CONTEXT);
  }

  /**
   * Obtiene el contexto actual (snapshot)
   * Útil para operaciones no reactivas
   */
  getCurrentContext(): FeatureFormContext {
    return this.contextState();
  }
}
```

**Principios:**
- ✅ `providedIn: 'root'` para singleton
- ✅ Signal privado, computed público
- ✅ Merge automático con defaults
- ✅ Método de cleanup explícito

---

### Paso 3: Integrar en el Formulario

**Ubicación:** `features/[feature]/components/[feature]-form/[feature]-form.ts`

```typescript
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FeatureFormContextService } from '../../services/feature-form-context.service';

export class FeatureFormComponent implements OnInit {
  private router = inject(Router);
  private contextService = inject(FeatureFormContextService);

  // Signals para campos preseleccionados
  selectedField1 = signal<any | null>(null);
  isField1Locked = signal(false);

  // Computed para backRoute dinámico
  backRoute = computed(() => this.contextService.context().returnUrl);

  ngOnInit(): void {
    this.initForm();      // 1️⃣ Primero inicializar formulario
    this.loadContext();   // 2️⃣ Luego cargar contexto (patchValue)
    this.checkEditMode(); // 3️⃣ Finalmente verificar modo edición
  }

  private loadContext(): void {
    const context = this.contextService.getCurrentContext();
    
    // Aplicar preselecciones
    if (context.preselectedField1) {
      this.selectedField1.set(context.preselectedField1);
      this.isField1Locked.set(context.lockField);
      // Aplicar al formulario con patchValue
      this.form.patchValue({
        field1: context.preselectedField1
      });
    }
  }

  private initForm(): void {
    const context = this.contextService.getCurrentContext();
    
    // Inicializar formulario con valores del contexto
    this.form = this.fb.group({
      field1: [context.preselectedField1 || '', Validators.required]
    });
  }

  onSubmit(): void {
    // Guardar datos...
    
    // Navegar de regreso
    const returnUrl = this.contextService.getCurrentContext().returnUrl;
    this.contextService.resetContext();
    this.router.navigate([returnUrl]);
  }

  onCancel(): void {
    const returnUrl = this.contextService.getCurrentContext().returnUrl;
    this.contextService.resetContext();
    this.router.navigate([returnUrl]);
  }
}
```

**HTML:**
```html
<app-page-header
  [title]="'Título Dinámico'"
  [backRoute]="backRoute()"
>
</app-page-header>

<form [formGroup]="form">
  <input 
    formControlName="field1" 
    [disabled]="isField1Locked()"
  />
  
  @if (isField1Locked()) {
    <span class="field-hint locked">
      <i class="fa-solid fa-lock"></i>
      Campo preseleccionado y bloqueado
    </span>
  }
</form>
```

**Principios:**
- ✅ Cargar contexto en `ngOnInit`
- ✅ Usar computed para propiedades reactivas
- ✅ Siempre resetear contexto al salir
- ✅ Indicadores visuales para campos bloqueados

---

### Paso 4: Llamar desde Vista Origen

**Ubicación:** `features/[origin]/components/[origin]-list/[origin]-list.ts`

```typescript
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FeatureFormContextService } from '../../../feature/services/feature-form-context.service';
import { CUSTOM_FEATURE_CONTEXT } from '../../../feature/models/feature-form-context.model';

export class OriginListComponent {
  private router = inject(Router);
  private featureContextService = inject(FeatureFormContextService);

  navigateToFeatureForm(item: any): void {
    // Establecer contexto
    this.featureContextService.setContext(
      CUSTOM_FEATURE_CONTEXT(item.id, item.name)
    );
    
    // Navegar
    this.router.navigate(['/features/new']);
  }
}
```

**HTML:**
```html
<button (click)="navigateToFeatureForm(item)">
  Crear Feature
</button>
```

**Principios:**
- ✅ Inyectar servicio de contexto
- ✅ Usar constantes predefinidas
- ✅ Setear contexto ANTES de navegar
- ✅ Métodos descriptivos

---

## Ejemplos Implementados

### Ejemplo 1: UserFormContext

**Caso de Uso:** Crear usuario con rol específico desde vistas especializadas (Dentistas, Recepcionistas, etc.)

**Archivos:**
- `features/users/models/user-form-context.model.ts`
- `features/users/services/user-form-context.service.ts`
- `features/users/components/user-form/user-form.ts`

**Contextos Disponibles:**
```typescript
// Vista genérica de usuarios
DEFAULT_USER_CONTEXT: {
  contextRole: 'Usuario',
  requiredRoleId: null,
  returnUrl: '/users'
}

// Vista de dentistas
DENTIST_CONTEXT: {
  contextRole: 'Dentista',
  requiredRoleId: 'Dentista',
  returnUrl: '/dentists'
}

// Vista de recepcionistas
RECEPTIONIST_CONTEXT: {
  contextRole: 'Recepcionista',
  requiredRoleId: 'Recepcionista',
  returnUrl: '/reception'
}
```

**Flujo:**
```
Vista Dentistas → Botón "Nuevo Dentista" 
  → setContext(DENTIST_CONTEXT) 
  → navigate(['/users/new'])
  → Formulario con:
      - Título: "Nuevo Dentista"
      - Rol "Dentista" preseleccionado y bloqueado
      - Botón ← regresa a /dentists
```

---

### Ejemplo 2: AppointmentFormContext

**Caso de Uso:** Crear cita desde diferentes vistas con preselecciones específicas

**Archivos:**
- `features/appointments/models/appointment-form-context.model.ts`
- `features/appointments/services/appointment-form-context.service.ts`
- `features/appointments/components/appointment-form/appointment-form.ts`

**Contextos Disponibles:**
```typescript
// Vista genérica de citas
DEFAULT_APPOINTMENT_CONTEXT: {
  preselectedDentistId: null,
  preselectedPatientId: null,
  returnUrl: '/appointments',
  lockDentist: false
}

// Desde vista de dentistas
DENTIST_APPOINTMENT_CONTEXT(dentistId, dentistName): {
  preselectedDentistId: dentistId,
  preselectedDentistName: dentistName,
  returnUrl: '/dentists',
  lockDentist: true
}

// Desde vista de paciente
PATIENT_APPOINTMENT_CONTEXT(patientId, patientName): {
  preselectedPatientId: patientId,
  preselectedPatientName: patientName,
  returnUrl: getDynamicRoute.patientDetail(patientId),
  lockPatient: true
}

// Desde calendario
CALENDAR_APPOINTMENT_CONTEXT(startAt, endAt, dentistId?, dentistName?, dentistSpecialization?): {
  preselectedStartAt: startAt,
  preselectedEndAt: endAt,
  preselectedDentistId: dentistId || null,
  preselectedDentistName: dentistName || null,
  preselectedDentistSpecialization: dentistSpecialization || null,
  returnUrl: ROUTES.APPOINTMENTS_CALENDAR,
  lockDentist: !!dentistId
}
```

**Flujo desde Dentistas:**
```
Vista Dentistas → Click "Nueva Cita" en card del Dr. Pérez (Ortodoncista)
  → setContext(DENTIST_APPOINTMENT_CONTEXT('123', 'Dr. Pérez', 'Ortodoncista'))
  → navigate(['/appointments/new'])
  → Formulario con:
      - Dentista: Dr. Pérez - Ortodoncista (bloqueado)
      - Paciente: seleccionable
      - Fecha/Hora: actual
      - Botón ← regresa a ROUTES.DENTISTS
```

---

## Best Practices

### 1. Naming Conventions

```typescript
// ✅ Bueno
UserFormContext
UserFormContextService
DENTIST_CONTEXT

// ❌ Malo
UserContext (muy genérico)
ContextService (no específico)
dentistCtx (inconsistente)
```

### 2. No Listar Servicios `providedIn: 'root'` en Route Providers

```typescript
// ✅ Bueno — El servicio es singleton, Angular lo resuelve automáticamente
@Injectable({ providedIn: 'root' })
export class FeatureFormContextService { ... }

// En la ruta, NO incluirlo en providers
export const ROUTES: Routes = [{
  path: '', providers: [OtherScopedService], children: [...]
}];

// ❌ Malo — Crea instancia duplicada que hace shadow al singleton
export const ROUTES: Routes = [{
  path: '', providers: [FeatureFormContextService], children: [...]
}];
```

### 3. Usar Constantes Centralizadas para Rutas

```typescript
// ✅ Bueno - Usa constantes de core/constants/routes.constants.ts
import { ROUTES } from '../../../core/constants/routes.constants';

export const DENTIST_CONTEXT: Partial<UserFormContext> = {
  contextRole: 'Dentista',
  returnUrl: ROUTES.DENTISTS  // ✅ Refactorable, type-safe
};

// ❌ Malo - Magic strings
export const DENTIST_CONTEXT: Partial<UserFormContext> = {
  contextRole: 'Dentista',
  returnUrl: '/dentists'  // ❌ Propenso a typos, difícil de refactorizar
};
```

### 2. Type Safety

```typescript
// ✅ Bueno
interface Context {
  field: string | null;  // Explícito
}

// ❌ Malo
interface Context {
  field: any;  // Pierde type safety
}
```

### 4. Defaults y Merge

```typescript
// ✅ Bueno
setContext(context: Partial<Context>): void {
  this.state.set({
    ...DEFAULT_CONTEXT,
    ...context  // Merge automático
  });
}

// ❌ Malo
setContext(context: Context): void {
  this.state.set(context);  // Requiere contexto completo
}
```

### 4. Cleanup

```typescript
// ✅ Bueno
onSubmit(): void {
  this.save().subscribe(() => {
    const returnUrl = this.contextService.getCurrentContext().returnUrl;
    this.contextService.resetContext();  // Cleanup explícito
    this.router.navigate([returnUrl]);
  });
}

// ❌ Malo
onSubmit(): void {
  this.save().subscribe(() => {
    this.router.navigate(['/default']);  // Olvida resetear
  });
}
```

### 6. Validaciones

```typescript
// ✅ Bueno
navigateToForm(item: Item): void {
  if (!item.isActive) {
    alert('No se puede crear para items inactivos');
    return;
  }
  this.contextService.setContext(CUSTOM_CONTEXT(item.id));
  this.router.navigate(['/form']);
}

// ❌ Malo
navigateToForm(item: Item): void {
  this.contextService.setContext(CUSTOM_CONTEXT(item.id));
  this.router.navigate(['/form']);  // No valida
}
```

### 7. Indicadores Visuales

```typescript
// ✅ Bueno - Indicar campos bloqueados
@if (isFieldLocked()) {
  <span class="field-hint locked">
    <i class="fa-solid fa-lock"></i>
    Campo preseleccionado y bloqueado
  </span>
}

// ❌ Malo - Solo deshabilitar sin explicar
<input [disabled]="isFieldLocked()">
```

---

## Troubleshooting

### ⚠️ CRÍTICO: Instancias Duplicadas por Route Providers

**Síntomas:** `setContext()` se llama con datos correctos, pero `getCurrentContext()` en el formulario destino devuelve el contexto por defecto (nulls). No hay `resetContext()` intermedio.

**Causa raíz:** El servicio de contexto (`providedIn: 'root'`) está **también** listado en los `providers` de una ruta lazy-loaded. Esto crea una **segunda instancia** del servicio dentro del injector de esa ruta, que hace shadow sobre el singleton root.

```typescript
// ❌ INCORRECTO — Crea instancia duplicada que shadowed al singleton root
export const FEATURE_ROUTES: Routes = [
  {
    path: '',
    providers: [
      FeatureService,
      ContextService  // ❌ Ya es providedIn: 'root', NO listar aquí
    ],
    children: [...]
  }
];

// ✅ CORRECTO — Solo listar servicios que NO son providedIn: 'root'
export const FEATURE_ROUTES: Routes = [
  {
    path: '',
    providers: [
      FeatureService  // ✅ Solo servicios scoped a la ruta
      // ContextService es providedIn: 'root', no necesita estar aquí
    ],
    children: [...]
  }
];
```

**Regla:** Los servicios con `providedIn: 'root'` **NUNCA** deben aparecer en `providers` de rutas. Si necesitan estar disponibles en una ruta lazy-loaded, Angular ya los resuelve desde el injector root automáticamente.

**Diagnóstico rápido:**
1. Buscar el servicio en archivos `*.routes.ts`: si aparece en `providers`, ese es el problema
2. Verificar que el servicio tenga `providedIn: 'root'` en su `@Injectable`
3. Si ambos son verdad → eliminar del array `providers`

---

### Problema: El contexto no se aplica

**Síntomas:** El formulario no muestra las preselecciones

**Causas comunes:**
1. No se llamó `setContext()` antes de navegar
2. El servicio está listado en route-level `providers` (ver sección anterior)
3. El contexto se resetea antes de leerlo

**Solución:**
```typescript
// ✅ Orden correcto
this.contextService.setContext(CUSTOM_CONTEXT);  // 1. Setear
this.router.navigate(['/form']);                 // 2. Navegar

// ❌ Orden incorrecto
this.router.navigate(['/form']);                 // ❌ Navega primero
this.contextService.setContext(CUSTOM_CONTEXT);  // ❌ Demasiado tarde
```

---

### Problema: El backRoute no funciona

**Síntomas:** Al hacer clic en ← regresa a ruta incorrecta

**Causa:** El `backRoute` está hardcodeado en el template

**Solución:**
```typescript
// En el componente
backRoute = computed(() => this.contextService.context().returnUrl);

// En el template
[backRoute]="backRoute()"  // ✅ Dinámico
[backRoute]="'/static'"    // ❌ Hardcoded
```

> Para guía completa sobre `backRoute` vs `defaultBackRoute`, ver `NAVIGATION_BACK_PATTERN.md`.

---

### Problema: Contexto persiste entre navegaciones

**Síntomas:** El formulario mantiene valores de una navegación anterior

**Causa:** No se llama `resetContext()` al salir

**Solución:**
```typescript
// ✅ Siempre resetear en onSubmit y onCancel
onSubmit(): void {
  this.save().subscribe(() => {
    this.contextService.resetContext();  // Importante
    this.router.navigate([returnUrl]);
  });
}

onCancel(): void {
  this.contextService.resetContext();  // Importante
  this.router.navigate([returnUrl]);
}
```

---

### Problema: Campos no se bloquean

**Síntomas:** Usuario puede cambiar campos que deberían estar bloqueados

**Causa:** No se implementó la lógica de bloqueo en el handler

**Solución:**
```typescript
// ✅ Prevenir cambios en handler
onFieldChange(value: any): void {
  if (this.isFieldLocked()) {
    return;  // Bloquear cambio
  }
  this.updateField(value);
}

// En template
[disabled]="isFieldLocked()"  // Deshabilitar UI
```

---

## Migración desde QueryParams

Si ya tienes implementación con queryParams, migrar es sencillo:

### Antes (QueryParams)
```typescript
// En vista origen
<a [routerLink]="['/form']" 
   [queryParams]="{field: value, returnUrl: '/origin'}">
</a>

// En formulario
ngOnInit() {
  const field = this.route.snapshot.queryParams['field'];
  const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/default';
}
```

### Después (Context Service)
```typescript
// 1. Crear modelo y servicio (pasos 1-2)

// 2. En vista origen
navigateToForm(): void {
  this.contextService.setContext({ field: value, returnUrl: '/origin' });
  this.router.navigate(['/form']);
}

// 3. En formulario
ngOnInit() {
  const context = this.contextService.getCurrentContext();
  const field = context.field;
  const returnUrl = context.returnUrl;
}
```

**Beneficios de la migración:**
- ✅ Type-safe
- ✅ No más parsing de strings
- ✅ URLs más limpias
- ✅ Mejor testabilidad

---

## Resumen

El **Patrón de Servicio de Contexto** proporciona una solución profesional, type-safe y mantenible para gestionar formularios con comportamiento dinámico. 

**Tiempo de implementación:** ~20 minutos por formulario

**Archivos requeridos:** 3 (modelo, servicio, actualizar componente)

**Complejidad:** Baja - Patrón estandarizado y repetible

**Mantenibilidad:** Alta - Cambios centralizados

**Escalabilidad:** Excelente - Fácil agregar nuevos contextos

---

**Última actualización:** Febrero 2026  
**Versión:** 1.1 — Agregada sección crítica sobre instancias duplicadas por route providers  
**Autor:** SmartDental Development Team
