import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TreatmentsService } from '../../services/treatments.service';
import { Treatment, TreatmentStatus, TREATMENT_STATUS_CONFIG } from '../../models/treatment.models';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-treatment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './treatment-detail.html',
  styleUrl: './treatment-detail.scss'
})
export class TreatmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private treatmentsService = inject(TreatmentsService);
  private logger = inject(LoggingService);

  // State
  treatment = signal<Treatment | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Constants
  TreatmentStatus = TreatmentStatus;
  TREATMENT_STATUS_CONFIG = TREATMENT_STATUS_CONFIG;

  ngOnInit(): void {
    const treatmentId = this.route.snapshot.paramMap.get('id');
    if (treatmentId) {
      this.loadTreatment(treatmentId);
    }
  }

  private loadTreatment(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.treatmentsService.getById(id).subscribe({
      next: (data) => {
        this.treatment.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading treatment:', err);
        this.error.set('Error al cargar el tratamiento.');
        this.loading.set(false);
      }
    });
  }

  getStatusConfig(status: TreatmentStatus) {
    return TREATMENT_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  }

  formatDateTime(date: Date | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatCurrency(value: number | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  goBack(): void {
    this.router.navigate(['/treatments']);
  }
}
