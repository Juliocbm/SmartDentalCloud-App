import { Injectable, inject, signal } from '@angular/core';
import { PermissionService } from './permission.service';
import { FeatureService, PlanFeature } from './feature.service';
import { DashboardWidgetConfig, DashboardPreferencesData, DashboardOrderData, WidgetDefinition, LayoutPreset } from '../models/dashboard-preferences.models';

@Injectable({ providedIn: 'root' })
export class DashboardPreferencesService {
  private readonly STORAGE_KEY = 'smartdental-dashboard-prefs';
  private readonly LAYOUT_KEY = 'smartdental-dashboard-layout';
  private readonly ORDER_KEY = 'smartdental-dashboard-order';
  private readonly permissionService = inject(PermissionService);
  private readonly featureService = inject(FeatureService);

  private readonly preferences = signal<DashboardPreferencesData>(this.load());
  private readonly layout = signal<LayoutPreset>(this.loadLayout());
  private readonly order = signal<DashboardOrderData>(this.loadOrder());

  isVisible(dashboardId: string, widgetId: string): boolean {
    const dashPrefs = this.preferences()[dashboardId];
    if (!dashPrefs || dashPrefs[widgetId] === undefined) {
      return true;
    }
    return dashPrefs[widgetId];
  }

  toggle(dashboardId: string, widgetId: string): void {
    const current = this.isVisible(dashboardId, widgetId);
    this.preferences.update(prefs => ({
      ...prefs,
      [dashboardId]: {
        ...prefs[dashboardId],
        [widgetId]: !current
      }
    }));
    this.save();
  }

  getAvailableWidgets(config: DashboardWidgetConfig): WidgetDefinition[] {
    return config.widgets.filter(w => {
      if (w.permission && !this.permissionService.hasPermission(w.permission)) {
        return false;
      }
      if (w.feature && !this.featureService.hasFeature(w.feature as PlanFeature)) {
        return false;
      }
      return true;
    });
  }

  getOrderedVisibleWidgets(dashboardId: string, config: DashboardWidgetConfig, group?: string): string[] {
    const ordered = this.getOrderedWidgetIds(dashboardId, config, group);
    return ordered.filter(id => this.isVisible(dashboardId, id));
  }

  getOrderedWidgetIds(dashboardId: string, config: DashboardWidgetConfig, group?: string): string[] {
    const targetGroup = group || 'default';
    const reorderableWidgets = config.widgets.filter(w =>
      w.reorderable !== false && (w.group || 'default') === targetGroup
    );
    const defaultOrder = reorderableWidgets.map(w => w.id);
    const savedOrder = this.order()[dashboardId] || [];

    const validSaved = savedOrder.filter(id => defaultOrder.includes(id));
    const newIds = defaultOrder.filter(id => !validSaved.includes(id));
    return [...validSaved, ...newIds];
  }

  setWidgetOrder(dashboardId: string, orderedIds: string[]): void {
    this.order.update(o => ({ ...o, [dashboardId]: orderedIds }));
    this.saveOrder();
  }

  resetDashboard(dashboardId: string, config: DashboardWidgetConfig): void {
    const defaults: Record<string, boolean> = {};
    config.widgets.forEach(w => defaults[w.id] = w.defaultVisible);
    this.preferences.update(prefs => ({
      ...prefs,
      [dashboardId]: defaults
    }));
    this.save();
    this.order.update(o => {
      const { [dashboardId]: _, ...rest } = o;
      return rest;
    });
    this.saveOrder();
  }

  getLayout(): LayoutPreset {
    return this.layout();
  }

  setLayout(preset: LayoutPreset): void {
    this.layout.set(preset);
    localStorage.setItem(this.LAYOUT_KEY, preset);
  }

  getLayoutClass(): string {
    const preset = this.layout();
    if (preset === 'compact') return 'dashboard-layout--compact';
    if (preset === 'detailed') return 'dashboard-layout--detailed';
    return '';
  }

  private loadLayout(): LayoutPreset {
    const saved = localStorage.getItem(this.LAYOUT_KEY) as LayoutPreset;
    if (saved && ['compact', 'balanced', 'detailed'].includes(saved)) {
      return saved;
    }
    return 'balanced';
  }

  private load(): DashboardPreferencesData {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private save(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences()));
  }

  private loadOrder(): DashboardOrderData {
    try {
      const raw = localStorage.getItem(this.ORDER_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveOrder(): void {
    localStorage.setItem(this.ORDER_KEY, JSON.stringify(this.order()));
  }
}
