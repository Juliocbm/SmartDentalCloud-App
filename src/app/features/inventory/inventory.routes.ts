import { Routes } from '@angular/router';

/**
 * Rutas del módulo de inventario
 */
export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/inventory-dashboard/inventory-dashboard').then(m => m.InventoryDashboardComponent)
  },
  {
    path: 'products',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/product-list/product-list').then(m => m.ProductListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./components/product-form/product-form').then(m => m.ProductFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./components/product-list/product-list').then(m => m.ProductListComponent)
        // TODO: Crear product-detail component
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/product-form/product-form').then(m => m.ProductFormComponent)
      }
    ]
  },
  {
    path: 'categories',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/category-list/category-list').then(m => m.CategoryListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./components/category-form/category-form').then(m => m.CategoryFormComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/category-form/category-form').then(m => m.CategoryFormComponent)
      }
    ]
  },
  {
    path: 'alerts',
    loadComponent: () => import('./components/stock-alerts/stock-alerts').then(m => m.StockAlertsComponent)
  },
  {
    path: 'suppliers',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/supplier-list/supplier-list').then(m => m.SupplierListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./components/supplier-form/supplier-form').then(m => m.SupplierFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./components/supplier-list/supplier-list').then(m => m.SupplierListComponent)
        // TODO: Crear supplier-detail component
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/supplier-form/supplier-form').then(m => m.SupplierFormComponent)
      }
    ]
  },
  {
    path: 'purchase-orders',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/purchase-order-list/purchase-order-list').then(m => m.PurchaseOrderListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./components/purchase-order-form/purchase-order-form').then(m => m.PurchaseOrderFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./components/purchase-order-list/purchase-order-list').then(m => m.PurchaseOrderListComponent)
        // TODO: Crear purchase-order-detail component
      },
      {
        path: ':id/receive',
        loadComponent: () => import('./components/purchase-order-form/purchase-order-form').then(m => m.PurchaseOrderFormComponent)
        // TODO: Crear purchase-order-receive component
      }
    ]
  }
];
