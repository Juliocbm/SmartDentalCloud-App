import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Chart.js registration is deferred — loaded lazily via chart components
// See: src/app/shared/components/charts/chart-register.ts

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
