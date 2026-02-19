import { Routes } from '@angular/router';
import { InvoicesService } from './services/invoices.service';

export const INVOICES_ROUTES: Routes = [
  {
    path: '',
    providers: [InvoicesService],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/invoices-dashboard/invoices-dashboard').then(m => m.InvoicesDashboardComponent),
        title: 'Facturación'
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./components/invoice-list/invoice-list').then(m => m.InvoiceListComponent),
        title: 'Facturas'
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/invoice-form/invoice-form').then(m => m.InvoiceFormComponent),
        title: 'Nueva Factura'
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/invoice-detail/invoice-detail').then(m => m.InvoiceDetailComponent),
        title: 'Detalle de Factura'
      }
    ]
  }
];
