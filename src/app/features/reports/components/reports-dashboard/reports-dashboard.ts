import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './reports-dashboard.html',
  styleUrl: './reports-dashboard.scss'
})
export class ReportsDashboardComponent {
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Reportes' }
  ];

  reports = [
    {
      title: 'Cuentas por Cobrar',
      description: 'Facturas pendientes de pago con análisis de antigüedad',
      icon: 'fa-file-invoice-dollar',
      route: '/reports/accounts-receivable',
      color: 'warning'
    },
    {
      title: 'Reporte de Ingresos',
      description: 'Análisis de ingresos por período con desglose diario',
      icon: 'fa-chart-line',
      route: '/reports/income',
      color: 'success'
    },
    {
      title: 'Reporte de Tratamientos',
      description: 'Resumen de tratamientos por estado y tipo de servicio',
      icon: 'fa-tooth',
      route: '/reports/treatments',
      color: 'primary'
    },
    {
      title: 'Productividad por Dentista',
      description: 'Métricas de rendimiento por profesional',
      icon: 'fa-user-doctor',
      route: '/reports/dentist-productivity',
      color: 'info'
    },
    {
      title: 'Resumen de Inventario',
      description: 'Estado del inventario, productos con bajo stock y valorización',
      icon: 'fa-boxes-stacked',
      route: '/reports/inventory',
      color: 'danger'
    },
    {
      title: 'Ocupación de Agenda',
      description: 'Análisis de ocupación de citas por dentista y horario',
      icon: 'fa-calendar-check',
      route: '/reports/appointment-occupancy',
      color: 'secondary'
    },
    {
      title: 'Servicios Más Solicitados',
      description: 'Ranking de servicios por frecuencia e ingresos generados',
      icon: 'fa-ranking-star',
      route: '/reports/top-services',
      color: 'primary'
    }
  ];
}
