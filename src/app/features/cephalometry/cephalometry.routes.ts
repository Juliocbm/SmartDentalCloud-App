import { Routes } from '@angular/router';

export const CEPHALOMETRY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/cephalometry-page/cephalometry-page').then(m => m.CephalometryPageComponent),
    title: 'Cefalometría'
  }
];
