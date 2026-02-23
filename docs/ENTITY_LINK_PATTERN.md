# Entity Link Pattern — SmartDentalCloud

Estándar para convertir nombres de entidades relacionadas en hipervínculos navegables en pantallas de detalle y tablas.

## Principio

> Cuando una entidad tiene pantalla de detalle, su nombre debe ser un **hipervínculo clickeable** usando la clase `.link-primary`. No agregar links separados como "Ver perfil de X".

---

## Patrón

### ✅ Correcto — Nombre como hipervínculo

```html
<div class="info-row">
  <span class="info-label">Paciente:</span>
  <span class="info-value">
    <a [routerLink]="['/patients', entity.patientId]" class="link-primary">
      {{ entity.patientName }}
    </a>
  </span>
</div>
```

### ❌ Incorrecto — Link separado

```html
<!-- NO: link separado desperdicia espacio y es redundante -->
<div class="info-row">
  <span class="info-label">Nombre:</span>
  <span class="info-value">Jose Manuel Bautista Molina</span>
</div>
<a routerLink="/patients/123" class="link-primary">
  <i class="fa-solid fa-external-link"></i>
  Ver perfil del paciente
</a>
```

### ❌ Incorrecto — Texto plano cuando existe detalle

```html
<!-- NO: si la entidad tiene detalle, debe ser clickeable -->
<div class="info-row">
  <span class="info-label">Paciente:</span>
  <span class="info-value">Jose Manuel Bautista Molina</span>
</div>
```

---

## Entidades con Detalle (rutas navegables)

| Entidad | Ruta | Clase CSS |
|---------|------|-----------|
| Paciente | `/patients/:id` | `link-primary` |
| Doctor / Usuario | `/users/:id` | `link-primary` |
| Servicio | `/services/:id` | `link-primary` |
| Cita | `/appointments/:id` | `link-primary` |
| Tratamiento | `/treatments/:id` | `link-primary` |
| Plan de Tratamiento | `/treatment-plans/:id` | `link-primary` |
| Factura | `/invoices/:id` | `link-primary` |
| Receta | `/prescriptions/:id` | `link-primary` |

---

## Dónde Aplicar

### appointment-detail
- **Paciente** → `/patients/:patientId`
- **Doctor** → `/users/:dentistId`

### treatment-detail
- **Paciente** → `/patients/:patientId`
- **Servicio** → `/services/:serviceId` (si disponible)
- **Cita Asociada** → `/appointments/:appointmentId`
- **Plan de Tratamiento** → `/treatment-plans/:treatmentPlanId` (si planificado)

### prescription-detail
- **Paciente** → `/patients/:patientId`
- **Doctor** → `/users/:doctorId`

### invoice-detail
- **Paciente** → `/patients/:patientId`

### treatment-plan-detail
- **Paciente** → `/patients/:patientId`
- **Tratamientos** (en tabla) → `/treatments/:treatmentId`

### patient-detail (tabs)
- **Citas** → `/appointments/:id`
- **Tratamientos** → `/treatments/:id`
- **Facturas** → `/invoices/:id`
- **Recetas** → `/prescriptions/:id`

---

## Reglas

1. **Solo aplicar si el ID está disponible** — Si `patientId` es `null`, mostrar texto plano
2. **Usar siempre `.link-primary`** — Clase global que aplica color azul, hover underline
3. **No agregar iconos al link** — El color azul ya indica que es clickeable
4. **En tablas**, el nombre en la columna principal puede ser link si tiene sentido navegacional
5. **Nunca crear links "Ver perfil de X"** separados — el nombre clickeable es suficiente
6. **Fallback**: si no hay ID, usar `{{ name || '—' }}` como texto plano

### Ejemplo con fallback

```html
<div class="info-row">
  <span class="info-label">Paciente:</span>
  <span class="info-value">
    @if (entity.patientId) {
      <a [routerLink]="['/patients', entity.patientId]" class="link-primary">
        {{ entity.patientName }}
      </a>
    } @else {
      {{ entity.patientName || '—' }}
    }
  </span>
</div>
```

---

## Clase CSS de Referencia

La clase `.link-primary` está definida globalmente en `_components.scss`:

```scss
.link-primary {
  color: var(--primary-400);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-base);

  &:hover {
    color: var(--primary-300);
    text-decoration: underline;
  }
}
```

---

## Archivos de Referencia

- **Clase global:** `src/styles/_components.scss` (sección `.link-primary`)
- **Ejemplo implementado:** `src/app/features/treatments/components/treatment-detail/treatment-detail.html` (Paciente como link)
