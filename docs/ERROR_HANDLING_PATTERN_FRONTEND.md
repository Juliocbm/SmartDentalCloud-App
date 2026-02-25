# ERROR_HANDLING_PATTERN — Frontend Angular

Patrón estándar para consumir y mostrar errores de la API en componentes Angular.

> **Backend:** Ver `SmartDentalCloud-Api/docs/ERROR_HANDLING_PATTERN_BACKEND.md` para el formato `ApiErrorResponse` y catálogo de códigos.

---

## Archivos del patrón

| Archivo | Propósito |
|---------|-----------|
| `core/models/api-error.models.ts` | Interfaces: `ApiErrorResponse`, `ParsedApiError`, `ValidationErrorDetail` |
| `core/utils/api-error.utils.ts` | `extractApiError()`, `getApiErrorMessage()` — parseo de errores HTTP |
| `core/utils/form-error.utils.ts` | `isFieldInvalid()`, `getFieldError()`, `markFormGroupTouched()` — validación de formularios |
| `core/interceptors/error.interceptor.ts` | Interceptor funcional: toast automático según status code |
| `core/services/notification.service.ts` | `NotificationService` — toasts con signals |
| `shared/components/toast/` | Componente visual de toasts |

---

## Flujo de un error HTTP

```
HttpClient recibe error
  → authInterceptor (401 → refresh token / redirect)
  → errorInterceptor
      → Solo status 0: toast "sin conexión"
      → Re-lanza el error siempre
  → Componente .subscribe({ error: ... })
      → getApiErrorMessage(err) o extractApiError(err)
      → this.error.set(message) (inline) o notifications.error(message) (toast)
```

---

## Estrategia del errorInterceptor

| Status | Interceptor | Componente |
|--------|-------------|------------|
| 0 | Toast error persistente (sin conexión) | — |
| 400 | **No toast** | Muestra inline con `getApiErrorMessage()` o `applyServerErrors()` |
| 401 | **No toast** | `authInterceptor` maneja refresh/redirect |
| 403 | **No toast** | Componente muestra toast o inline según contexto |
| 404 | **No toast** | Muestra inline |
| 409 | **No toast** | Componente muestra toast o inline según contexto |
| 500+ | **No toast** | Componente muestra toast o inline según contexto |

**Regla:** El interceptor SOLO muestra toast para errores de conexión (status 0) — donde ningún
componente puede actuar. Para todos los demás errores, el componente es el único responsable
del feedback al usuario. Esto evita toasts duplicados y permite mensajes con contexto específico.

**IMPORTANTE:** No agregar toasts al interceptor para 400/403/404/409/500+. Los componentes
ya manejan estos errores. Agregar toast en el interceptor causaría notificaciones duplicadas.

---

## Sistema de Toasts (NotificationService)

| Tipo | Duración | Comportamiento |
|------|----------|----------------|
| `success` | 4s auto-dismiss | Desaparece solo |
| `info` | 4s auto-dismiss | Desaparece solo |
| `warning` | 5s auto-dismiss | Desaparece solo |
| `error` | **Persistente** (duration=0) | El usuario debe cerrar manualmente |

Todos los toasts tienen animación de entrada (slide-in) y salida (slide-out). El botón ✕ siempre está disponible para cierre manual.

```typescript
// El interceptor usa esto automáticamente, no llamar directamente para errores HTTP
this.notifications.success('Paciente creado exitosamente');
this.notifications.error('Mensaje persistente hasta que el usuario cierre');
this.notifications.warning('Advertencia auto-dismiss 5s');
```

---

## Inline Error Alerts — HTML Estándar

**Clase única:** `alert-error` (NO usar `alert-danger`).

### Variante A: Dismissible (formularios, modales)

Para errores que el usuario puede corregir y reintentar.

```html
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

### Variante B: No dismissible (dashboards, listas, auth)

Para errores de carga de página donde no hay acción correctiva inline.

```html
@if (error()) {
  <div class="alert alert-error">
    <i class="fa-solid fa-circle-exclamation alert-icon"></i>
    <span class="alert-message">{{ error() }}</span>
  </div>
}
```

**Reglas del HTML:**
- Siempre usar `alert-error` (nunca `alert-danger`)
- Siempre usar `fa-circle-exclamation` como icono (nunca `fa-exclamation-circle` o `fa-triangle-exclamation`)
- Siempre usar sub-clases `.alert-icon` y `.alert-message`
- Close button con `.alert-close` solo en formularios/modales

---

## Uso en componentes

### Caso 1: Mensaje simple (banner/alert)

El caso más común. Usa `getApiErrorMessage()` que retorna un `string` listo para mostrar.

```typescript
import { getApiErrorMessage } from '@core/utils/api-error.utils';

@Component({ ... })
export class ExampleFormComponent {
  error = signal<string | null>(null);
  loading = signal(false);

  onSubmit(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.create(data).subscribe({
      next: () => this.router.navigate(['/list']),
      error: (err) => {
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }
}
```

### Caso 2: Acceso a errores por campo (validación avanzada)

Cuando se necesitan los errores individuales por campo, usar `extractApiError()`.

```typescript
import { extractApiError } from '@core/utils/api-error.utils';

error: (err) => {
  const apiError = extractApiError(err);

  // apiError.message → string concatenado para banner
  // apiError.isValidation → true si hay errores de validación
  // apiError.validationErrors → [{property, message}] detalle por campo
  // apiError.formErrors → {fieldName: [messages]} agrupado por campo
  // apiError.errorCode → 'ERR-4001' para lógica condicional

  this.error.set(apiError.message);
  this.loading.set(false);
}
```

### Caso 3: Lógica condicional por tipo de error

```typescript
import { extractApiError } from '@core/utils/api-error.utils';

error: (err) => {
  const apiError = extractApiError(err);

  if (apiError.errorCode === 'ERR-4091') {
    this.error.set('Ya existe un registro con esos datos.');
  } else {
    this.error.set(apiError.message);
  }

  this.loading.set(false);
}
```

---

## Validación de formularios (form-error.utils.ts)

Utilidades compartidas para validación client-side en formularios.

```typescript
import { isFieldInvalid, getFieldError, markFormGroupTouched } from '@core/utils/form-error.utils';

// Verificar si un campo es inválido
isFieldInvalid(this.form, 'email')   // → boolean

// Obtener mensaje de error del campo
getFieldError(this.form, 'email')    // → 'Email inválido' | null

// Con mensajes custom para validators específicos
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

Mensajes default cubiertos: `required`, `minlength`, `maxlength`, `email`, `pattern`, `min`, `max`.

---

## Interfaces

### `ParsedApiError`

```typescript
interface ParsedApiError {
  message: string;                        // Mensaje en español del backend
  errorCode: string | null;               // 'ERR-4001', 'ERR-4041', etc.
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
  message: string;         // Mensaje de error en español
  attemptedValue?: unknown; // Valor que se intentó enviar
}
```

---

## Reglas

### Siempre usar las utilidades del patrón

```typescript
// ✅ Correcto
import { getApiErrorMessage } from '@core/utils/api-error.utils';
error: (err) => this.error.set(getApiErrorMessage(err))

// ✅ Correcto — cuando se necesita detalle
import { extractApiError } from '@core/utils/api-error.utils';
error: (err) => {
  const parsed = extractApiError(err);
  this.error.set(parsed.message);
}

// ❌ Incorrecto — parseo manual, frágil, inconsistente
error: (err) => this.error.set(err.error?.message || 'Error')

// ❌ Incorrecto — acceso directo sin tipado
error: (err) => console.log(err.error.validationErrors)
```

### Siempre limpiar el error antes de un nuevo request

```typescript
// ✅ Correcto
onSubmit(): void {
  this.loading.set(true);
  this.error.set(null);       // Limpiar error previo
  this.service.create(data).subscribe({ ... });
}

// ❌ Incorrecto — el error anterior persiste si el nuevo request tiene éxito
onSubmit(): void {
  this.loading.set(true);
  this.service.create(data).subscribe({ ... });
}
```

### Siempre resetear loading en el error callback

```typescript
// ✅ Correcto
error: (err) => {
  this.error.set(getApiErrorMessage(err));
  this.loading.set(false);    // Siempre resetear
}

// ❌ Incorrecto — el botón queda deshabilitado eternamente
error: (err) => {
  this.error.set(getApiErrorMessage(err));
  // loading nunca se resetea
}
```

### No duplicar toasts que el interceptor ya maneja

```typescript
// ✅ Correcto — para 400 mostrar inline, el interceptor NO muestra toast
error: (err) => {
  this.error.set(getApiErrorMessage(err));
}

// ❌ Incorrecto — duplica el toast que el interceptor ya muestra para 403/500
error: (err) => {
  this.notificationService.error(getApiErrorMessage(err)); // Duplicado
}
```

### Usar form-error.utils.ts para validación client-side

```typescript
// ✅ Correcto — utilidad compartida
import { isFieldInvalid, getFieldError } from '@core/utils/form-error.utils';

// En template: [class.input-error]="isFieldInvalid(form, 'email')"
// En template: {{ getFieldError(form, 'email') }}

// ❌ Incorrecto — implementar isFieldInvalid/getFieldError dentro del componente
isFieldInvalid(field: string): boolean {
  const f = this.form.get(field);
  return !!(f && f.invalid && f.touched);
}
```

---

## Integración de errores del servidor en FormGroup (applyServerErrors)

Cuando el backend retorna `formErrors` (validación server-side), se pueden aplicar directamente
al `FormGroup` para que `getFieldError()` / `isFieldInvalid()` los muestren automáticamente.

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
3. Aplica `serverError` como error de validación en cada control que coincida
4. Marca los controles afectados como `touched`
5. Retorna el `message` general del backend para el banner inline

El error `serverError` ya está incluido en `DEFAULT_ERROR_MESSAGES` de `getFieldError()`,
por lo que se muestra automáticamente en los templates existentes.

---

## Regla: Nunca dejar error callbacks silenciosos

Todo `.subscribe({ error })` debe proveer feedback al usuario. Excepciones permitidas:

| Excepción | Motivo |
|-----------|--------|
| Carga de work schedule / schedule exceptions | Degradación graceful — la UI funciona sin ellos |
| Clinic settings en prescripción | Non-blocking con fallbacks explícitos |
| SMTP config 404 en settings | Intencional — "no config" es estado válido |

Para todo lo demás:
```typescript
// ✅ Operaciones de guardado — SIEMPRE notificar error
error: (err) => {
  this.notifications.error(getApiErrorMessage(err, 'Error al guardar'));
  this.saving.set(false);
}

// ✅ Carga de datos — notificar si la UI queda vacía sin explicación
error: (err) => {
  this.notifications.error(getApiErrorMessage(err, 'Error al cargar datos'));
  this.loading.set(false);
}

// ❌ NUNCA — silencioso sin feedback
error: () => {
  this.loading.set(false);
}
```

---

**Última actualización:** Febrero 25, 2026
