import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';

export interface AnonymizedExportDto {
  generatedAt: string;
  fromDate: string;
  toDate: string;
  totalRecords: number;
  records: AnonymizedPatientRecord[];
}

export interface AnonymizedPatientRecord {
  anonymousId: string;
  age?: number;
  gender?: string;
  state?: string;
  bloodType?: string;
  diagnosisCodes: string[];
  treatmentTypes: string[];
}

@Component({
  selector: 'app-anonymized-export',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './anonymized-export.html',
  styleUrl: './anonymized-export.scss'
})
export class AnonymizedExportComponent {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Reportes', route: '/dashboard' },
    { label: 'Exportación Anonimizada' }
  ];

  // Options
  fromDate = signal(this.getDefaultFromDate());
  toDate = signal(this.getDefaultToDate());
  includeDiagnoses = signal(true);
  includeTreatments = signal(true);
  includeDemographics = signal(true);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  exportResult = signal<AnonymizedExportDto | null>(null);

  private getDefaultFromDate(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  }

  private getDefaultToDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  generateExport(): void {
    this.loading.set(true);
    this.error.set(null);
    this.exportResult.set(null);

    let params = new HttpParams()
      .set('from', this.fromDate())
      .set('to', this.toDate())
      .set('format', 'json')
      .set('includeDiagnoses', this.includeDiagnoses().toString())
      .set('includeTreatments', this.includeTreatments().toString())
      .set('includeDemographics', this.includeDemographics().toString());

    this.http.get<AnonymizedExportDto>(
      `${this.apiUrl}/reports/anonymized-export`, { params }
    ).subscribe({
      next: (data) => {
        this.exportResult.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al generar exportación');
        this.loading.set(false);
      }
    });
  }

  downloadCsv(): void {
    let params = new HttpParams()
      .set('from', this.fromDate())
      .set('to', this.toDate())
      .set('format', 'csv')
      .set('includeDiagnoses', this.includeDiagnoses().toString())
      .set('includeTreatments', this.includeTreatments().toString())
      .set('includeDemographics', this.includeDemographics().toString());

    this.http.get(`${this.apiUrl}/reports/anonymized-export`, {
      params,
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `anonymized_export_${this.fromDate()}_${this.toDate()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.error.set('Error al descargar CSV');
      }
    });
  }

  downloadJson(): void {
    const data = this.exportResult();
    if (!data) return;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anonymized_export_${this.fromDate()}_${this.toDate()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
