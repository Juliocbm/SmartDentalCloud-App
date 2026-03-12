# Medical List Pattern - Diseño Estándar

## Descripción

Patrón de diseño reutilizable para listas de items médicos compactos (alergias, consentimientos, diagnósticos, tratamientos, etc.) con estructura horizontal de 1-2 líneas máximo.

## Estructura HTML

```html
<div class="medical-list">
  @for (item of items(); track item.id) {
    <div class="medical-list-item" [class.--inactive]="!item.isActive">
      <!-- Fila principal: info + acciones -->
      <div class="medical-list-item__main">
        <!-- Info: título + badges + metadata inline -->
        <div class="medical-list-item__info">
          <span class="medical-list-item__title">{{ item.name }}</span>
          <span class="badge badge-sm badge-primary">Status</span>
          <span class="badge badge-sm badge-secondary">Type</span>
          <span class="text-sm text-muted"><i class="fa-solid fa-calendar"></i> {{ item.date }}</span>
        </div>
        
        <!-- Acciones: botones alineados a la derecha -->
        <div class="medical-list-item__actions">
          <button class="btn btn-ghost btn-xs" (click)="action()">
            <i class="fa-solid fa-icon"></i>
          </button>
        </div>
      </div>
      
      <!-- Meta (opcional): información adicional en 2da línea -->
      @if (item.notes || item.additionalInfo) {
        <div class="medical-list-item__meta">
          <span class="text-sm"><i class="fa-solid fa-info"></i> {{ item.notes }}</span>
          <span class="text-sm text-muted">{{ item.additionalInfo }}</span>
        </div>
      }
    </div>
  }
</div>
```

## Clases CSS Disponibles

### Contenedor
- `.medical-list` - Contenedor de la lista (flex column con gap)

### Item
- `.medical-list-item` - Card individual del item
- `.medical-list-item.--inactive` - Modificador para items inactivos/resueltos (opacity 0.6)

### Estructura interna
- `.medical-list-item__main` - Fila principal (flex horizontal)
- `.medical-list-item__info` - Zona de información (flex wrap, crece)
- `.medical-list-item__title` - Título del item (font-weight semibold)
- `.medical-list-item__actions` - Zona de botones (flex, no crece, estilos optimizados)
- `.medical-list-item__meta` - Fila secundaria opcional (metadata adicional)

### Botones en Actions
Los botones dentro de `.medical-list-item__actions` tienen estilos optimizados:
- **Tamaño:** 36x36px (cuadrados para iconos, auto-width para botones con texto)
- **Spacing:** `var(--spacing-xs)` entre botones
- **Hover:** Transform translateY(-1px) + background contextual
- **Variantes:**
  - `.btn.btn-ghost` - Transparente, hover con background sutil
  - `.btn.btn-ghost.btn-danger-text` - Rojo, hover con background error-50
  - `.btn.btn-ghost.btn-success-text` - Verde, hover con background success-50
  - `.btn.btn-primary` - Azul sólido con texto, padding horizontal automático

### Iconos especiales
- `.file-icon-inline` - Icono de archivo (32x32px, background primary-50, color primary-600)

## Estilos Globales

Los estilos están definidos en `src/styles/_components.scss` (líneas 2371-2454).

### Características:
- **Padding:** `var(--spacing-md) var(--spacing-lg)` (compacto vertical, cómodo horizontal)
- **Border:** `1px solid var(--border-primary)` con `border-radius: var(--radius-md)`
- **Hover:** Border color cambia a `var(--primary-200)` + sombra sutil
- **Transición:** `var(--transition-base)` para efectos suaves
- **Modificador `--inactive`:** Opacity 0.6 + background secundario

## Ejemplos de Uso

### 1. Alergias (Patient Detail)
```html
<div class="medical-list">
  @for (allergy of allergies(); track allergy.id) {
    <div class="medical-list-item" [class.--inactive]="!allergy.isActive">
      <div class="medical-list-item__main">
        <div class="medical-list-item__info">
          <span class="medical-list-item__title">{{ allergy.allergenName }}</span>
          <span class="badge badge-sm" [ngClass]="getSeverityClass(allergy.severity)">
            {{ getSeverityLabel(allergy.severity) }}
          </span>
          <span class="badge badge-sm badge-secondary">
            {{ getAllergenTypeLabel(allergy.allergenType) }}
          </span>
          @if (allergy.verifiedByProfessional) {
            <span class="badge badge-sm badge-success" title="Verificado">
              <i class="fa-solid fa-check-circle"></i>
            </span>
          }
        </div>
        @if (allergy.isActive) {
          <div class="medical-list-item__actions">
            <button class="btn btn-ghost btn-danger-text" 
                    title="Desactivar" 
                    (click)="deactivateAllergy(allergy)">
              <i class="fa-solid fa-ban"></i>
            </button>
          </div>
        }
      </div>
      @if (allergy.reactionDescription || allergy.notes) {
        <div class="medical-list-item__meta">
          @if (allergy.reactionDescription) {
            <span class="text-sm">
              <i class="fa-solid fa-notes-medical"></i> {{ allergy.reactionDescription }}
            </span>
          }
          @if (allergy.notes) {
            <span class="text-sm text-muted">{{ allergy.notes }}</span>
          }
        </div>
      }
    </div>
  }
</div>
```

### 2. Consentimientos Informados
```html
<div class="medical-list">
  @for (consent of consents(); track consent.id) {
    <div class="medical-list-item">
      <div class="medical-list-item__main">
        <div class="medical-list-item__info">
          <span class="medical-list-item__title">{{ consent.title }}</span>
          <span class="badge badge-sm" [ngClass]="getConsentStatusClass(consent.status)">
            {{ getConsentStatusLabel(consent.status) }}
          </span>
          @if (consent.signedAt) {
            <span class="text-sm text-muted">
              <i class="fa-solid fa-pen-nib"></i> {{ formatDate(consent.signedAt) }}
            </span>
          }
        </div>
        <div class="medical-list-item__actions">
          @if (consent.status === 'Pending') {
            <button class="btn btn-primary" (click)="signConsent(consent)">
              <i class="fa-solid fa-file-signature"></i> Firmar
            </button>
          }
          @if (consent.status === 'Signed') {
            <button class="btn btn-ghost" title="Imprimir" (click)="print(consent)">
              <i class="fa-solid fa-print"></i>
            </button>
          }
        </div>
      </div>
    </div>
  }
</div>
```

### 3. Diagnósticos
```html
<div class="medical-list">
  @for (diagnosis of diagnoses(); track diagnosis.id) {
    <div class="medical-list-item" [class.--inactive]="diagnosis.status !== 'Active'">
      <div class="medical-list-item__main">
        <div class="medical-list-item__info">
          <span class="medical-list-item__title">{{ diagnosis.description }}</span>
          <span class="badge badge-sm" [ngClass]="getDiagnosisStatusClass(diagnosis.status)">
            {{ getDiagnosisStatusLabel(diagnosis.status) }}
          </span>
          @if (diagnosis.cie10Code) {
            <span class="badge badge-sm badge-info">{{ diagnosis.cie10Code }}</span>
          }
          @if (diagnosis.linkedTreatmentsCount > 0) {
            <span class="badge badge-sm badge-primary">
              <i class="fa-solid fa-tooth"></i> {{ diagnosis.linkedTreatmentsCount }}
            </span>
          }
        </div>
        @if (diagnosis.status === 'Active') {
          <div class="medical-list-item__actions">
            <button class="btn btn-ghost btn-success-text" 
                    title="Marcar como resuelto" 
                    (click)="resolveDiagnosis(diagnosis)">
              <i class="fa-solid fa-check-circle"></i>
            </button>
          </div>
        }
      </div>
      @if (diagnosis.notes) {
        <div class="medical-list-item__meta">
          <span class="text-sm text-muted">{{ diagnosis.notes }}</span>
        </div>
      }
    </div>
  }
</div>
```

### 4. Archivos Adjuntos
```html
<div class="medical-list">
  @for (file of files(); track file.id) {
    <div class="medical-list-item">
      <div class="medical-list-item__main">
        <div class="medical-list-item__info">
          <span class="file-icon-inline">
            <i [class]="'fa-solid ' + getFileIcon(file.fileType)"></i>
          </span>
          <a class="medical-list-item__title" (click)="downloadFile(file)" style="cursor: pointer;">
            {{ file.fileName }}
          </a>
          @if (file.category) {
            <span class="badge badge-sm badge-secondary">{{ file.category }}</span>
          }
          <span class="text-sm text-muted">{{ formatFileSize(file.fileSize) }}</span>
          <span class="text-sm text-muted">
            <i class="fa-solid fa-calendar"></i> {{ formatDate(file.createdAt) }}
          </span>
        </div>
        <div class="medical-list-item__actions">
          <button class="btn btn-ghost" title="Descargar" (click)="downloadFile(file)">
            <i class="fa-solid fa-download"></i>
          </button>
          <button class="btn btn-ghost btn-danger-text" title="Eliminar" (click)="deleteFile(file.id)">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
      @if (file.description) {
        <div class="medical-list-item__meta">
          <span class="text-sm text-muted">{{ file.description }}</span>
        </div>
      }
    </div>
  }
</div>
```

**Nota:** Para archivos, se usa `.file-icon-inline` dentro de `__info` para mostrar el icono del tipo de archivo (32x32px con background primary-50).

## Buenas Prácticas

### ✅ DO
- Usar `.medical-list-item__title` para el nombre/título principal
- Agrupar badges relacionados juntos en `__info`
- Usar `badge-sm` para badges compactos
- Usar `text-sm` y `text-muted` para metadata secundaria
- Usar iconos de Font Awesome para contexto visual
- Aplicar `--inactive` para items desactivados/resueltos
- Mantener acciones en `__actions` (alineadas a la derecha)
- Usar `__meta` solo cuando hay información adicional relevante

### ❌ DON'T
- No usar padding/margin custom en items individuales
- No crear estilos específicos por tipo de lista (usar el estándar)
- No poner botones fuera de `__actions`
- No usar más de 2 líneas por item (main + meta opcional)
- No mezclar información crítica en `__meta` (debe ir en `__info`)

## Ventajas del Patrón

1. **Consistencia visual** - Todas las listas médicas se ven iguales
2. **Mantenibilidad** - Un solo lugar para actualizar estilos
3. **Compacto** - Máximo 2 líneas por item (vs 5+ líneas antes)
4. **Responsive** - Flex wrap automático en pantallas pequeñas
5. **Accesibilidad** - Estructura semántica clara
6. **Performance** - Menos CSS duplicado

## Migración de Listas Existentes

Para migrar una lista existente al patrón estándar:

1. **HTML:** Reemplazar clases específicas por `.medical-list-item` y sus modificadores
2. **SCSS:** Eliminar estilos locales específicos de la lista
3. **Verificar:** Compilar y probar visualmente

Ejemplo de migración:
```diff
- <div class="custom-list">
-   <div class="custom-card">
-     <div class="custom-header">
+ <div class="medical-list">
+   <div class="medical-list-item">
+     <div class="medical-list-item__main">
```

## Ubicación de Archivos

- **Estilos globales:** `src/styles/_components.scss` (líneas 2371-2454)
- **Documentación:** `docs/MEDICAL_LIST_PATTERN.md` (este archivo)
- **Ejemplos de uso:** `src/app/features/patients/components/patient-detail/`

## Historial

- **2026-03-06:** Creación del patrón estándar basado en diseño de diagnósticos
- **2026-03-06:** Migración de allergies, consents, diagnoses en patient-detail
- **2026-03-06:** Mejoras en botones de acciones (36x36px, hover mejorado, variantes contextuales)
- **2026-03-06:** Migración de archivos adjuntos (files) con .file-icon-inline
