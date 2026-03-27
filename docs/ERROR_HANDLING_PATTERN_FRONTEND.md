# ERROR_HANDLING_PATTERN — Frontend Angular

Patron estandar para consumir y mostrar errores de la API en componentes Angular.

> **Backend:** Ver `SmartDentalCloud-Api/docs/ERROR_HANDLING_PATTERN_BACKEND.md` para el formato `ApiErrorResponse` y catalogo de codigos.

---

## Archivos del patron

| Archivo | Proposito |
|---------|-----------|
| `core/models/api-error.models.ts` | Interfaces: `ApiErrorResponse`, `ParsedApiError`, `ValidationErrorDetail` |
| `core/utils/api-error.utils.ts` | `extractApiError()`, `getApiErrorMessage()` — parseo de errores HTTP |
| `core/utils/form-error.utils.ts` | `isFieldInvalid()`, `getFieldError()`, `markFormGroupTouched()`, `applyServerErrors()` — validacion de formularios |
| `core/interceptors/error.interceptor.ts` | Interceptor funcional: toast automatico solo para status 0 |
| `core/services/notification.service.ts` | `NotificationService` — toasts con signals |
| `shared/components/toast/` | Componente visual de toasts |
| `shared/components/form-alert/form-alert.ts` | `FormAlertComponent` — banner inline reutilizable para errores/warnings en formularios |

---

## Matriz de decision: Donde mostrar cada error

| Escenario | Donde se muestra | Metodo |
|---|---|---|
| Validacion de campo (cliente) | Inline bajo el campo (`<span class="error-message">`) | `isFieldInvalid()` + `getFieldError()` |
| Validacion de campo (servidor) | Mismo span inline, auto-poblado | `applyServerErrors()` pone `serverError` en el control |
| Error de API al enviar formulario | Banner inline arriba del form (`<app-form-alert>`) | `applyServerErrors()` retorna el mensaje general |
| Error de carga de datos (lista/detalle) | `<app-empty-state type="error">` con boton reintentar | `getApiErrorMessage()` |
| Exito (guardar, crear, eliminar) | Toast auto-dismiss 4s | `notifications.success()` |
| Error en accion sin formulario (eliminar, toggle) | Toast persistente | `notifications.error(getApiErrorMessage(err))` |
| Error de red (status 0) | Toast persistente global | `errorInterceptor` (automatico) |
| Error de auth (401) | Redirect silencioso | `authInterceptor` (automatico) |
| Confirmacion destructiva | Modal dialog | `notifications.confirm()` |

**Regla simple:** Si hay un formulario visible -> errores inline (banner + campo). Si no hay formulario -> toast. Fallo de carga -> empty state inline.

---

## Flujo de un error HTTP

```
HttpClient recibe error
  -> authInterceptor (401 -> refresh token / redirect)
  -> errorInterceptor
      -> Solo status 0: toast "sin conexion"
      -> Re-lanza el error siempre
  -> Componente .subscribe({ error: ... })
      -> applyServerErrors(err, form) (formularios)
      -> getApiErrorMessage(err) (carga de datos, acciones sin form)
      -> notifications.error() (acciones sin formulario visible)
```

---

## Estrategia del errorInterceptor

| Status | Interceptor | Componente |
|--------|-------------|------------|
| 0 | Toast error persistente (sin conexion) | — |
| 400 | **No toast** | Muestra inline con `applyServerErrors()` |
| 401 | **No toast** | `authInterceptor` maneja refresh/redirect |
| 403 | **No toast** | Componente muestra toast o inline segun contexto |
| 404 | **No toast** | Muestra inline |
| 409 | **No toast** | Componente muestra inline via `applyServerErrors()` |
| 500+ | **No toast** | Componente muestra inline o toast segun contexto |

**IMPORTANTE:** No agregar toasts al interceptor para 400/403/404/409/500+. Los componentes
ya manejan estos errores. Agregar toast en el interceptor causaria notificaciones duplicadas.

---

## Sistema de Toasts (NotificationService)

| Tipo | Duracion | Comportamiento |
|------|----------|----------------|
| `success` | 4s auto-dismiss | Desaparece solo |
| `info` | 4s auto-dismiss | Desaparece solo |
| `warning` | 5s auto-dismiss | Desaparece solo |
| `error` | **Persistente** (duration=0) | El usuario debe cerrar manualmente |

```typescript
this.notifications.success('Paciente creado exitosamente');
this.notifications.error('Mensaje persistente hasta que el usuario cierre');
this.notifications.warning('Advertencia auto-dismiss 5s');
```

---

## FormAlertComponent — Banner inline reutilizable

Componente compartido que reemplaza el HTML duplicado de banners de error.
Ubicacion: `shared/components/form-alert/form-alert.ts`

### Inputs y Outputs

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `message` | `InputSignal<string \| null>` | `null` | Texto a mostrar. No renderiza nada si es null/empty |
| `type` | `InputSignal<'error' \| 'warning' \| 'success' \| 'info'>` | `'error'` | Variante visual |
| `dismissible` | `InputSignal<boolean>` | `true` | Muestra boton de cerrar |
| `dismissed` | `OutputEmitterRef<void>` | — | Emite cuando el usuario cierra el banner |

### Uso

```html
<!-- Formularios (dismissible) -->
<app-form-alert [message]="error()" (dismissed)="error.set(null)" />

<!-- Dashboards, listas, auth (no dismissible) -->
<app-form-alert [message]="error()" [dismissible]="false" />

<!-- Warning -->
<app-form-alert [message]="warning()" type="warning" [dismissible]="false" />
```

**NO** usar HTML raw de `.alert .alert-error`. Siempre usar `<app-form-alert>`.

---

## Patron canonico: Formulario completo

Archivo de referencia gold standard: `features/patients/components/patient-form/patient-form.ts`

### TypeScript

```typescript
import { isFieldInvalid, getFieldError, markFormGroupTouched, applyServerErrors } from '@core/utils/form-error.utils';
import { FormAlertComponent } from '@shared/components/form-alert/form-alert';

@Component({
  imports: [/* ..., */ FormAlertComponent],
  // ...
})
export class ExampleFormComponent {
  error = signal<string | null>(null);
  loading = signal(false);

  // Wrapper methods — delegan a las utilidades compartidas
  isFieldInvalid(field: string): boolean {
    return isFieldInvalid(this.form, field);
  }

  getFieldError(field: string): string | null {
    return getFieldError(this.form, field);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      markFormGroupTouched(this.form);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.service.create(data).subscribe({
      next: () => {
        this.notifications.success('Recurso creado exitosamente');
        this.router.navigate(['/list']);
      },
      error: (err) => {
        this.error.set(applyServerErrors(err, this.form));
        this.loading.set(false);
      }
    });
  }
}
```

### HTML

```html
<!-- Banner de error (arriba del form) -->
<app-form-alert [message]="error()" (dismissed)="error.set(null)" />

<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <div class="form-group">
    <label class="form-label">Email <span class="required">*</span></label>
    <input
      type="email"
      class="form-input"
      formControlName="email"
      [class.input-error]="isFieldInvalid('email')"
    />
    @if (isFieldInvalid('email')) {
      <span class="error-message">{{ getFieldError('email') }}</span>
    }
  </div>
</form>
```

---

## Validacion de formularios (form-error.utils.ts)

### isFieldInvalid / getFieldError

Utilidades compartidas para validacion client-side Y server-side en formularios.

```typescript
import { isFieldInvalid, getFieldError, markFormGroupTouched } from '@core/utils/form-error.utils';

// Verificar si un campo es invalido y ha sido tocado
isFieldInvalid(this.form, 'email')   // -> boolean

// Obtener mensaje de error del campo
getFieldError(this.form, 'email')    // -> 'Email invalido' | null

// Con mensajes custom para validators especificos
getFieldError(this.form, 'amount', {
  min: () => 'El monto debe ser mayor a $0',
  max: () => `No puede exceder el saldo pendiente`
})

// Marcar todos los campos como touched antes de submit
if (this.form.invalid) {
  markFormGroupTouched(this.form);
  return;
}
```

Mensajes default cubiertos: `required`, `minlength`, `maxlength`, `email`, `pattern`, `min`, `max`, `serverError`, `curp`, `rfc`, `phone`, `postalCode`.

### applyServerErrors

Cuando el backend retorna `formErrors` (validacion server-side), se aplican directamente
al `FormGroup` para que `getFieldError()` / `isFieldInvalid()` los muestren automaticamente.

```typescript
import { applyServerErrors } from '@core/utils/form-error.utils';

// En el error callback del submit:
error: (err) => {
  this.error.set(applyServerErrors(err, this.form));
  this.loading.set(false);
}
```

**Comportamiento:**
1. Limpia errores `serverError` previos de todos los controles
2. Extrae `formErrors` del backend (`{fieldName: [messages]}`)
3. Aplica `serverError` como error de validacion en cada control que coincida
4. Marca los controles afectados como `touched`
5. Retorna el `message` general del backend para el banner inline

**Este es el patron preferido para TODOS los formularios.** No usar `getApiErrorMessage()` para errores de submit en formularios, ni hacer chequeos manuales de `err.status`.

---

## Clases CSS estandar

| Clase | Elemento | Proposito |
|-------|----------|-----------|
| `.input-error` | `<input>`, `<select>`, `<textarea>` | Borde rojo en campo invalido |
| `.error-message` | `<span>` debajo del campo | Texto de error de campo |
| `.alert .alert-error` | Contenedor del banner | Usado internamente por `FormAlertComponent` |

**NO** usar: `.form-error`, `[class.error]` para validacion de formularios, `.alert-danger`.

---

## Uso en componentes — por caso

### Caso 1: Formulario con submit (patron preferido)

Usa `applyServerErrors()` — maneja banner + errores por campo automaticamente.

```typescript
error: (err) => {
  this.error.set(applyServerErrors(err, this.form));
  this.loading.set(false);
}
```

### Caso 2: Carga de datos (listas, detalles)

Sin formulario, usa `getApiErrorMessage()` para el banner o empty state.

```typescript
error: (err) => {
  this.error.set(getApiErrorMessage(err));
  this.loading.set(false);
}
```

### Caso 3: Accion sin formulario visible (eliminar, toggle, exportar)

Usa toast porque no hay formulario donde mostrar el error inline.

```typescript
this.service.delete(id).subscribe({
  next: () => this.notifications.success('Eliminado exitosamente'),
  error: (err) => this.notifications.error(getApiErrorMessage(err))
});
```

### Caso 4: Logica condicional por errorCode

Solo cuando se necesita comportamiento especial (ej: conflicto de concurrencia).

```typescript
import { extractApiError } from '@core/utils/api-error.utils';

error: (err) => {
  const apiError = extractApiError(err);
  if (apiError.errorCode === 'ERR-4091') {
    this.handleConcurrencyConflict();
    return;
  }
  this.error.set(applyServerErrors(err, this.form));
  this.loading.set(false);
}
```

---

## Interfaces

### `ParsedApiError`

```typescript
interface ParsedApiError {
  message: string;                        // Mensaje en espanol del backend
  errorCode: string | null;               // 'ERR-4001', 'ERR-4091', etc.
  statusCode: number;                     // 400, 404, 500, etc.
  validationErrors: ValidationErrorDetail[]; // [{property, message}]
  formErrors: Record<string, string[]>;   // {fieldName: [messages]}
  isValidation: boolean;                  // true si hay validationErrors
}
```

### `ValidationErrorDetail`

```typescript
interface ValidationErrorDetail {
  property: string;        // Nombre del campo (camelCase)
  message: string;         // Mensaje de error en espanol
  attemptedValue?: unknown; // Valor que se intento enviar
}
```

---

## Reglas

### Siempre usar applyServerErrors() para errores de submit en formularios

```typescript
// Correcto — maneja banner + errores por campo automaticamente
error: (err) => {
  this.error.set(applyServerErrors(err, this.form));
  this.loading.set(false);
}

// Incorrecto — pierde mapeo de errores a campos, duplica mensajes del servidor
error: (err) => {
  if (err.status === 409) {
    this.error.set('El email ya esta registrado');
  } else {
    this.error.set(getApiErrorMessage(err));
  }
}
```

### Siempre usar wrapper methods para validacion en templates

```typescript
// Correcto — wrapper methods que delegan a utilidades compartidas
isFieldInvalid(field: string): boolean {
  return isFieldInvalid(this.form, field);
}
getFieldError(field: string): string | null {
  return getFieldError(this.form, field);
}

// Incorrecto — getters por campo, verbose, no usa mensajes centralizados
get emailControl() { return this.form.get('email'); }
// Template: emailControl?.invalid && emailControl?.touched
// Template: @if (emailControl?.errors?.['required']) { El email es requerido }
```

### Siempre usar FormAlertComponent para banners

```html
<!-- Correcto -->
<app-form-alert [message]="error()" (dismissed)="error.set(null)" />

<!-- Incorrecto — HTML duplicado -->
@if (error()) {
  <div class="alert alert-error">
    <i class="fa-solid fa-circle-exclamation alert-icon"></i>
    <span class="alert-message">{{ error() }}</span>
    <button class="alert-close" (click)="error.set(null)">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
}
```

### Siempre limpiar el error antes de un nuevo request

```typescript
// Correcto
onSubmit(): void {
  this.loading.set(true);
  this.error.set(null);       // Limpiar error previo
  this.service.create(data).subscribe({ ... });
}
```

### Siempre resetear loading en el error callback

```typescript
// Correcto
error: (err) => {
  this.error.set(applyServerErrors(err, this.form));
  this.loading.set(false);    // Siempre resetear
}
```

### No duplicar toasts que el interceptor ya maneja

El interceptor solo muestra toast para status 0 (sin conexion). Para todos los demas status,
el componente es responsable. No agregar toasts al interceptor.

### Usar markFormGroupTouched de la utilidad compartida

```typescript
// Correcto — import compartido
import { markFormGroupTouched } from '@core/utils/form-error.utils';
markFormGroupTouched(this.form);

// Incorrecto — copia local privada
private markFormGroupTouched(formGroup: FormGroup): void {
  Object.keys(formGroup.controls).forEach(key => {
    formGroup.get(key)?.markAsTouched();
  });
}
```

---

## Regla: Nunca dejar error callbacks silenciosos

Todo `.subscribe({ error })` debe proveer feedback al usuario. Excepciones permitidas:

| Excepcion | Motivo |
|-----------|--------|
| Carga de work schedule / schedule exceptions | Degradacion graceful — la UI funciona sin ellos |
| Clinic settings en prescripcion | Non-blocking con fallbacks explicitos |
| SMTP config 404 en settings | Intencional — "no config" es estado valido |

---

**Ultima actualizacion:** Marzo 27, 2026
