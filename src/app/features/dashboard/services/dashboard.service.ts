import { Injectable, inject } from '@angular/core';
import { Observable, map, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  DashboardStats,
  UpcomingAppointment,
  RecentActivity,
  QuickStat,
  LowStockProduct,
  MonthlyRevenueData,
  AppointmentStats
} from '../models/dashboard.models';

@Injectable()
export class DashboardService {
  private apiService = inject(ApiService);

  getDashboardStats(): Observable<DashboardStats> {
    // TODO: Reemplazar con datos reales cuando el backend esté disponible
    // Datos mock para desarrollo
    const mockStats: DashboardStats = {
      todayAppointments: 8,
      todayRevenue: 12500,
      newPatientsThisMonth: 23,
      completedTreatmentsThisMonth: 45,
      pendingAppointments: 12,
      lowStockProducts: 3,
      activeTreatmentPlans: 15,
      monthlyRevenue: 185430
    };

    return of(mockStats);

    // Código para producción (descomentar cuando el backend esté listo):
    /*
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return forkJoin({
      todayAppointments: this.apiService.get<any[]>('/api/appointments', {
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }),
      monthlyAppointments: this.apiService.get<any[]>('/api/appointments', {
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString()
      }),
      patients: this.apiService.get<any>('/api/patients', { pageSize: 1 }),
      treatments: this.apiService.get<any[]>('/api/treatments'),
      products: this.apiService.get<any[]>('/api/products')
    }).pipe(
      map(data => ({
        todayAppointments: data.todayAppointments?.length || 0,
        todayRevenue: this.calculateRevenue(data.todayAppointments),
        newPatientsThisMonth: this.countNewPatientsThisMonth(data.patients),
        completedTreatmentsThisMonth: this.countCompletedTreatments(data.treatments, startOfMonth),
        pendingAppointments: this.countPendingAppointments(data.monthlyAppointments),
        lowStockProducts: this.countLowStockProducts(data.products),
        activeTreatmentPlans: data.treatments?.filter((t: any) => t.status === 'InProgress').length || 0,
        monthlyRevenue: this.calculateMonthlyRevenue(data.monthlyAppointments)
      }))
    );
    */
  }

  getUpcomingAppointments(limit: number = 5): Observable<UpcomingAppointment[]> {
    // TODO: Reemplazar con datos reales cuando el backend esté disponible
    // Datos mock para desarrollo
    const today = new Date();
    const mockAppointments: UpcomingAppointment[] = [
      {
        id: '1',
        patientName: 'Juan Pérez García',
        patientId: 'p1',
        doctorName: 'Dr. María González',
        startAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
        endAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
        reason: 'Limpieza dental',
        status: 'Scheduled'
      },
      {
        id: '2',
        patientName: 'Ana Martínez López',
        patientId: 'p2',
        doctorName: 'Dr. Carlos Ramírez',
        startAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
        endAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30),
        reason: 'Revisión de ortodoncia',
        status: 'Scheduled'
      },
      {
        id: '3',
        patientName: 'Roberto Sánchez',
        patientId: 'p3',
        doctorName: 'Dr. María González',
        startAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
        endAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
        reason: 'Endodoncia',
        status: 'Confirmed'
      },
      {
        id: '4',
        patientName: 'Laura Fernández',
        patientId: 'p4',
        doctorName: 'Dr. Carlos Ramírez',
        startAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0),
        endAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0),
        reason: 'Consulta general',
        status: 'Scheduled'
      },
      {
        id: '5',
        patientName: 'Miguel Torres',
        patientId: 'p5',
        doctorName: 'Dr. María González',
        startAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 15, 30),
        endAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 16, 30),
        reason: 'Implante dental',
        status: 'Scheduled'
      }
    ];

    return of(mockAppointments.slice(0, limit));

    // Código para producción (descomentar cuando el backend esté listo):
    /*
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return this.apiService.get<any[]>('/api/appointments', {
      startDate: today.toISOString(),
      endDate: nextWeek.toISOString(),
      status: 'Scheduled'
    }).pipe(
      map(appointments => 
        (appointments || [])
          .slice(0, limit)
          .map(apt => ({
            id: apt.id,
            patientName: apt.patientName,
            patientId: apt.patientId,
            doctorName: apt.doctorName,
            startAt: new Date(apt.startAt),
            endAt: new Date(apt.endAt),
            reason: apt.reason || 'Consulta General',
            status: apt.status
          }))
      )
    );
    */
  }

  getAppointmentStats(): Observable<AppointmentStats> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return this.apiService.get<any[]>('/api/appointments', {
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString()
    }).pipe(
      map(appointments => ({
        scheduled: appointments?.filter(a => a.status === 'Scheduled').length || 0,
        completed: appointments?.filter(a => a.status === 'Completed').length || 0,
        cancelled: appointments?.filter(a => a.status === 'Cancelled').length || 0,
        noShow: appointments?.filter(a => a.status === 'NoShow').length || 0
      }))
    );
  }

  getLowStockProducts(limit: number = 5): Observable<LowStockProduct[]> {
    // TODO: Reemplazar con datos reales cuando el backend esté disponible
    // Datos mock para desarrollo
    const mockProducts: LowStockProduct[] = [
      {
        id: '1',
        name: 'Guantes de látex (caja 100 unidades)',
        currentStock: 5,
        minStock: 20,
        category: 'Material desechable'
      },
      {
        id: '2',
        name: 'Anestesia local Lidocaína 2%',
        currentStock: 8,
        minStock: 15,
        category: 'Farmacia'
      },
      {
        id: '3',
        name: 'Mascarillas quirúrgicas',
        currentStock: 12,
        minStock: 30,
        category: 'Material desechable'
      }
    ];

    return of(mockProducts.slice(0, limit));

    // Código para producción (descomentar cuando el backend esté listo):
    /*
    return this.apiService.get<any[]>('/api/products').pipe(
      map(products => 
        (products || [])
          .filter(p => p.currentStock <= p.minStock)
          .slice(0, limit)
          .map(p => ({
            id: p.id,
            name: p.name,
            currentStock: p.currentStock || 0,
            minStock: p.minStock || 10,
            category: p.categoryName || 'Sin categoría'
          }))
      )
    );
    */
  }

  getMonthlyRevenueData(months: number = 6): Observable<MonthlyRevenueData> {
    const today = new Date();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      labels.push(monthNames[date.getMonth()]);
      data.push(Math.random() * 50000 + 20000);
    }

    return of({ labels, data });
  }

  getRecentActivity(limit: number = 5): Observable<RecentActivity[]> {
    const activities: RecentActivity[] = [
      {
        id: '1',
        type: 'appointment' as const,
        description: 'Nueva cita agendada con Juan Pérez',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        icon: 'fa-calendar-check',
        statusColor: 'primary'
      },
      {
        id: '2',
        type: 'treatment' as const,
        description: 'Tratamiento completado: Limpieza Dental',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        icon: 'fa-tooth',
        statusColor: 'success'
      },
      {
        id: '3',
        type: 'payment' as const,
        description: 'Pago recibido: $2,500.00 MXN',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        icon: 'fa-dollar-sign',
        statusColor: 'success'
      },
      {
        id: '4',
        type: 'patient' as const,
        description: 'Nuevo paciente registrado: María González',
        timestamp: new Date(Date.now() - 1000 * 60 * 180),
        icon: 'fa-user-plus',
        statusColor: 'info'
      }
    ];
    return of(activities.slice(0, limit));
  }

  private calculateRevenue(appointments: any[] | null): number {
    if (!appointments) return 0;
    return appointments.reduce((sum, apt) => sum + (apt.totalAmount || 1500), 0);
  }

  private countNewPatientsThisMonth(patientsData: any): number {
    return patientsData?.totalCount || 0;
  }

  private countCompletedTreatments(treatments: any[] | null, startOfMonth: Date): number {
    if (!treatments) return 0;
    return treatments.filter(t => 
      t.status === 'Completed' && 
      new Date(t.endDate) >= startOfMonth
    ).length;
  }

  private countPendingAppointments(appointments: any[] | null): number {
    if (!appointments) return 0;
    return appointments.filter(a => a.status === 'Scheduled').length;
  }

  private countLowStockProducts(products: any[] | null): number {
    if (!products) return 0;
    return products.filter(p => p.currentStock <= p.minStock).length;
  }

  private calculateMonthlyRevenue(appointments: any[] | null): number {
    if (!appointments) return 0;
    return appointments
      .filter(a => a.status === 'Completed')
      .reduce((sum, apt) => sum + (apt.totalAmount || 1500), 0);
  }
}
