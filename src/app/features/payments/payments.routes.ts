import { Routes } from '@angular/router';
import { PaymentsService } from './services/payments.service';

export const PAYMENTS_ROUTES: Routes = [
  {
    path: '',
    providers: [PaymentsService],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/payment-list/payment-list').then(m => m.PaymentListComponent),
        title: 'Pagos'
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/payment-form/payment-form').then(m => m.PaymentFormComponent),
        title: 'Registrar Pago'
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/payment-detail/payment-detail').then(m => m.PaymentDetailComponent),
        title: 'Detalle de Pago'
      }
    ]
  }
];
