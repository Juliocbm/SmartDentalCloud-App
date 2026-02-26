import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ReportsService } from '../../services/reports.service';
import { AppointmentOccupancy } from '../../models/report.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker';

@Component({
  selector: 'app-appointment-occupancy',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, DatePickerComponent],
  templateUrl: './appointment-occupancy.html',
  styleUrl: './appointment-occupancy.scss'
})
export class AppointmentOccupancyComponent implements OnInit {
  private reportsService = inject(ReportsService);

  report = signal<AppointmentOccupancy | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  startDate = signal(this.getDefaultStart());
  endDate = signal(this.getDefaultEnd());

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Reportes', route: '/reports' },
    { label: 'Ocupación de Agenda' }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reportsService.getAppointmentOccupancy(this.startDate(), this.endDate()).subscribe({
      next: (data) => { this.report.set(data); this.loading.set(false); },
      error: (err) => { this.error.set(getApiErrorMessage(err)); this.loading.set(false); }
    });
  }

  onDateChange(): void {
    this.loadReport();
  }

  getBarWidth(value: number, max: number): string {
    if (max <= 0) return '0%';
    return Math.round((value / max) * 100) + '%';
  }

  private getDefaultStart(): string {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }

  private getDefaultEnd(): string {
    return new Date().toISOString().split('T')[0];
  }
}
