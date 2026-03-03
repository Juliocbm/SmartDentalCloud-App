import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { CephTracerComponent } from '../../cephalometry-module/components/ceph-tracer/ceph-tracer.component';
import { CephalometryApiService } from '../../services/cephalometry-api.service';
import {
  CephalometricAnalysis,
  CEPH_STATUS_CONFIG,
  CreateCephalometricAnalysisRequest
} from '../../models/cephalometric-analysis.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-cephalometry-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, CephTracerComponent],
  templateUrl: './cephalometry-page.html',
  styleUrl: './cephalometry-page.scss'
})
export class CephalometryPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cephService = inject(CephalometryApiService);
  private notifications = inject(NotificationService);

  analysis = signal<CephalometricAnalysis | null>(null);
  loading = signal(false);
  creating = signal(false);
  error = signal<string | null>(null);
  isNewMode = signal(false);
  patientId = '';

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pacientes', route: '/patients' },
    { label: 'Detalle', route: '' },
    { label: 'Cefalometría' }
  ];

  CEPH_STATUS_CONFIG = CEPH_STATUS_CONFIG;

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') ?? '';
    const cephId = this.route.snapshot.paramMap.get('cephId');

    if (this.patientId) {
      this.breadcrumbItems[2] = { label: 'Detalle', route: `/patients/${this.patientId}` };
    }

    if (cephId === 'new') {
      this.isNewMode.set(true);
      this.createNewAnalysis();
    } else if (cephId) {
      this.loadAnalysis(cephId);
    }
  }

  private loadAnalysis(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.cephService.getById(id).subscribe({
      next: (data) => {
        this.analysis.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err, 'Error al cargar análisis cefalométrico'));
        this.loading.set(false);
      }
    });
  }

  private createNewAnalysis(): void {
    if (!this.patientId) {
      this.error.set('No se encontró el ID del paciente');
      return;
    }

    this.creating.set(true);
    const request: CreateCephalometricAnalysisRequest = {
      patientId: this.patientId,
      examDate: new Date().toISOString()
    };

    this.cephService.create(request).subscribe({
      next: (data) => {
        this.analysis.set(data);
        this.creating.set(false);
        this.isNewMode.set(false);

        this.router.navigate(
          ['/patients', this.patientId, 'cephalometry', data.id],
          { replaceUrl: true }
        );
      },
      error: (err) => {
        this.creating.set(false);
        this.error.set(getApiErrorMessage(err, 'Error al crear análisis cefalométrico'));
      }
    });
  }

  onAnalysisUpdated(updated: CephalometricAnalysis): void {
    this.analysis.set(updated);
  }

  getTitle(): string {
    if (this.creating()) return 'Nuevo Análisis Cefalométrico';
    const a = this.analysis();
    if (!a) return 'Análisis Cefalométrico';
    return `Cefalometría — ${this.formatDate(a.examDate)}`;
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(date));
  }

  goBack(): void {
    if (this.patientId) {
      this.router.navigate(['/patients', this.patientId]);
    } else {
      this.router.navigate(['/patients']);
    }
  }
}
