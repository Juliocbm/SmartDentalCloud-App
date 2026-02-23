# Patrón: Auditoría en Pantallas de Detalle

## Descripción

Todas las pantallas de detalle muestran información de auditoría (creación y modificación) a través de un **modal reutilizable** accesible desde un botón icono en el `page-header`.

## Componente

`app-audit-info` — Componente shared en `src/app/shared/components/audit-info/`

### Inputs

| Input | Tipo | Descripción |
|-------|------|-------------|
| `visible` | `boolean` | Controla la visibilidad del modal |
| `createdAt` | `Date \| string \| null \| undefined` | Fecha de creación |
| `createdByName` | `string \| null \| undefined` | Nombre del creador |
| `updatedAt` | `Date \| string \| null \| undefined` | Fecha de última modificación |
| `updatedByName` | `string \| null \| undefined` | Nombre del último modificador |

### Output

| Output | Tipo | Descripción |
|--------|------|-------------|
| `closed` | `void` | Emitido cuando el modal se cierra |

## Implementación

### 1. TS del componente de detalle

```typescript
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';

@Component({
  imports: [..., AuditInfoComponent],
})
export class EntityDetailComponent {
  showAuditModal = signal(false);
}
```

### 2. HTML — Botón en page-header actions

```html
<app-page-header ...>
  <div actions>
    <button class="btn btn-icon" (click)="showAuditModal.set(true)" title="Auditoría">
      <i class="fa-solid fa-clock-rotate-left"></i>
    </button>
    <!-- ... otros botones de acción ... -->
  </div>
</app-page-header>
```

### 3. HTML — Componente audit-info dentro del bloque @if de la entidad

```html
@if (entity(); as e) {
  <!-- ... contenido del detalle ... -->

  <app-audit-info
    [visible]="showAuditModal()"
    [createdAt]="e.createdAt"
    [createdByName]="e.createdByName"
    [updatedAt]="e.updatedAt"
    [updatedByName]="e.updatedByName"
    (closed)="showAuditModal.set(false)"
  />
}
```

## Reglas

1. **Siempre usar `app-audit-info`** — No mostrar campos de auditoría inline en info-rows.
2. **Botón icono `fa-clock-rotate-left`** — Siempre en el área de actions del page-header.
3. **Solo pasar los campos disponibles** — Si el modelo no tiene `updatedAt`, simplemente no se pasa.
4. **Modal tamaño `sm`** — El componente usa `modal-sm` internamente.
5. **Posición del botón** — Antes de los botones de acción principales (Editar, Eliminar).

## Pantallas implementadas

| Pantalla | createdAt | createdByName | updatedAt | updatedByName |
|----------|-----------|---------------|-----------|---------------|
| appointment-detail | ✅ | — | — | — |
| service-detail | ✅ | — | ✅ | — |
| treatment-detail | ✅ | ✅ | ✅ | ✅ |
| patient-detail | ✅ | — | ✅ | — |
| invoice-detail | ✅ | — | — | — |
| prescription-detail | ✅ (issuedAt) | ✅ (prescribedByName) | — | — |
| payment-detail | ✅ | — | — | — |
| treatment-plan-detail | ✅ | ✅ | — | — |
| product-detail | ✅ | — | ✅ | — |
| supplier-detail | ✅ | — | — | — |
| category-detail | ✅ | — | — | — |
| purchase-order-detail | ✅ | — | ✅ | — |
| user-detail | ✅ | — | — | — |
