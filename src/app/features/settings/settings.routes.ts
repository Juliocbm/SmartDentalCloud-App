import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/settings-page/settings-page').then(m => m.SettingsPageComponent),
    title: 'Configuración'
  },
  {
    path: 'locations/:id',
    loadComponent: () => import('./components/location-detail/location-detail').then(m => m.LocationDetailComponent),
    title: 'Detalle de Sucursal'
  }
];
