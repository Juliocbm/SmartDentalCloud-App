import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { OdontogramComponent } from '../odontogram/odontogram';
import { OdontogramEvaluationService } from '../../services/odontogram-evaluation.service';
import {
  OdontogramEvaluation,
  ODONTOGRAM_STATUS_CONFIG,
  CreateOdontogramRequest
} from '../../models/odontogram-evaluation.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { DateFormatService } from '../../../../core/services/date-format.service';

@Component({
  selector: 'app-odontogram-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, OdontogramComponent],
  templateUrl: './odontogram-page.html',
  styleUrl: './odontogram-page.scss'
})
export class OdontogramPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private odontogramService = inject(OdontogramEvaluationService);
  private notifications = inject(NotificationService);

  evaluation = signal<OdontogramEvaluation | null>(null);
  loading = signal(false);
  creating = signal(false);
  error = signal<string | null>(null);
  isNewMode = signal(false);
  patientId = '';

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pacientes', route: '/patients' },
    { label: 'Detalle', route: '' },
    { label: 'Odontograma' }
  ];

  ODONTOGRAM_STATUS_CONFIG = ODONTOGRAM_STATUS_CONFIG;

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') ?? '';
    const odontogramId = this.route.snapshot.paramMap.get('odontogramId');

    if (this.patientId) {
      this.breadcrumbItems[2] = { label: 'Detalle', route: `/patients/${this.patientId}` };
    }

    if (odontogramId === 'new') {
      this.isNewMode.set(true);
      this.createNewOdontogram();
    } else if (odontogramId) {
      this.loadOdontogram(odontogramId);
    }
  }

  private loadOdontogram(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.odontogramService.getById(id).subscribe({
      next: (data) => {
        this.evaluation.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err, 'Error al cargar odontograma'));
        this.loading.set(false);
      }
    });
  }

  private createNewOdontogram(): void {
    if (!this.patientId) {
      this.error.set('No se encontró el ID del paciente');
      return;
    }

    this.creating.set(true);
    const request: CreateOdontogramRequest = {
      patientId: this.patientId,
      examDate: new Date().toISOString()
    };

    this.odontogramService.create(request).subscribe({
      next: (data) => {
        this.evaluation.set(data);
        this.creating.set(false);
        this.isNewMode.set(false);

        if (data.warning) {
          this.notifications.warning(data.warning);
        }

        // Replace URL from /new to /actual-id without reloading
        this.router.navigate(
          ['/patients', this.patientId, 'odontogram', data.id],
          { replaceUrl: true }
        );
      },
      error: (err) => {
        this.creating.set(false);
        this.error.set(getApiErrorMessage(err, 'Error al crear odontograma'));
      }
    });
  }

  onEvaluationUpdated(evaluation: OdontogramEvaluation): void {
    this.evaluation.set(evaluation);
  }

  signOdontogram(): void {
    const eval_ = this.evaluation();
    if (!eval_) return;

    this.odontogramService.sign(eval_.id).subscribe({
      next: (data) => {
        this.evaluation.set(data);
        this.notifications.success('Odontograma firmado exitosamente');
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al firmar'));
      }
    });
  }

  getTitle(): string {
    if (this.creating()) return 'Nuevo Odontograma';
    const eval_ = this.evaluation();
    if (!eval_) return 'Odontograma';
    return `Odontograma — ${this.formatDate(eval_.examDate)}`;
  }

  formatDate(date: string | null): string {
    return DateFormatService.shortDate(date);
  }

  goBack(): void {
    if (this.patientId) {
      this.router.navigate(['/patients', this.patientId]);
    } else {
      this.router.navigate(['/patients']);
    }
  }
}
