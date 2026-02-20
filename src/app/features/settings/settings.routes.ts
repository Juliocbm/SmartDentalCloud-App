import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/settings-page/settings-page').then(m => m.SettingsPageComponent),
    title: 'Configuración'
  }
];
