/**
 * Registro de componentes Chart.js
 * Este archivo debe importarse en main.ts o app.config.ts
 */
import {
  Chart,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  PieController,
  BarController,
  LineController
} from 'chart.js';

// Registrar todos los elementos necesarios
Chart.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  PieController,
  BarController,
  LineController
);

export { Chart };
