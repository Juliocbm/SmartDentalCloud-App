import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent {
  loading = false;
  errorMessage = '';

  kpiData = {
    totalPatients: 1234,
    appointmentsToday: 28,
    pendingPayments: 15,
    revenue: 45678
  };

  recentAppointments = [
    { id: 1, patient: 'Juan Pérez', time: '09:00 AM', status: 'Confirmada' },
    { id: 2, patient: 'María García', time: '10:30 AM', status: 'Pendiente' },
    { id: 3, patient: 'Carlos López', time: '02:00 PM', status: 'Confirmada' },
    { id: 4, patient: 'Ana Martínez', time: '03:30 PM', status: 'Cancelada' },
  ];

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Confirmada': 'badge-success',
      'Pendiente': 'badge-warning',
      'Cancelada': 'badge-error'
    };
    return statusMap[status] || 'badge-neutral';
  }

  refreshData(): void {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  createNew(): void {
    console.log('Crear nuevo');
  }

  exportData(): void {
    console.log('Exportar datos');
  }

  quickAction(action: string): void {
    console.log('Acción rápida:', action);
  }
}
