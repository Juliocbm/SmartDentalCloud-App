import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TreatmentsService } from '../../services/treatments.service';
import { Treatment, TreatmentStatus, TREATMENT_STATUS_CONFIG } from '../../models/treatment.models';
import { TreatmentFollowUp, CreateFollowUpRequest } from '../../models/treatment-followup.models';
import { TreatmentMaterial, CreateTreatmentMaterialRequest } from '../../models/treatment-material.models';
import { TreatmentSession, CreateSessionRequest, SESSION_STATUS_CONFIG } from '../../models/treatment-session.models';
import { ProductsService } from '../../../inventory/services/products.service';
import { Product } from '../../../inventory/models/product.models';
import { AppointmentsService } from '../../../appointments/services/appointments.service';
import { AppointmentListItem } from '../../../appointments/models/appointment.models';
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
  private productsService = inject(ProductsService);
  private appointmentsService = inject(AppointmentsService);
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

  // Materials state
  materials = signal<TreatmentMaterial[]>([]);
  materialsLoading = signal(false);
  showMaterialForm = signal(false);
  savingMaterial = signal(false);
  products = signal<Product[]>([]);
  selectedProductId = signal('');
  materialQuantity = signal(1);
  materialUnitCost = signal(0);
  materialNotes = signal('');

  // Sessions state
  sessions = signal<TreatmentSession[]>([]);
  sessionsLoading = signal(false);
  showSessionForm = signal(false);
  savingSession = signal(false);
  sessionDate = signal('');
  sessionDuration = signal<number | null>(null);
  sessionNotes = signal('');
  selectedAppointmentId = signal('');
  patientAppointments = signal<AppointmentListItem[]>([]);

  // Constants
  TreatmentStatus = TreatmentStatus;
  TREATMENT_STATUS_CONFIG = TREATMENT_STATUS_CONFIG;
  SESSION_STATUS_CONFIG = SESSION_STATUS_CONFIG;

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
        this.loadMaterials(id);
        this.loadSessions(id);
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

  // === Materials ===

  private loadMaterials(treatmentId: string): void {
    this.materialsLoading.set(true);
    this.treatmentsService.getMaterials(treatmentId).subscribe({
      next: (data) => {
        this.materials.set(data);
        this.materialsLoading.set(false);
      },
      error: () => {
        this.materialsLoading.set(false);
      }
    });
  }

  toggleMaterialForm(): void {
    this.showMaterialForm.update(v => !v);
    if (this.showMaterialForm() && this.products().length === 0) {
      this.productsService.getAll(true).subscribe({
        next: (data) => this.products.set(data)
      });
    }
    if (this.showMaterialForm()) {
      this.selectedProductId.set('');
      this.materialQuantity.set(1);
      this.materialUnitCost.set(0);
      this.materialNotes.set('');
    }
  }

  onProductSelected(): void {
    const product = this.products().find(p => p.id === this.selectedProductId());
    if (product) {
      this.materialUnitCost.set(product.unitCost || 0);
    }
  }

  saveMaterial(): void {
    const treatmentId = this.treatment()?.id;
    if (!treatmentId || !this.selectedProductId() || this.savingMaterial()) return;

    this.savingMaterial.set(true);
    const request: CreateTreatmentMaterialRequest = {
      productId: this.selectedProductId(),
      quantity: this.materialQuantity(),
      unitCost: this.materialUnitCost(),
      notes: this.materialNotes().trim() || undefined
    };

    this.treatmentsService.createMaterial(treatmentId, request).subscribe({
      next: () => {
        this.showMaterialForm.set(false);
        this.savingMaterial.set(false);
        this.loadMaterials(treatmentId);
      },
      error: () => {
        this.savingMaterial.set(false);
      }
    });
  }

  deleteMaterial(materialId: string): void {
    const treatmentId = this.treatment()?.id;
    if (!treatmentId) return;

    this.treatmentsService.deleteMaterial(treatmentId, materialId).subscribe({
      next: () => this.loadMaterials(treatmentId)
    });
  }

  getMaterialsTotalCost(): number {
    return this.materials().reduce((sum, m) => sum + m.totalCost, 0);
  }

  // === Sessions ===

  private loadSessions(treatmentId: string): void {
    this.sessionsLoading.set(true);
    this.treatmentsService.getSessions(treatmentId).subscribe({
      next: (data) => {
        const parsed = data.map(s => ({
          ...s,
          date: new Date(s.date),
          createdAt: new Date(s.createdAt)
        }));
        parsed.sort((a, b) => a.sessionNumber - b.sessionNumber);
        this.sessions.set(parsed);
        this.sessionsLoading.set(false);
      },
      error: () => {
        this.sessionsLoading.set(false);
      }
    });
  }

  toggleSessionForm(): void {
    this.showSessionForm.update(v => !v);
    if (this.showSessionForm()) {
      this.sessionDate.set(new Date().toISOString().split('T')[0]);
      this.sessionDuration.set(null);
      this.sessionNotes.set('');
      this.selectedAppointmentId.set('');
      this.loadPatientAppointments();
    }
  }

  private loadPatientAppointments(): void {
    const patientId = this.treatment()?.patientId;
    if (!patientId) return;

    this.appointmentsService.getByPatient(patientId).subscribe({
      next: (data) => {
        const upcoming = data
          .filter(a => a.status === 'Scheduled' || a.status === 'Confirmed')
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        this.patientAppointments.set(upcoming);
      }
    });
  }

  getNextSessionNumber(): number {
    const max = this.sessions().reduce((m, s) => Math.max(m, s.sessionNumber), 0);
    return max + 1;
  }

  saveSession(): void {
    const treatmentId = this.treatment()?.id;
    if (!treatmentId || !this.sessionDate() || this.savingSession()) return;

    this.savingSession.set(true);
    const request: CreateSessionRequest = {
      sessionNumber: this.getNextSessionNumber(),
      date: new Date(this.sessionDate()).toISOString(),
      appointmentId: this.selectedAppointmentId() || undefined,
      duration: this.sessionDuration() || undefined,
      notes: this.sessionNotes().trim() || undefined
    };

    this.treatmentsService.createSession(treatmentId, request).subscribe({
      next: () => {
        this.showSessionForm.set(false);
        this.savingSession.set(false);
        this.loadSessions(treatmentId);
      },
      error: () => {
        this.savingSession.set(false);
      }
    });
  }

  getSessionStatusConfig(status: string) {
    return SESSION_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
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
