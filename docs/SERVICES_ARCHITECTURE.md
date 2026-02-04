# Servicios Globales de la Aplicación

## AlertsCountService

### Propósito
Servicio global singleton que gestiona el contador de alertas de stock en tiempo real.

### Características
- **Auto-refresh**: Se actualiza automáticamente cada 5 minutos
- **Reactive**: Expone signals que se actualizan automáticamente
- **Eficiente**: Una sola fuente de verdad para todas las vistas

### API

```typescript
@Injectable({ providedIn: 'root' })
export class AlertsCountService {
  // Signals públicos (read-only)
  totalAlerts: Signal<number>;       // Total de alertas
  criticalAlerts: Signal<number>;    // Solo críticas
  warningAlerts: Signal<number>;     // Solo advertencias

  // Métodos
  refresh(): void;  // Refresco manual
}
```

### Uso

```typescript
export class MyComponent {
  private alertsService = inject(AlertsCountService);

  // En template
  alertsCount = this.alertsService.totalAlerts;
}
```

```html
<span class="badge">{{ alertsCount() }}</span>
```

### Criterios de Alertas

- **Críticas**: `currentStock <= minStock`
- **Advertencias**: `minStock < currentStock <= reorderPoint`

---

## SidebarStateService

### Propósito
Gestiona y persiste el estado del sidebar entre sesiones usando localStorage.

### Características
- **Persistencia**: Guarda estado automáticamente en localStorage
- **Reactive**: Usa signals para reactividad
- **Type-safe**: Interfaces tipadas para el estado

### API

```typescript
@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  // Signals públicos
  collapsed: WritableSignal<boolean>;
  expandedMenus: WritableSignal<string[]>;

  // Métodos
  toggleCollapsed(): void;
  setCollapsed(collapsed: boolean): void;
  toggleMenuExpansion(menuId: string): void;
  isMenuExpanded(menuId: string): boolean;
  reset(): void;
}
```

### Uso

```typescript
export class SidebarComponent {
  private sidebarState = inject(SidebarStateService);

  collapsed = this.sidebarState.collapsed;

  toggle() {
    this.sidebarState.toggleCollapsed();
  }
}
```

### Storage

**Key:** `sidebar-state`

**Estructura:**
```typescript
{
  collapsed: boolean;
  expandedMenus: string[];
}
```

---

## Ventajas de esta Arquitectura

### 1. Reutilización
```typescript
// ✅ Múltiples componentes usan el mismo servicio
// dashboard, sidebar, header badge, etc.
```

### 2. Performance
```typescript
// ✅ Una sola llamada al backend cada 5 minutos
// ✅ Todos los componentes se actualizan automáticamente
```

### 3. Mantenibilidad
```typescript
// ✅ Lógica centralizada en un lugar
// ✅ Fácil de testear y modificar
```

### 4. Consistencia
```typescript
// ✅ Todos ven los mismos datos
// ✅ No hay desincronización
```

---

## Best Practices

### ✅ DO

```typescript
// Inyectar servicio y usar signals
export class MyComponent {
  private alertsService = inject(AlertsCountService);
  count = this.alertsService.totalAlerts;
}
```

### ❌ DON'T

```typescript
// NO calcular alertas localmente
export class MyComponent {
  calculateAlerts() {
    // ❌ Duplica lógica
    // ❌ No sincroniza con otros componentes
  }
}
```

---

## Extensibilidad

### Agregar Nuevos Tipos de Alertas

```typescript
// En AlertsCountService
private lowStockCount = signal(0);

lowStockAlerts = computed(() => this.lowStockCount());

private calculateAlerts(products: any[]): void {
  // ... existing code
  
  const lowStock = products.filter(p => 
    p.currentStock > p.reorderPoint &&
    p.currentStock <= p.maxStock * 0.3
  ).length;
  
  this.lowStockCount.set(lowStock);
}
```

### Agregar Más Estados Persistentes

```typescript
// En SidebarStateService
interface SidebarState {
  collapsed: boolean;
  expandedMenus: string[];
  theme: 'light' | 'dark';  // ✅ Nuevo estado
}
```

---

## Testing

### AlertsCountService

```typescript
describe('AlertsCountService', () => {
  it('should calculate critical alerts correctly', () => {
    const service = TestBed.inject(AlertsCountService);
    // Test implementation
  });
});
```

### SidebarStateService

```typescript
describe('SidebarStateService', () => {
  it('should persist state to localStorage', () => {
    const service = TestBed.inject(SidebarStateService);
    service.setCollapsed(true);
    expect(localStorage.getItem('sidebar-state')).toContain('collapsed":true');
  });
});
```
