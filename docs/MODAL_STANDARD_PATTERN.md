# 📋 Modal Standard Pattern — SmartDentalCloud

Este documento define el patrón estándar para **todos los modales** de la plataforma SmartDentalCloud.
Todos los modales deben seguir estas convenciones para mantener consistencia visual y de comportamiento.

---

## 🏗️ Arquitectura

### Componentes del Sistema

| Componente | Ubicación | Responsabilidad |
|-----------|-----------|-----------------|
| `ModalComponent` | `shared/components/modal/` | Shell visual reutilizable (overlay, header, body, footer) |
| `ModalService` | `shared/services/modal.service.ts` | Apertura programática de modales con datos tipados |
| Estilos globales | `src/styles/_components.scss` | Sección "MODALES" con todos los estilos base |

### Flujo de Datos

```
Componente padre
  → ModalService.open(MiModalComponent, { data: {...} })
    → ModalService crea el componente dinámicamente
      → Inyecta modalData, modalRef, modalConfig
        → MiModalComponent usa <app-modal> como shell
          → El usuario interactúa
            → modalRef.close(resultado) devuelve datos al padre
```

---

## 📐 Estructura HTML del Modal

### Template del Modal Consumer

```html
<app-modal
  [title]="'Título del Modal'"
  [subtitle]="'Subtítulo o contexto'"
  [icon]="'fa-icon-name'"
  [size]="'md'"
  (closed)="onClose()">

  <!-- Contenido del body (proyectado en ng-content) -->
  <form [formGroup]="form">
    <div class="form-group">
      <label class="form-label">Campo <span class="required">*</span></label>
      <input type="text" class="form-input" formControlName="campo" />
    </div>
  </form>

  <!-- Footer con botones (proyectado en [modal-footer]) -->
  <div modal-footer>
    <button type="button" class="btn btn-outline" (click)="onClose()" [disabled]="loading()">
      <i class="fa-solid fa-times"></i>
      Cancelar
    </button>
    <button type="button" class="btn btn-outline btn-success" (click)="onSubmit()" [disabled]="loading() || form.invalid">
      @if (loading()) {
        <span class="btn-spinner"></span>
        Guardando...
      } @else {
        <i class="fa-solid fa-plus"></i>
        Crear {Entidad}
      }
    </button>
  </div>
</app-modal>
```

### Estructura Visual Resultante

```
┌──────────────────────────────────────────────┐
│ ░░░░░░░░░░░░ OVERLAY (backdrop) ░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░  ┌──────────────────────────────────┐  ░░ │
│ ░░  │ 🔵 Título               [✕]     │  ░░ │  ← .modal-header
│ ░░  │    Subtítulo                     │  ░░ │
│ ░░  ├──────────────────────────────────┤  ░░ │
│ ░░  │                                  │  ░░ │
│ ░░  │   Contenido del modal            │  ░░ │  ← .modal-body (ng-content)
│ ░░  │   (formularios, info, etc.)      │  ░░ │
│ ░░  │                                  │  ░░ │
│ ░░  ├──────────────────────────────────┤  ░░ │
│ ░░  │          [Cancelar] [Confirmar]  │  ░░ │  ← .modal-footer ([modal-footer])
│ ░░  └──────────────────────────────────┘  ░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────────────────────┘
```

---

## 🎨 Clases CSS del Sistema de Modales

### Overlay

| Clase | Descripción |
|-------|-------------|
| `.modal-overlay` | Fondo oscuro con `backdrop-filter: blur(4px)`, animación `fadeIn` |

### Contenedor

| Clase | Descripción |
|-------|-------------|
| `.modal-container` | Contenedor principal con `border-radius`, `box-shadow`, animación `slideIn` |
| `.modal-sm` | Ancho máximo: **400px** — Confirmaciones, alertas simples |
| `.modal-md` | Ancho máximo: **560px** — Formularios estándar (DEFAULT) |
| `.modal-lg` | Ancho máximo: **720px** — Formularios complejos |
| `.modal-xl` | Ancho máximo: **960px** — Tablas, contenido extenso |

### Header

| Clase | Descripción |
|-------|-------------|
| `.modal-header` | Contenedor flex con borde inferior |
| `.modal-title-section` | Flex container para icono + título |
| `.modal-icon` | Cuadro de 48×48px con fondo `primary-50` e icono `primary-500` |
| `.modal-title-content` | Columna flex para título + subtítulo |
| `.modal-title` | `h2` — `font-size-xl`, `font-weight-semibold` |
| `.modal-subtitle` | `p` — `font-size-sm`, `text-secondary` |
| `.modal-close-btn` | Botón `✕` de 36×36px con hover en `surface-tertiary` |

### Body

| Clase | Descripción |
|-------|-------------|
| `.modal-body` | Padding `spacing-xl`, `overflow-y: auto`, `flex: 1` |

### Footer

| Clase | Descripción |
|-------|-------------|
| `.modal-footer` | Flex container, `justify-content: flex-end`, `gap: spacing-sm`, fondo `surface-secondary`, borde superior, bordes inferiores redondeados |

> **Nota**: El footer se oculta automáticamente si está vacío (`:empty { display: none }`).

---

## ⚡ Animaciones

### Overlay: `fadeIn` (0.2s)
```
opacity: 0 → 1
```

### Contenedor: `slideIn` (0.25s)
```
opacity: 0, translateY(-20px), scale(0.95)
  → opacity: 1, translateY(0), scale(1)
```

### Responsive (≤ 640px)
- El modal se convierte en **bottom sheet**: se ancla al fondo de la pantalla
- `border-radius` solo en esquinas superiores
- `max-height: 85vh`
- Footer en columna vertical

---

## 🔧 API del ModalComponent

### Inputs (Signal-based)

| Input | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `title` | `string` | `''` | Título principal del modal |
| `subtitle` | `string \| undefined` | `undefined` | Subtítulo o contexto |
| `icon` | `string \| undefined` | `undefined` | Clase Font Awesome sin `fa-solid` prefix (ej: `'fa-money-bill-wave'`) |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Tamaño del modal |
| `showCloseButton` | `boolean` | `true` | Mostrar botón ✕ en header |
| `closeOnBackdrop` | `boolean` | `true` | Cerrar al hacer click en el overlay |

### Outputs

| Output | Tipo | Descripción |
|--------|------|-------------|
| `closed` | `void` | Emitido al cerrar (click backdrop, ESC, o botón ✕) |

### Content Projection Slots

| Slot | Selector | Descripción |
|------|----------|-------------|
| Body | `<ng-content>` (default) | Contenido principal del modal |
| Footer | `<ng-content select="[modal-footer]">` | Botones de acción |

---

## 🔧 API del ModalService

### Interfaces

```typescript
// Interface que implementan los componentes-modal
interface ModalComponentBase<T = unknown, R = unknown> {
  modalData?: T;           // Datos de entrada
  modalRef?: ModalRef<T, R>;     // Referencia para cerrar/devolver resultado
  modalConfig?: ModalConfig<T>;  // Configuración
}

// Configuración para abrir
interface ModalConfig<T = unknown> {
  data?: T;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

// Referencia al modal abierto
interface ModalRef<T = unknown, R = unknown> {
  close: (result?: R) => void;
  afterClosed: () => Subject<R | undefined>;
  data: T;
}
```

### Uso desde el componente padre

```typescript
// 1. Inyectar el servicio
private modalService = inject(ModalService);

// 2. Abrir el modal con datos tipados
openPaymentModal(): void {
  const ref = this.modalService.open<PaymentFormModalData, Payment>(
    PaymentFormModalComponent,
    {
      data: {
        invoiceId: this.invoice.id,
        balance: this.invoice.balance,
        patientName: this.invoice.patientName
      }
    }
  );

  // 3. Manejar el resultado
  ref.afterClosed().subscribe(payment => {
    if (payment) {
      // Se completó la acción — refrescar datos
      this.loadInvoice();
    }
  });
}
```

---

## 📁 Estructura de un Modal Component

### Archivos

```
features/{feature}/components/{name}-modal/
├── {name}-modal.html       ← Template con <app-modal>
├── {name}-modal.scss        ← Solo estilos específicos del contenido
└── {name}-modal.ts          ← Implementa ModalComponentBase<TData, TResult>
```

### TypeScript Pattern

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';

// Datos de entrada tipados
export interface MiModalData {
  entityId: string;
  entityName: string;
}

@Component({
  selector: 'app-mi-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './mi-modal.html',
  styleUrl: './mi-modal.scss'
})
export class MiModalComponent implements ModalComponentBase<MiModalData, boolean> {
  private fb = inject(FormBuilder);

  // Inyectados automáticamente por ModalService
  modalData?: MiModalData;
  modalRef?: ModalRef<MiModalData, boolean>;
  modalConfig?: ModalConfig<MiModalData>;

  form!: FormGroup;
  loading = signal(false);

  ngOnInit(): void {
    this.form = this.fb.group({
      campo: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    // ... llamada HTTP ...
    // En success: this.modalRef?.close(true);
    // En error: this.loading.set(false);
  }

  onClose(): void {
    this.modalRef?.close();
  }
}
```

---

## 📏 Cuándo Usar Cada Tamaño

| Tamaño | `max-width` | Caso de Uso |
|--------|-------------|-------------|
| `sm` (400px) | Confirmaciones, alertas, selección simple, quick-create |
| `md` (560px) | Formularios estándar (pago, ajuste stock) — **DEFAULT** |
| `lg` (720px) | Formularios complejos con múltiples secciones |
| `xl` (960px) | Tablas, grids, contenido extenso |

---

## ✅ Footer Buttons — Convenciones

### Orden de botones
```
[Cancelar]  [Acción Principal]
```
- **Cancelar** siempre a la **izquierda** (`btn btn-outline`)
- **Acción principal** siempre a la **derecha** (`btn btn-outline btn-success` para crear/guardar, `btn btn-primary` para confirmar)

### Botón Cancelar (estándar)
```html
<button type="button" class="btn btn-outline" (click)="onClose()" [disabled]="loading()">
  <i class="fa-solid fa-times"></i>
  Cancelar
</button>
```

### Botón Acción Principal (con loading state)
```html
<button type="button" class="btn btn-outline btn-success" (click)="onSubmit()" [disabled]="loading() || form.invalid">
  @if (loading()) {
    <span class="btn-spinner"></span>
    Guardando...
  } @else {
    <i class="fa-solid fa-plus"></i>
    Crear {Entidad}
  }
</button>
```

### Variantes de botón primario por contexto

| Contexto | Clase | Icono | Texto |
|----------|-------|-------|-------|
| Crear | `btn-outline btn-success` | `fa-plus` | "Crear {Entidad}", "Registrar {Entidad}" |
| Guardar (edición) | `btn-outline btn-success` | `fa-floppy-disk` | "Guardar Cambios" |
| Eliminar | `btn-danger` | `fa-trash` | "Eliminar" |
| Confirmar acción simple | `btn-primary` | `fa-check` | "Confirmar" |

---

## 🚫 Modales Inline vs ModalService

### Cuándo usar `ModalService.open()` (programático)
- Modales que necesitan **devolver datos** al componente padre
- Modales invocados desde **múltiples lugares**
- Modales con lógica compleja y formularios

### Cuándo usar `<app-modal>` inline (en template)
- Modales simples de **confirmación** o **información**
- Controlados por un `signal<boolean>` local
- Sin necesidad de devolver datos complejos

```html
<!-- Ejemplo inline -->
@if (showConfirmModal()) {
  <app-modal
    title="Confirmar Acción"
    icon="fa-question-circle"
    size="sm"
    (closed)="showConfirmModal.set(false)">

    <p>¿Estás seguro de que deseas continuar?</p>

    <div modal-footer>
      <button class="btn btn-outline" (click)="showConfirmModal.set(false)">Cancelar</button>
      <button class="btn btn-outline btn-success" (click)="confirm()">Confirmar</button>
    </div>
  </app-modal>
}
```

---

## ✅ Do's

- ✅ Siempre usar `<app-modal>` como shell visual
- ✅ Implementar `ModalComponentBase<T, R>` para modales programáticos
- ✅ Tipar `modalData` y el resultado de `modalRef.close(result)`
- ✅ Usar `btn btn-outline` para Cancelar, `btn btn-outline btn-success` para crear/guardar
- ✅ Incluir icono + texto en los botones del footer
- ✅ Usar `<span class="btn-spinner"></span>` para estado de carga (NO `fa-spinner fa-spin`)
- ✅ Deshabilitar botones durante `loading()`
- ✅ Cerrar con `modalRef?.close()` en el `onClose()`
- ✅ Mantener estilos de contenido en el SCSS del componente modal
- ✅ Usar `form-input` y `form-group` del sistema de formularios global
- ✅ Dejar que el footer se auto-oculte si no hay botones

## 🚫 Don'ts

- ❌ NO crear modales inline con HTML custom (overlay + container + header)
- ❌ NO duplicar estilos de `.modal-overlay`, `.modal-header`, `.modal-footer` en SCSS de componentes
- ❌ NO usar `.close-btn` — usar `showCloseButton` input del componente
- ❌ NO usar `btn-secondary` sólido en footer — usar `btn-outline` + `btn-outline btn-success`
- ❌ NO agregar clase custom al `<div modal-footer>` (el global ya maneja layout)
- ❌ NO usar `z-index` custom — el componente y `_components.scss` lo manejan
- ❌ NO usar `@keyframes slideIn` local — las animaciones son globales

---

## 📍 Archivos de Referencia

- **Componente Modal Base**: `src/app/shared/components/modal/modal.ts`
- **Template Modal Base**: `src/app/shared/components/modal/modal.html`
- **Servicio de Modales**: `src/app/shared/services/modal.service.ts`
- **Estilos Globales**: `src/styles/_components.scss` → Sección "MODALES"

---

## 🚀 Estado de Implementación

1. ✅ **ModalComponent**: Componente base shared funcional con inputs tipados
2. ✅ **ModalService**: Servicio de apertura programática con `ModalRef<T,R>`
3. ✅ **Estilos globales**: Overlay, container, header, body, footer, animaciones, responsive
4. ✅ **payment-form-modal**: Migrado al patrón estándar
5. ✅ **stock-adjustment-modal**: Migrado al patrón estándar
6. ✅ **appointment-calendar**: Modal inline migrado a `<app-modal>`
7. ✅ **Legacy cleanup**: Sección duplicada de modales eliminada de `_components.scss`

---

## 📝 Notas Importantes

- **Consistencia visual**: Todos los modales comparten las mismas animaciones, bordes, sombras y tipografía
- **Responsive**: En mobile (≤640px) los modales se convierten en bottom sheets automáticamente
- **Accesibilidad**: ESC cierra el modal, click en backdrop cierra el modal
- **Stack de modales**: `ModalService` soporta múltiples modales apilados
- **Footer auto-hide**: Si no se proyecta contenido en `[modal-footer]`, el footer no se renderiza
