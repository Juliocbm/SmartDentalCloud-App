import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  AllergyAlert,
  getSeverityLabel,
  getAllergenTypeLabel
} from '../../../features/patients/models/patient-allergy.models';

@Component({
  selector: 'app-allergy-alert-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './allergy-alert-banner.html',
  styleUrl: './allergy-alert-banner.scss'
})
export class AllergyAlertBannerComponent {
  alerts = input<AllergyAlert[]>([]);
  patientId = input<string | null>(null);
  compact = input(false);

  hasAlerts = computed(() => this.alerts().length > 0);

  getSeverityLabel = getSeverityLabel;
  getAllergenTypeLabel = getAllergenTypeLabel;

  getSeverityIcon(severity: string): string {
    return severity === 'LifeThreatening' ? 'fa-skull-crossbones' : 'fa-triangle-exclamation';
  }
}
