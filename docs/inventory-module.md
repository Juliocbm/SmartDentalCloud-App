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

### Pendiente en Fase 3
- [ ] stock-adjustment modal/dialog component
- [ ] stock-movements component (historial detallado)

---

## Fases Futuras

### Fase 4: Proveedores y Órdenes
- [ ] supplier-list component
- [ ] supplier-form component
- [ ] purchase-order-list component
- [ ] purchase-order-form component
