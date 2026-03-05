import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface ConsentTemplate {
  id: string;
  consentType: string;
  title: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateConsentTemplateRequest {
  consentType: string;
  title: string;
  content: string;
  isDefault: boolean;
}

export interface UpdateConsentTemplateRequest {
  consentType: string;
  title: string;
  content: string;
  isDefault: boolean;
}

export const CONSENT_TYPE_OPTIONS = [
  { value: 'GeneralTreatment', label: 'Tratamiento General' },
  { value: 'Anesthesia', label: 'Anestesia' },
  { value: 'Surgery', label: 'Cirugía' },
  { value: 'Orthodontics', label: 'Ortodoncia' },
  { value: 'Radiology', label: 'Radiología' },
  { value: 'DataPrivacy', label: 'Privacidad de Datos' },
  { value: 'Other', label: 'Otro' }
];

@Injectable({ providedIn: 'root' })
export class ConsentTemplateService {
  private api = inject(ApiService);

  getAll(type?: string): Observable<ConsentTemplate[]> {
    return this.api.get<ConsentTemplate[]>('/consent-templates', type ? { type } : undefined);
  }

  create(request: CreateConsentTemplateRequest): Observable<ConsentTemplate> {
    return this.api.post<ConsentTemplate>('/consent-templates', request);
  }

  update(id: string, request: UpdateConsentTemplateRequest): Observable<ConsentTemplate> {
    return this.api.put<ConsentTemplate>(`/consent-templates/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.api.delete<void>(`/consent-templates/${id}`);
  }
}
