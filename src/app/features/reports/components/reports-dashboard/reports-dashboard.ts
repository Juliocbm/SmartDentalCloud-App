import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './reports-dashboard.html',
  styleUrl: './reports-dashboard.scss'
})
export class ReportsDashboardComponent {
  reports = [
    {
      title: 'Cuentas por Cobrar',
      description: 'Facturas pendientes de pago con análisis de antigüedad',
      icon: 'fa-file-invoice-dollar',
      route: '/reports/accounts-receivable',
      color: 'warning'
    }
  ];
}
