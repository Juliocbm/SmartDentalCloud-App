import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PaginatedList } from '../../../core/models/pagination.models';
import {
  InformedConsent,
  CreateInformedConsentRequest,
  SignConsentRequest,
  RevokeConsentRequest
} from '../models/informed-consent.models';

export interface ConsentCheck {
  hasSignedConsent: boolean;
  consentId: string | null;
  consentTitle: string | null;
  signedAt: string | null;
  pendingConsentsCount: number;
}

@Injectable({ providedIn: 'root' })
export class InformedConsentsService {
  private api = inject(ApiService);

  getByPatient(patientId: string, pageNumber: number = 1, pageSize: number = 10, status?: string): Observable<PaginatedList<InformedConsent>> {
    const params: any = { pageNumber, pageSize };
    if (status) params.status = status;
    return this.api.get<PaginatedList<InformedConsent>>(`/patients/${patientId}/consents`, params);
  }

  checkConsent(patientId: string, options?: { consentType?: string; appointmentId?: string; treatmentId?: string }): Observable<ConsentCheck> {
    const params: any = {};
    if (options?.consentType) params.consentType = options.consentType;
    if (options?.appointmentId) params.appointmentId = options.appointmentId;
    if (options?.treatmentId) params.treatmentId = options.treatmentId;
    return this.api.get<ConsentCheck>(`/patients/${patientId}/consents/check`, params);
  }

  create(patientId: string, data: CreateInformedConsentRequest): Observable<InformedConsent> {
    return this.api.post<InformedConsent>(`/patients/${patientId}/consents`, data);
  }

  sign(patientId: string, id: string, data: SignConsentRequest): Observable<void> {
    return this.api.patch<void>(`/patients/${patientId}/consents/${id}/sign`, data);
  }

  revoke(patientId: string, id: string, data: RevokeConsentRequest): Observable<void> {
    return this.api.patch<void>(`/patients/${patientId}/consents/${id}/revoke`, data);
  }
}
