import { Routes } from '@angular/router';

/**
 * Rutas del módulo de inventario
 */
export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full'
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
    path: 'stock',
    children: [
      {
        path: 'alerts',
        loadComponent: () => import('./components/stock-alerts/stock-alerts').then(m => m.StockAlertsComponent)
      }
    ]
  }
  // TODO: Agregar rutas para suppliers, purchase-orders
];
