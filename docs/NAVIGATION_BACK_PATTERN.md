# Patrón de Navegación de Retorno (Back Button)

Guía centralizada para implementar el botón de retorno en `app-page-header`. Define cuándo usar cada modo y cómo integrarlo con el Context Service.

---

## Implementación en `page-header.ts`

El componente `PageHeaderComponent` expone 2 inputs opcionales que controlan el comportamiento del back-button:

```typescript
@Input() backRoute?: string;         // Ruta fija — SIEMPRE navega ahí
@Input() defaultBackRoute?: string;  // Fallback — location.back() primero
```

### Lógica de `onBackClick()`

```typescript
onBackClick(): void {
  if (this.backRoute) {
    // Modo 1: Ruta fija — navega SIEMPRE a esa ruta
    this.router.navigate([this.backRoute]);
  } else if (this.defaultBackRoute) {
    // Modo 2: History-first — respeta origen real, fallback si no hay history
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate([this.defaultBackRoute]);
    }
  } else {
    // Modo 3: Solo history — siempre location.back()
    this.location.back();
  }
}
```

---

## Tabla de Decisión

| Input | Comportamiento | Usar en | Ejemplo |
|-------|---------------|---------|---------|
| `backRoute` | Navega **SIEMPRE** a esa ruta específica | Formularios (create/edit), sub-páginas fijas | `[backRoute]="'/invoices'"` |
| `backRoute` (dinámico) | Navega a ruta controlada por Context Service | Formularios con múltiples orígenes | `[backRoute]="backRoute()"` |
| `defaultBackRoute` | `location.back()` + fallback | Detail views alcanzables desde entity links | `[defaultBackRoute]="'/patients'"` |
| Ninguno | `location.back()` siempre | Componentes con un solo origen posible | — |

---

## Modo 1: `backRoute` — Ruta Fija

**Cuándo:** El formulario tiene un **único destino de retorno** conocido en tiempo de compilación.

```html
<!-- Formulario que siempre regresa a la lista -->
<app-page-header
  [title]="'Nuevo Producto'"
  [showBackButton]="true"
  [backRoute]="'/inventory/products'"
/>
```

**Componentes que lo usan:**
- Formularios simples: `product-form`, `supplier-form`, `service-form`, `patient-form`, `role-form`
- Sub-páginas: reportes, listas dentro de módulos, calendarios
- Páginas utilitarias: `patient-merge`, `clinical-export`

---

## Modo 1b: `backRoute` Dinámico (via Context Service)

**Cuándo:** El formulario se alcanza desde **múltiples orígenes** y necesita regresar al origen correcto. El Context Service controla `returnUrl`.

```typescript
// En el componente formulario
backRoute = computed(() => this.contextService.context().returnUrl);
```

```html
<app-page-header
  [title]="'Nueva Cita'"
  [showBackButton]="true"
  [backRoute]="backRoute()"
/>
```

**Componentes que lo usan:**
- `appointment-form` — se llama desde dentistas, pacientes, calendario
- `user-form` — se llama desde usuarios, dentistas, recepción
- `category-form` — se llama desde categorías, sub-categorías
- `invoice-form` — se llama desde tratamientos, citas, planes, lista de facturas

> **Referencia:** Ver `CONTEXT_SERVICE_PATTERN.md` para implementación completa del patrón.

---

## Modo 2: `defaultBackRoute` — History-First con Fallback

**Cuándo:** La vista de **detalle** es alcanzable desde **múltiples entity links** en la app. El usuario debe regresar a donde vino, no a una ruta fija.

```html
<!-- Detail view — respeta el origen real del usuario -->
<app-page-header
  [title]="patient()?.name || 'Paciente'"
  [showBackButton]="true"
  [defaultBackRoute]="'/patients'"
/>
```

**Comportamiento:**
1. Si hay historial → `location.back()` (regresa al origen real)
2. Si no hay historial (URL directa, F5, nuevo tab) → navega al fallback

**Componentes que lo usan:**

| Componente | Fallback | Orígenes posibles |
|-----------|----------|-------------------|
| `patient-detail` | `/patients` | invoices, appointments, treatments, treatment-plans, payments, prescriptions, reports |
| `treatment-detail` | `/treatments` | patient-detail, treatment-plans |
| `user-detail` | `/users` | appointments, treatments |
| `appointment-detail` | `/appointments` | patients, dashboard |
| `treatment-plan-detail` | `/treatment-plans` | patient-detail |
| `invoice-detail` | `/invoices/list` | patient-detail, payments |
| `prescription-detail` | `/prescriptions` | patient-detail |
| `service-detail` | `/services` | treatments |
| `payment-detail` | `/payments` | invoices, patient-detail |
| `location-detail` | `/settings` | appointments, stock-alerts |
| `category-detail` | `/inventory/categories` | products |
| `product-detail` | `/inventory/products` | stock-alerts, purchase-orders |
| `supplier-detail` | `/inventory/suppliers` | purchase-orders |
| `purchase-order-detail` | `/inventory/purchase-orders` | suppliers |

---

## Modo 3: Sin Input — Solo `location.back()`

**Cuándo:** El componente tiene un **único origen posible** y no necesita fallback.

```html
<app-page-header
  [title]="'Checkout'"
  [showBackButton]="true"
/>
```

Raramente usado. Preferir `defaultBackRoute` para robustez ante navegación directa por URL.

---

## Anti-Patterns

### ❌ Hardcodear `backRoute` en formularios con múltiples orígenes

```html
<!-- INCORRECTO — siempre va a /invoices, ignora origen real -->
<app-page-header [backRoute]="'/invoices'" />
```

**Problema:** Si el usuario llega desde treatment-detail, al hacer back termina en /invoices en lugar de regresar al tratamiento.

**Solución:** Usar Context Service para controlar `returnUrl` dinámicamente.

### ❌ Usar `backRoute` fijo en detail views

```html
<!-- INCORRECTO — siempre va a /patients, ignora si vino de invoices -->
<app-page-header [backRoute]="'/patients'" />
```

**Solución:** Usar `defaultBackRoute` para respetar `location.back()`.

### ❌ No poner fallback en detail views

```html
<!-- INCORRECTO — si el usuario llega por URL directa, location.back() va a blank -->
<app-page-header [showBackButton]="true" />
```

**Solución:** Siempre usar `defaultBackRoute` en detail views.

---

## Resumen Rápido

```
¿Es un formulario (create/edit)?
  ├─ ¿Tiene un solo origen? → backRoute estático
  └─ ¿Múltiples orígenes? → backRoute dinámico (Context Service)

¿Es un detail view?
  └─ defaultBackRoute con fallback a la lista principal

¿Otro tipo de vista?
  └─ Evaluar caso por caso, preferir defaultBackRoute
```

---

**Última actualización:** Marzo 2026
**Archivos de referencia:**
- `src/app/shared/components/page-header/page-header.ts` — Implementación del back-button
- `CONTEXT_SERVICE_PATTERN.md` — Patrón para backRoute dinámico en formularios
