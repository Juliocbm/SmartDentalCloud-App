import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { StockService } from '../../services/stock.service';
import { StockAlert, StockAlertLevel } from '../../models/stock.models';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ModalService } from '../../../../shared/services/modal.service';
import { StockAdjustmentModalComponent, StockAdjustmentModalData } from '../stock-adjustment-modal/stock-adjustment-modal';
import { ROUTES } from '../../../../core/constants/routes.constants';

@Component({
  selector: 'app-stock-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './stock-alerts.html',
  styleUrls: ['./stock-alerts.scss']
})
export class StockAlertsComponent implements OnInit {
  private stockService = inject(StockService);
  private modalService = inject(ModalService);
  private searchSubject = new Subject<string>();

  alerts = signal<StockAlert[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');
  filterLevel = signal<'all' | StockAlertLevel>('all');

  breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Inicio', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Inventario', route: ROUTES.INVENTORY, icon: 'fa-boxes-stacked' },
    { label: 'Alertas de Stock' }
  ]);

  filteredAlerts = computed(() => {
    let result = this.alerts();

    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      result = result.filter(a =>
        a.productCode.toLowerCase().includes(search) ||
        a.productName.toLowerCase().includes(search) ||
        (a.categoryName && a.categoryName.toLowerCase().includes(search))
      );
    }

    const level = this.filterLevel();
    if (level !== 'all') {
      result = result.filter(a => a.alertLevel === level);
    }

    // Ordenar por nivel de alerta (crítico primero)
    return result.sort((a, b) => {
      const levelOrder = { critical: 0, warning: 1, normal: 2 };
      return levelOrder[a.alertLevel] - levelOrder[b.alertLevel];
    });
  });

  criticalCount = computed(() => 
    this.alerts().filter(a => a.alertLevel === 'critical').length
  );

  warningCount = computed(() => 
    this.alerts().filter(a => a.alertLevel === 'warning').length
  );

  ngOnInit(): void {
    this.loadData();
    this.setupSearchDebounce();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.stockService.getAlerts().subscribe({
      next: (alerts) => {
        this.alerts.set(alerts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading stock alerts:', err);
        this.error.set('Error al cargar las alertas de stock. Por favor, intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onLevelFilterChange(value: string): void {
    this.filterLevel.set(value as 'all' | StockAlertLevel);
  }

  getStockIcon(alert: StockAlert): string {
    if (alert.alertLevel === 'critical') return 'fa-circle-exclamation';
    if (alert.alertLevel === 'warning') return 'fa-triangle-exclamation';
    return 'fa-circle-check';
  }

  openAdjustmentModal(alert: StockAlert): void {
    const modalData: StockAdjustmentModalData = {
      productId: alert.productId,
      productCode: alert.productCode,
      productName: alert.productName,
      currentStock: alert.currentStock,
      unit: alert.unit
    };

    const modalRef = this.modalService.open<StockAdjustmentModalData, boolean>(
      StockAdjustmentModalComponent,
      { data: modalData }
    );

    modalRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }
}
