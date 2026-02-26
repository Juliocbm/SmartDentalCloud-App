# PDF Generator Pattern — Frontend

> Estrategia, patrón e implementación para la integración de PDFs generados server-side en SmartDentalCloud-App.

---

## 1. Visión General

El frontend **NO genera PDFs**. Toda la generación ocurre en el backend con QuestPDF. El frontend se limita a:

1. **Descargar** el PDF (para impresión) → `GET /{resource}/{id}/pdf`
2. **Enviar por email** (con PDF adjunto) → `POST /{resource}/{id}/send-email`

Esto garantiza que el PDF impreso y el PDF enviado por email sean **idénticos**.

```
┌──────────────────────┐
│   Detail Component    │
│                       │
│  [Imprimir] [Email]   │
└───┬──────────┬────────┘
    │          │
    ▼          ▼
  service    service
 .downloadPdf()  .sendEmail()
    │          │
    ▼          ▼
  GET /pdf   POST /send-email
  (Blob)     (JSON)
    │          │
    ▼          ▼
  window.open()  Notification
  (nueva pestaña)  "Enviado a..."
```

---

## 2. Componentes del Patrón

### 2.1 Service — Métodos estándar

Cada feature service expone dos métodos:

```typescript
// {feature}.service.ts
downloadPdf(id: string): Observable<Blob> {
  return this.api.getBlob(`/{resource}/${id}/pdf`);
}

sendEmail(id: string, email: string): Observable<any> {
  return this.api.post(`/{resource}/${id}/send-email`, { email });
}
```

**`ApiService.getBlob()`** usa `responseType: 'blob'` para recibir el PDF como binario.

### 2.2 Detail Component — Estado y métodos

```typescript
// Signals de estado
printLoading = signal(false);
showEmailModal = signal(false);
patientEmail = signal<string | null>(null);
sendingEmail = signal(false);

// Imprimir — descarga PDF y abre en nueva pestaña
onPrint(): void {
  const entity = this.entity();
  if (!entity) return;
  this.printLoading.set(true);
  this.service.downloadPdf(entity.id).subscribe({
    next: (blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      this.printLoading.set(false);
    },
    error: (err) => {
      this.notifications.error(getApiErrorMessage(err));
      this.printLoading.set(false);
    }
  });
}

// Abrir modal de email — carga email del paciente
openEmailModal(): void {
  const entity = this.entity();
  if (!entity) return;
  this.patientEmail.set(null);
  this.showEmailModal.set(true);
  this.patientsService.getById(entity.patientId).subscribe({
    next: (patient) => this.patientEmail.set(patient.email || null),
    error: () => this.patientEmail.set(null)
  });
}

// Enviar email
onSendEmail(email: string): void {
  const entity = this.entity();
  if (!entity) return;
  this.sendingEmail.set(true);
  this.service.sendEmail(entity.id, email).subscribe({
    next: () => {
      this.notifications.success(`Documento enviado a ${email}`);
      this.showEmailModal.set(false);
      this.sendingEmail.set(false);
    },
    error: (err) => {
      this.notifications.error(getApiErrorMessage(err));
      this.sendingEmail.set(false);
    }
  });
}
```

### 2.3 Template HTML — Botones y Modal

```html
<!-- Botones en <div actions> del page-header -->
<button class="btn btn-outline" (click)="openEmailModal()">
  <i class="fa-solid fa-envelope"></i>
  Enviar Email
</button>
<button class="btn btn-outline" (click)="onPrint()" [disabled]="printLoading()">
  @if (printLoading()) {
    <span class="btn-spinner"></span>
    Generando...
  } @else {
    <i class="fa-solid fa-print"></i>
    Imprimir
  }
</button>

<!-- Modal de email (al final del template) -->
@if (showEmailModal()) {
  <app-send-email-modal
    title="Enviar {Documento}"
    subtitle="El PDF se adjuntará al correo"
    icon="fa-{icon}"
    [patientEmail]="patientEmail()"
    [sending]="sendingEmail()"
    (send)="onSendEmail($event)"
    (closed)="showEmailModal.set(false)"
  />
}
```

### 2.4 SendEmailModalComponent (Shared)

Componente reutilizable ubicado en `shared/components/send-email-modal/`.

**Inputs:**

| Input | Tipo | Descripción |
|-------|------|-------------|
| `title` | `string` | Título del modal |
| `subtitle` | `string` | Subtítulo / descripción |
| `icon` | `string` | Clase Font Awesome (sin `fa-solid`) |
| `patientEmail` | `string \| null` | Email del paciente (precarga) |
| `sending` | `boolean` | Estado de envío (loading) |

**Outputs:**

| Output | Tipo | Descripción |
|--------|------|-------------|
| `send` | `string` | Emite el email seleccionado/ingresado |
| `closed` | `void` | Emite cuando se cierra el modal |

El modal ofrece dos opciones:
1. **Email del paciente** (precargado desde `PatientsService`)
2. **Email personalizado** (input libre)

---

## 3. Dependencias Requeridas

### En el route file del feature:

```typescript
// {feature}.routes.ts
import { PatientsService } from '../patients/services/patients.service';

providers: [FeatureService, PatientsService]
```

`PatientsService` es necesario para cargar el email del paciente en el modal.

### En el component imports:

```typescript
imports: [
  CommonModule,
  RouterModule,
  SendEmailModalComponent,  // ← Modal compartido
  // ... otros imports
]
```

---

## 4. Flujo de Impresión

```
Usuario hace clic en "Imprimir"
    │
    ▼
printLoading = true (botón muestra spinner)
    │
    ▼
GET /api/{resource}/{id}/pdf
    │
    ▼
Backend genera PDF con QuestPDF
    │
    ▼
Response: Blob (application/pdf)
    │
    ▼
URL.createObjectURL(blob)
    │
    ▼
window.open(url, '_blank')
    │
    ▼
Se abre nueva pestaña con el PDF
(el usuario puede imprimir con Ctrl+P desde ahí)
    │
    ▼
printLoading = false
```

**Importante:** NO se usa `window.print()` ni CSS `@media print`. El PDF se genera en el backend para garantizar consistencia.

---

## 5. Flujo de Email

```
Usuario hace clic en "Enviar Email"
    │
    ▼
showEmailModal = true
GET /api/patients/{patientId} (para precargar email)
    │
    ▼
Modal muestra opciones:
  ○ Email del paciente: patient@email.com
  ○ Otro email: [_____________]
    │
    ▼
Usuario selecciona y confirma
    │
    ▼
sendingEmail = true (botón muestra spinner)
    │
    ▼
POST /api/{resource}/{id}/send-email { email }
    │
    ▼
Backend: genera PDF + construye HTML email + adjunta PDF + envía
    │
    ▼
Response: 200 OK
    │
    ▼
Notification: "Documento enviado a patient@email.com"
showEmailModal = false
sendingEmail = false
```

---

## 6. Guía para Agregar un Nuevo Módulo

### Checklist

1. **`{feature}.service.ts`**
   - Agregar `downloadPdf(id: string): Observable<Blob>`
   - Agregar `sendEmail(id: string, email: string): Observable<any>`

2. **`{feature}.routes.ts`**
   - Agregar `PatientsService` a `providers` (si no está)

3. **`{feature}-detail.ts`**
   - Importar `SendEmailModalComponent`, `PatientsService`
   - Agregar `SendEmailModalComponent` a `imports[]`
   - Agregar signals: `printLoading`, `showEmailModal`, `patientEmail`, `sendingEmail`
   - Agregar métodos: `onPrint()`, `openEmailModal()`, `onSendEmail()`
   - Inyectar: `patientsService = inject(PatientsService)`

4. **`{feature}-detail.html`**
   - Agregar botones "Enviar Email" e "Imprimir" en `<div actions>`
   - Agregar `<app-send-email-modal>` al final del template

5. **NO crear:**
   - HTML de impresión (`@media print`)
   - SCSS de impresión
   - Lógica de `window.print()`

### Tiempo estimado por módulo: ~30 minutos

---

## 7. Módulos Implementados

| Módulo | Service | Detail Component | Botón Print | Botón Email |
|--------|---------|-----------------|-------------|-------------|
| Recetas | `prescriptions.service.ts` | `prescription-detail.ts` | ✅ PDF server-side | ✅ Con modal |
| Planes de Tratamiento | `treatment-plans.service.ts` | `treatment-plan-detail.ts` | ✅ PDF server-side | ✅ Con modal |

---

## 8. Antipatrones a Evitar

| ❌ No hacer | ✅ Hacer |
|------------|---------|
| `window.print()` | `downloadPdf()` → `window.open(blob)` |
| HTML oculto con `@media print` | PDF generado en backend |
| SCSS de impresión (400+ líneas) | 0 líneas de CSS de impresión |
| Cargar `SettingsService` para print | Backend obtiene datos del tenant |
| Generar PDF en frontend | Backend con QuestPDF |
| Diseño diferente entre print y email | Mismo PDF para ambos |

---

## 9. Convenciones

- **Botón "Imprimir"**: Siempre `btn btn-outline` con icono `fa-print`
- **Botón "Enviar Email"**: Siempre `btn btn-outline` con icono `fa-envelope`
- **Loading state**: Mostrar `btn-spinner` + "Generando..." durante descarga
- **Posición**: Botones en `<div actions>` del `<app-page-header>`
- **Modal**: Siempre al final del template, dentro del bloque condicional principal
- **Notificaciones**: `success` al enviar, `error` con `getApiErrorMessage()` en fallas
