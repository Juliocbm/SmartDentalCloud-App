# Módulo de Inventario - Plan de Implementación

## Fase 1: Core de Productos

### Estructura del Módulo
```
src/app/features/inventory/
├── inventory.routes.ts
├── components/
│   ├── product-list/
│   │   ├── product-list.ts
│   │   ├── product-list.html
│   │   └── product-list.scss
│   └── product-form/
│       ├── product-form.ts
│       ├── product-form.html
│       └── product-form.scss
├── models/
│   ├── product.models.ts
│   └── category.models.ts
└── services/
    ├── products.service.ts
    └── categories.service.ts
```

---

## Checklist de Implementación

### 1. Estructura Base
- [x] Crear carpeta `inventory` en features
- [x] Crear `models/product.models.ts`
- [x] Crear `models/category.models.ts`
- [x] Crear `services/products.service.ts`
- [x] Crear `services/categories.service.ts`

### 2. Componente Product-List
- [x] Crear `product-list.ts` (signals, filtros client-side, debounce)
- [x] Crear `product-list.html` (filtros, tabla, footer homologado)
- [x] Crear `product-list.scss` (estilos locales mínimos)

### 3. Componente Product-Form
- [x] Crear `product-form.ts` (reactive forms, validaciones)
- [x] Crear `product-form.html` (formulario completo)
- [x] Crear `product-form.scss` (estilos locales mínimos)

### 4. Configuración de Rutas
- [x] Crear `inventory.routes.ts`
- [x] Integrar en `app.routes.ts`
- [x] Agregar enlace en menú de navegación

---

## Decisiones Técnicas

| Aspecto | Decisión |
|---------|----------|
| **Paginación** | Client-side (cientos de productos) |
| **Proveedores** | Submódulo de inventario |
| **Estándares** | Signals, estilos globales, footer homologado |
| **Filtros** | Búsqueda + Categoría + Estado |

---

## Endpoints Backend Utilizados

### Products (`/api/products`)
- `GET /` - Listar productos
- `GET /{id}` - Obtener producto
- `POST /` - Crear producto
- `PUT /{id}` - Actualizar producto
- `DELETE /{id}` - Eliminar producto

### Categories (`/api/categories`)
- `GET /` - Listar categorías

---

## Campos del Producto

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| code | string | ✓ | Código único |
| name | string | ✓ | Nombre del producto |
| description | string | - | Descripción |
| categoryId | guid | - | ID de categoría |
| unit | string | ✓ | Unidad (pz, ml, caja) |
| minStock | decimal | ✓ | Stock mínimo |
| maxStock | decimal | - | Stock máximo |
| reorderPoint | decimal | ✓ | Punto de reorden |
| reorderQuantity | decimal | ✓ | Cantidad a reordenar |
| unitCost | decimal | ✓ | Costo unitario |
| isActive | boolean | ✓ | Estado activo |
| notes | string | - | Notas adicionales |

---

---

## Fase 2: Categorías (COMPLETADA)

### Componentes Implementados
- [x] category-list component (listado con filtros)
- [x] category-form component (crear/editar)
- [x] Rutas integradas en inventory.routes.ts
- [x] Soporte para subcategorías (parentCategoryId)

### Estructura
```
src/app/features/inventory/
├── components/
│   ├── category-list/
│   │   ├── category-list.ts
│   │   ├── category-list.html
│   │   └── category-list.scss
│   └── category-form/
│       ├── category-form.ts
│       ├── category-form.html
│       └── category-form.scss
```

---

## Fase 3: Stock y Alertas (EN PROGRESO)

### Componentes Implementados
- [x] stock.models.ts (interfaces para Stock, StockAlert, StockMovement)
- [x] stock.service.ts (servicio para alertas y ajustes)
- [x] stock-alerts component (dashboard de productos con stock bajo)
- [x] Rutas integradas en inventory.routes.ts

### Estructura
```
src/app/features/inventory/
├── models/
│   └── stock.models.ts
├── services/
│   └── stock.service.ts
└── components/
    └── stock-alerts/
        ├── stock-alerts.ts
        ├── stock-alerts.html
        └── stock-alerts.scss
```

### Endpoints Backend
- `GET /api/stock/alerts` - Obtiene productos con stock bajo
- `POST /api/stock/adjust` - Ajusta stock manualmente
- `GET /api/stock/movements` - Historial de movimientos

### Stock Adjustment Modal (COMPLETADO)
- [x] ModalService en shared/services (patrón reutilizable)
- [x] ModalComponent base en shared/components
- [x] Estilos globales de modal en _components.scss
- [x] StockAdjustmentModal específico para ajustes
- [x] Integración en stock-alerts
- [x] Integración en layout para ViewContainerRef

### Pospuesto
- [ ] stock-movements component (requiere endpoint backend)

---

## Fase 4: Proveedores y Órdenes de Compra (COMPLETADA)

### Componentes Implementados
- [x] supplier.models.ts y purchase-order.models.ts (interfaces y tipos)
- [x] suppliers.service.ts (servicio para CRUD de proveedores)
- [x] purchase-orders.service.ts (servicio para gestión de órdenes)
- [x] supplier-list component (listado con filtros y búsqueda)
- [x] supplier-form component (crear/editar proveedores)
- [x] purchase-order-list component (listado de órdenes con estados)
- [x] purchase-order-form component (crear órdenes con FormArray de items)
- [x] Rutas integradas en inventory.routes.ts
- [x] Menú actualizado en sidebar con Proveedores y Órdenes de Compra

### Estructura
```
src/app/features/inventory/
├── models/
│   ├── supplier.models.ts
│   └── purchase-order.models.ts
├── services/
│   ├── suppliers.service.ts
│   └── purchase-orders.service.ts
└── components/
    ├── supplier-list/
    │   ├── supplier-list.ts
    │   ├── supplier-list.html
    │   └── supplier-list.scss
    ├── supplier-form/
    │   ├── supplier-form.ts
    │   ├── supplier-form.html
    │   └── supplier-form.scss
    ├── purchase-order-list/
    │   ├── purchase-order-list.ts
    │   ├── purchase-order-list.html
    │   └── purchase-order-list.scss
    └── purchase-order-form/
        ├── purchase-order-form.ts
        ├── purchase-order-form.html
        └── purchase-order-form.scss
```

### Características Implementadas

#### Proveedores
- Listado con búsqueda por código, nombre, contacto, email, teléfono
- Filtro por estado (activo/inactivo)
- Formulario con validaciones para crear/editar
- Campos: código, nombre, contacto, email, teléfono, dirección, RFC, condiciones de pago
- Estados visuales y badges
- Integración completa con backend

#### Órdenes de Compra
- Listado con búsqueda por número de orden y proveedor
- Filtro por estado (pendiente, parcial, recibida, cancelada)
- Formulario dinámico con FormArray para agregar múltiples productos
- Cálculo automático de subtotales, IVA y total
- Auto-completado de costo unitario al seleccionar producto
- Validaciones en cada item
- Estados visuales con badges (warning, info, success, error)
- Formato de moneda y fechas

### Endpoints Backend
- `GET /api/suppliers` - Listar proveedores
- `POST /api/suppliers` - Crear proveedor
- `PUT /api/suppliers/{id}` - Actualizar proveedor
- `DELETE /api/suppliers/{id}` - Eliminar proveedor
- `GET /api/purchase-orders` - Listar órdenes
- `POST /api/purchase-orders` - Crear orden
- `POST /api/purchase-orders/{id}/receive` - Recibir mercancía

---

## 📊 Estado General del Módulo

### Fases Completadas: 4 de 4 (100%)

| Fase | Estado | Componentes |
|------|--------|-------------|
| Fase 1: Core de Productos | ✅ Completada | product-list, product-form |
| Fase 2: Categorías | ✅ Completada | category-list, category-form |
| Fase 3: Stock y Alertas | ✅ Completada | stock-alerts, stock-adjustment-modal |
| Fase 4: Proveedores y Órdenes | ✅ Completada | supplier-list, supplier-form, purchase-order-list, purchase-order-form |

### Funcionalidades Clave
- ✅ Gestión completa de productos y categorías
- ✅ Control de stock con alertas automáticas
- ✅ Ajustes manuales de stock con trazabilidad (StockMovement)
- ✅ Gestión de proveedores
- ✅ Creación y seguimiento de órdenes de compra
- ✅ Integración completa con backend CQRS
- ✅ Uso de variables globales CSS
- ✅ Arquitectura modular y escalable
- ✅ Componentes con signals y reactive forms
- ✅ Búsquedas con debounce
- ✅ Estados visuales consistentes

---

## Fases Futuras (Opcional)

### Mejoras Pendientes
- [ ] purchase-order-detail component (visualización detallada)
- [ ] purchase-order-receive component (recepción de mercancía específica)
- [ ] supplier-detail component (vista detallada del proveedor)
- [ ] stock-movements component (historial de movimientos - requiere endpoint backend)
