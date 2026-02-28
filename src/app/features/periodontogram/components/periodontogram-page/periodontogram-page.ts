import { Component, OnInit, ViewChild, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PeriodontogramFormComponent } from '../periodontogram-form/periodontogram-form';
import { PeriodontogramService } from '../../services/periodontogram.service';
import { Periodontogram, PERIO_STATUS_CONFIG, CreatePeriodontogramRequest } from '../../models/periodontogram.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-periodontogram-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, PeriodontogramFormComponent],
  templateUrl: './periodontogram-page.html',
  styleUrl: './periodontogram-page.scss'
})
export class PeriodontogramPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private perioService = inject(PeriodontogramService);
  private notifications = inject(NotificationService);

  periodontogram = signal<Periodontogram | null>(null);
  loading = signal(false);
  creating = signal(false);
  error = signal<string | null>(null);
  isNewMode = signal(false);
  patientId = '';

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pacientes', route: '/patients' },
    { label: 'Detalle', route: '' },
    { label: 'Periodontograma' }
  ];

  PERIO_STATUS_CONFIG = PERIO_STATUS_CONFIG;

  @ViewChild(PeriodontogramFormComponent) formComponent?: PeriodontogramFormComponent;

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') ?? '';
    const perioId = this.route.snapshot.paramMap.get('perioId');

    if (this.patientId) {
      this.breadcrumbItems[2] = { label: 'Detalle', route: `/patients/${this.patientId}` };
    }

    if (perioId === 'new') {
      this.isNewMode.set(true);
      this.createNewPeriodontogram();
    } else if (perioId) {
      this.loadPeriodontogram(perioId);
    }
  }

  private loadPeriodontogram(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.perioService.getById(id).subscribe({
      next: (data) => {
        this.periodontogram.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err, 'Error al cargar periodontograma'));
        this.loading.set(false);
      }
    });
  }

  private createNewPeriodontogram(): void {
    if (!this.patientId) {
      this.error.set('No se encontró el ID del paciente');
      return;
    }

    this.creating.set(true);
    const request: CreatePeriodontogramRequest = {
      patientId: this.patientId,
      examDate: new Date().toISOString()
    };

    this.perioService.create(request).subscribe({
      next: (data) => {
        this.periodontogram.set(data);
        this.creating.set(false);
        this.isNewMode.set(false);

        if (data.warning) {
          this.notifications.warning(data.warning);
        }

        // Replace URL from /new to /actual-id without reloading
        this.router.navigate(
          ['/patients', this.patientId, 'periodontogram', data.id],
          { replaceUrl: true }
        );
      },
      error: (err) => {
        this.creating.set(false);
        this.error.set(getApiErrorMessage(err, 'Error al crear periodontograma'));
      }
    });
  }

  onSaved(perio: Periodontogram): void {
    this.periodontogram.set(perio);
  }

  onSigned(perio: Periodontogram): void {
    this.periodontogram.set(perio);
  }

  getTitle(): string {
    if (this.creating()) return 'Nuevo Periodontograma';
    const perio = this.periodontogram();
    if (!perio) return 'Periodontograma';
    return `Periodontograma — ${this.formatDate(perio.examDate)}`;
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
