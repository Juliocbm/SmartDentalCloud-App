export interface WidgetDefinition {
  id: string;
  label: string;
  icon: string;
  defaultVisible: boolean;
  permission?: string;
  feature?: string;
  reorderable?: boolean;
  group?: string;
}

export interface DashboardWidgetConfig {
  dashboardId: string;
  widgets: WidgetDefinition[];
}

export type DashboardPreferencesData = Record<string, Record<string, boolean>>;

export type DashboardOrderData = Record<string, string[]>;

export type LayoutPreset = 'compact' | 'balanced' | 'detailed';
