import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/auth.guard';
import { PERMISSIONS } from '../../core/services/permission.service';
import { InvoicesService } from './services/invoices.service';
import { TreatmentPlansService } from '../treatment-plans/services/treatment-plans.service';

export const INVOICES_ROUTES: Routes = [
  {
    path: '',
    providers: [InvoicesService, TreatmentPlansService],
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
        path: 'cfdi',
        loadComponent: () =>
          import('./components/cfdi-list/cfdi-list').then(m => m.CfdiListComponent),
        title: 'Comprobantes CFDI'
      },
      {
        path: 'pending-billing',
        loadComponent: () =>
          import('./components/pending-billing/pending-billing').then(m => m.PendingBillingComponent),
        title: 'Pendientes de Facturar'
      },
      {
        path: 'new',
        canActivate: [permissionGuard(PERMISSIONS.InvoicesCreate)],
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
