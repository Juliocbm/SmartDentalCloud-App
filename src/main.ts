import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Registrar componentes de Chart.js
import './app/shared/components/charts/chart-register';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
