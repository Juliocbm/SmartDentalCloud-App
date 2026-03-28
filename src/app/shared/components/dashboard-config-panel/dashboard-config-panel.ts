import { Component, inject, input, signal, computed, ElementRef, HostListener } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { DashboardWidgetConfig, LayoutPreset, WidgetDefinition } from '../../../core/models/dashboard-preferences.models';
import { DashboardPreferencesService } from '../../../core/services/dashboard-preferences.service';

@Component({
  selector: 'app-dashboard-config-panel',
  standalone: true,
  imports: [CommonModule, KeyValuePipe, CdkDrag, CdkDropList],
  templateUrl: './dashboard-config-panel.html',
  styleUrl: './dashboard-config-panel.scss'
})
export class DashboardConfigPanelComponent {
  private readonly elementRef = inject(ElementRef);
  readonly prefsService = inject(DashboardPreferencesService);

  config = input.required<DashboardWidgetConfig>();
  open = signal(false);

  availableWidgets = computed(() =>
    this.prefsService.getAvailableWidgets(this.config())
  );

  currentLayout = computed(() => this.prefsService.getLayout());

  orderedWidgetGroups = computed(() => {
    const config = this.config();
    const available = this.prefsService.getAvailableWidgets(config);
    const fixed = available.filter(w => w.reorderable === false);
    const reorderable = available.filter(w => w.reorderable !== false);

    const groups = new Map<string, WidgetDefinition[]>();
    for (const w of reorderable) {
      const group = w.group || 'default';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(w);
    }

    for (const [group, widgets] of groups) {
      const orderedIds = this.prefsService.getOrderedWidgetIds(config.dashboardId, config, group);
      widgets.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
    }

    return { fixed, groups };
  });

  toggle(): void {
    this.open.update(v => !v);
  }

  setLayout(preset: LayoutPreset): void {
    this.prefsService.setLayout(preset);
  }

  onDrop(event: CdkDragDrop<WidgetDefinition[]>, group: string): void {
    const widgets = [...(this.orderedWidgetGroups().groups.get(group) || [])];
    moveItemInArray(widgets, event.previousIndex, event.currentIndex);

    const allOrdered: string[] = [];
    for (const [g, ws] of this.orderedWidgetGroups().groups) {
      if (g === group) {
        allOrdered.push(...widgets.map(w => w.id));
      } else {
        allOrdered.push(...ws.map(w => w.id));
      }
    }
    this.prefsService.setWidgetOrder(this.config().dashboardId, allOrdered);
  }

  resetAll(): void {
    this.prefsService.resetDashboard(this.config().dashboardId, this.config());
    this.prefsService.setLayout('balanced');
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }
}
