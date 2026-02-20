import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TreatmentsService } from '../../services/treatments.service';
import { Treatment, TreatmentStatus, TREATMENT_STATUS_CONFIG } from '../../models/treatment.models';
import { TreatmentFollowUp, CreateFollowUpRequest } from '../../models/treatment-followup.models';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-treatment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

  // Follow-ups state
  followUps = signal<TreatmentFollowUp[]>([]);
  followUpsLoading = signal(false);
  showFollowUpForm = signal(false);
  savingFollowUp = signal(false);
  newFollowUpDate = signal('');
  newFollowUpDescription = signal('');

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
        this.loadFollowUps(id);
      },
      error: (err) => {
        this.logger.error('Error loading treatment:', err);
        this.error.set('Error al cargar el tratamiento.');
        this.loading.set(false);
      }
    });
  }

  // === Follow-ups ===

  private loadFollowUps(treatmentId: string): void {
    this.followUpsLoading.set(true);
    this.treatmentsService.getFollowUps(treatmentId).subscribe({
      next: (data) => {
        const parsed = data.map(f => ({
          ...f,
          date: new Date(f.date),
          createdAt: new Date(f.createdAt)
        }));
        parsed.sort((a, b) => b.date.getTime() - a.date.getTime());
        this.followUps.set(parsed);
        this.followUpsLoading.set(false);
      },
      error: () => {
        this.followUpsLoading.set(false);
      }
    });
  }

  toggleFollowUpForm(): void {
    this.showFollowUpForm.update(v => !v);
    if (this.showFollowUpForm()) {
      this.newFollowUpDate.set(new Date().toISOString().split('T')[0]);
      this.newFollowUpDescription.set('');
    }
  }

  saveFollowUp(): void {
    const treatmentId = this.treatment()?.id;
    if (!treatmentId || !this.newFollowUpDate() || this.savingFollowUp()) return;

    this.savingFollowUp.set(true);
    const request: CreateFollowUpRequest = {
      date: new Date(this.newFollowUpDate()).toISOString(),
      description: this.newFollowUpDescription().trim() || undefined
    };

    this.treatmentsService.createFollowUp(treatmentId, request).subscribe({
      next: () => {
        this.showFollowUpForm.set(false);
        this.savingFollowUp.set(false);
        this.loadFollowUps(treatmentId);
      },
      error: () => {
        this.savingFollowUp.set(false);
      }
    });
  }

  deleteFollowUp(followUpId: string): void {
    const treatmentId = this.treatment()?.id;
    if (!treatmentId) return;

    this.treatmentsService.deleteFollowUp(treatmentId, followUpId).subscribe({
      next: () => this.loadFollowUps(treatmentId)
    });
  }

  formatDateShort(date: Date | string): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
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
