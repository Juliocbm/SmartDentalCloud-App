/**
 * Modelos compartidos para componentes de Charts
 */

/** Item de datos para Pie/Doughnut/Bar charts */
export interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
}

/** Dataset para Line charts */
export interface LineDataset {
  label: string;
  data: number[];
  color?: string;
  fill?: boolean;
}

/** Configuración común de charts */
export interface ChartConfig {
  title?: string;
  showLegend?: boolean;
  height?: string;
  animate?: boolean;
}
