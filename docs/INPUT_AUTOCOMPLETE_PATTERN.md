# Patrón de Input Autocomplete

## Índice
1. [Descripción General](#descripción-general)
2. [Componentes Implementados](#componentes-implementados)
3. [Arquitectura del Componente](#arquitectura-del-componente)
4. [Guía de Implementación](#guía-de-implementación)
5. [Diferencias entre Variantes](#diferencias-entre-variantes)
6. [Preselección de Valores](#preselección-de-valores)
7. [Best Practices](#best-practices)

---

## Descripción General

El **Patrón de Input Autocomplete** reemplaza los `<select>` nativos con un componente de búsqueda interactivo que permite al usuario escribir para filtrar opciones y seleccionar un resultado del dropdown.

### Problema que Resuelve

**❌ Antes (select nativo):**
- No escalable con muchos registros
- Sin búsqueda/filtrado
- Problemas de timing al preseleccionar valores (el `<select>` se destruye/recrea con `@if (loading())`)
- UX inconsistente entre campos similares

**✅ Ahora (autocomplete):**
- Búsqueda por texto en tiempo real
- Escalable para cualquier cantidad de registros
- Preselección confiable vía `ngOnChanges` (el `<input>` siempre está en el DOM)
- UX consistente entre pacientes, dentistas, etc.

---

## Componentes Implementados

| Componente | Ubicación | Fuente de Datos | Comportamiento on Focus |
|---|---|---|---|
| `PatientAutocompleteComponent` | `shared/components/patient-autocomplete/` | API search (server-side) | No muestra resultados hasta escribir |
| `DentistAutocompleteComponent` | `shared/components/dentist-autocomplete/` | Precarga completa (client-side filter) | Muestra todos los dentistas |
| `SupplierAutocompleteComponent` | `shared/components/supplier-autocomplete/` | Precarga completa (client-side filter) | Muestra todos los proveedores |
| `LocationAutocompleteComponent` | `shared/components/location-autocomplete/` | Precarga completa (client-side filter) | Muestra todas las sucursales |
| `ServiceAutocompleteComponent` | `shared/components/service-autocomplete/` | API search (server-side) | No muestra resultados hasta escribir |

### ¿Por qué la diferencia en Focus?

- **Pacientes/Servicios:** Pueden ser cientos/miles → buscar en servidor, mostrar solo al escribir
- **Dentistas/Proveedores/Sucursales:** Lista pequeña (< 50 típicamente) → precargar todos, mostrar al hacer focus para selección rápida

---

## Arquitectura del Componente

```
┌─────────────────────────────────────────────────┐
│              Autocomplete Component              │
├─────────────────────────────────────────────────┤
│                                                  │
│  @Input()  selectedId: string | null             │
│  @Input()  selectedName: string | null           │
│  @Input()  placeholder, required, disabled       │
│  @Input()  error: string | null                  │
│                                                  │
│  @Output() itemSelected: EventEmitter<T | null>  │
│                                                  │
│  Interno:                                        │
│  - searchControl: FormControl (texto del input)  │
│  - selectedItem: signal<T | null>                │
│  - filteredItems / results: signal<T[]>          │
│  - loading: signal<boolean>                      │
│  - showDropdown: signal<boolean>                 │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Estados del Input

```
┌─────────────────────┐
│  🔍 Búsqueda        │  → Ícono lupa, placeholder visible
│     (sin selección)  │
├─────────────────────┤
│  ⏳ Cargando         │  → Spinner animado
│                      │
├─────────────────────┤
│  ✅ Seleccionado     │  → Borde verde, fondo success-50,
│     (con valor)      │    botón ✕ para limpiar
├─────────────────────┤
│  ❌ Error            │  → Borde rojo, mensaje debajo
│                      │
└─────────────────────┘
```

---

## Guía de Implementación

### Estructura de Archivos

```
shared/components/{entity}-autocomplete/
├── {entity}-autocomplete.ts       ← Componente
├── {entity}-autocomplete.html     ← Template
├── {entity}-autocomplete.scss     ← Estilos
└── {entity}-autocomplete.spec.ts  ← Tests (opcional)
```

### TypeScript — Variante Server-Side (tipo Paciente)

```typescript
@Component({
  selector: 'app-{entity}-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './{entity}-autocomplete.html',
  styleUrl: './{entity}-autocomplete.scss'
})
export class EntityAutocompleteComponent implements OnChanges {
  private entityService = inject(EntityService);

  @Input() selectedEntityId: string | null = null;
  @Input() selectedEntityName: string | null = null;
  @Input() placeholder = 'Buscar...';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error: string | null = null;

  @Output() entitySelected = new EventEmitter<EntityResult | null>();

  searchControl = new FormControl('');
  results = signal<EntityResult[]>([]);
  loading = signal(false);
  showDropdown = signal(false);
  selectedEntity = signal<EntityResult | null>(null);

  // Preselección vía ngOnChanges
  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedEntityId'] && this.selectedEntityId && this.selectedEntityName) {
      this.selectedEntity.set({
        id: this.selectedEntityId,
        name: this.selectedEntityName
      });
      this.searchControl.setValue(this.selectedEntityName, { emitEvent: false });
    }
  }

  constructor() {
    // Búsqueda reactiva con debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(search => {
          if (!search || search.length < 2) {
            this.results.set([]);
            return of([]);
          }
          this.loading.set(true);
          return this.entityService.search({ search, limit: 10 });
        })
      )
      .subscribe({
        next: (results) => {
          this.results.set(results);
          this.loading.set(false);
          this.showDropdown.set(results.length > 0);
        },
        error: () => {
          this.loading.set(false);
          this.results.set([]);
        }
      });
  }

  selectEntity(entity: EntityResult): void { ... }
  clearSelection(): void { ... }
  onFocus(): void { /* Solo mostrar si hay resultados previos */ }
  onBlur(): void { setTimeout(() => this.showDropdown.set(false), 200); }
}
```

### TypeScript — Variante Client-Side (tipo Dentista)

```typescript
export class DentistAutocompleteComponent implements OnChanges {
  // ... mismos @Input/@Output ...

  allDentists = signal<DentistListItem[]>([]);      // Lista completa
  filteredDentists = signal<DentistListItem[]>([]);  // Filtrada

  constructor() {
    this.loadDentists();  // Precarga una sola vez

    this.searchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(search => {
        if (!search || search.length < 1) {
          this.filteredDentists.set([]);
          this.showDropdown.set(false);
          return;
        }
        const term = search.toLowerCase();
        const filtered = this.allDentists().filter(d =>
          d.name.toLowerCase().includes(term) ||
          (d.specialization && d.specialization.toLowerCase().includes(term))
        );
        this.filteredDentists.set(filtered);
        this.showDropdown.set(filtered.length > 0);
      });
  }

  onFocus(): void {
    // Mostrar TODOS al hacer focus (lista pequeña)
    if (!this.selectedDentist()) {
      this.filteredDentists.set(this.allDentists());
      this.showDropdown.set(this.allDentists().length > 0);
    }
  }
}
```

### HTML Template (común)

```html
<div class="autocomplete-container">
  <label class="autocomplete-label">
    <ng-content></ng-content>
    @if (required) { <span class="required">*</span> }
  </label>

  <div class="autocomplete-input-wrapper">
    <input
      type="text"
      [formControl]="searchControl"
      [placeholder]="placeholder"
      [disabled]="disabled"
      (focus)="onFocus()"
      (blur)="onBlur()"
      class="autocomplete-input"
      [class.error]="error"
      [class.has-value]="selectedEntity()"
    />

    <!-- Íconos de estado -->
    @if (loading()) {
      <i class="fa-solid fa-spinner fa-spin autocomplete-icon"></i>
    } @else if (selectedEntity()) {
      <button type="button" (click)="clearSelection()" class="autocomplete-clear">
        <i class="fa-solid fa-times"></i>
      </button>
    } @else {
      <i class="fa-solid fa-search autocomplete-icon"></i>
    }

    <!-- Dropdown de resultados -->
    @if (showDropdown() && results().length > 0) {
      <div class="autocomplete-dropdown">
        @for (item of results(); track item.id) {
          <button type="button" class="autocomplete-item" (click)="selectEntity(item)">
            <!-- Contenido específico de la entidad -->
          </button>
        }
      </div>
    }

    <!-- Estado vacío -->
    @if (showDropdown() && !loading() && results().length === 0 && searchControl.value) {
      <div class="autocomplete-dropdown">
        <div class="autocomplete-empty">
          <i class="fa-solid fa-magnifying-glass"></i>
          <span>No se encontraron resultados</span>
        </div>
      </div>
    }
  </div>

  @if (error) {
    <span class="error-message">{{ error }}</span>
  }
</div>
```

### SCSS (compartido)

Todos los autocompletes usan las **variables globales de input sizing** definidas en `_variables.scss`:

```scss
padding: var(--input-padding-y) var(--input-padding-x);  // 8px 14px
font-size: var(--input-font-size);                        // 13px
line-height: var(--input-line-height);                    // 1.2
```

Clases clave:

| Clase | Propósito |
|---|---|
| `.autocomplete-container` | Wrapper con flex column |
| `.autocomplete-input` | Input con padding-right para ícono |
| `.autocomplete-input.has-value` | Borde verde + fondo success cuando hay selección |
| `.autocomplete-input.error` | Borde rojo para errores de validación |
| `.autocomplete-clear` | Botón ✕ para limpiar selección |
| `.autocomplete-dropdown` | Dropdown absoluto con sombra y animación slideDown |
| `.autocomplete-item` | Botón de resultado con hover primary-50 |
| `.autocomplete-empty` | Estado sin resultados |

---

## Diferencias entre Variantes

| Aspecto | Paciente (Server-Side) | Dentista (Client-Side) |
|---|---|---|
| **Carga de datos** | API search por request | Precarga total al init |
| **Filtrado** | En servidor (`searchSimple`) | En cliente (`Array.filter`) |
| **Debounce** | 300ms | 200ms |
| **Mín. caracteres** | 2 | 1 |
| **On Focus vacío** | No muestra nada | Muestra todos |
| **Escalabilidad** | Ilimitada | < 100 registros ideal |
| **Requests HTTP** | Uno por búsqueda | Uno al inicializar |

### ¿Cuándo usar cada variante?

- **Server-Side:** Entidades con potencialmente muchos registros (pacientes, productos, etc.)
- **Client-Side:** Entidades con lista pequeña y estable (dentistas, sucursales, roles, etc.)

---

## Preselección de Valores

La preselección se maneja vía `@Input()` + `ngOnChanges`:

```typescript
// Padre (appointment-form)
<app-dentist-autocomplete
  [selectedDentistId]="selectedDentist()?.id || null"
  [selectedDentistName]="selectedDentist()?.name || null"
  [required]="true"
  (dentistSelected)="onDentistSelected($event)"
>
  Buscar Dentista
</app-dentist-autocomplete>
```

```typescript
// Hijo (dentist-autocomplete)
ngOnChanges(changes: SimpleChanges) {
  if (changes['selectedDentistId'] && this.selectedDentistId && this.selectedDentistName) {
    this.selectedDentist.set({ id: this.selectedDentistId, name: this.selectedDentistName });
    this.searchControl.setValue(this.selectedDentistName, { emitEvent: false });
  }
}
```

**Clave:** Se requieren AMBOS inputs (`Id` y `Name`) para que la preselección funcione. El `Name` es necesario para mostrar texto en el input sin hacer un request adicional.

---

## Best Practices

### 1. Siempre pasar `{ emitEvent: false }` al preseleccionar

```typescript
// ✅ Correcto — No dispara búsqueda innecesaria
this.searchControl.setValue(name, { emitEvent: false });

// ❌ Incorrecto — Dispara el pipeline de búsqueda
this.searchControl.setValue(name);
```

### 2. Usar `setTimeout` en `onBlur` para permitir clicks en dropdown

```typescript
// ✅ Correcto — Da tiempo al click event del dropdown
onBlur(): void {
  setTimeout(() => this.showDropdown.set(false), 200);
}

// ❌ Incorrecto — Cierra dropdown antes del click
onBlur(): void {
  this.showDropdown.set(false);
}
```

### 3. Usar `type="button"` en items del dropdown

```html
<!-- ✅ Correcto — No submite formularios padre -->
<button type="button" class="autocomplete-item" (click)="select(item)">

<!-- ❌ Incorrecto — Puede submitir un form padre -->
<button class="autocomplete-item" (click)="select(item)">
```

### 4. Content projection para label

```html
<!-- ✅ Correcto — Flexible y consistente -->
<app-dentist-autocomplete>
  Buscar Dentista
</app-dentist-autocomplete>

<!-- El componente usa <ng-content> en la label -->
<label class="autocomplete-label">
  <ng-content></ng-content>
</label>
```

### 5. Indicador visual de selección

El input cambia de estilo cuando hay un valor seleccionado:
- Borde: `var(--success-500)`
- Fondo: `var(--success-50)`
- Ícono: ✕ para limpiar (en lugar de 🔍)

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0  
**Autor:** SmartDental Development Team
