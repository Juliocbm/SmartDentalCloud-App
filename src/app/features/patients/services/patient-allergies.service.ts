import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PaginatedList } from '../../../core/models/pagination.models';
import {
  PatientAllergy,
  AllergyAlert,
  CreatePatientAllergyRequest,
  UpdatePatientAllergyRequest
} from '../models/patient-allergy.models';

@Injectable({ providedIn: 'root' })
export class PatientAllergiesService {
  private api = inject(ApiService);

  getByPatient(patientId: string, pageNumber: number = 1, pageSize: number = 10, activeOnly: boolean = true): Observable<PaginatedList<PatientAllergy>> {
    return this.api.get<PaginatedList<PatientAllergy>>(`/patients/${patientId}/allergies`, { pageNumber, pageSize, activeOnly });
  }

  getAlerts(patientId: string): Observable<AllergyAlert[]> {
    return this.api.get<AllergyAlert[]>(`/patients/${patientId}/allergies/alerts`);
  }

  create(patientId: string, data: CreatePatientAllergyRequest): Observable<PatientAllergy> {
    return this.api.post<PatientAllergy>(`/patients/${patientId}/allergies`, data);
  }

  update(patientId: string, id: string, data: UpdatePatientAllergyRequest): Observable<PatientAllergy> {
    return this.api.put<PatientAllergy>(`/patients/${patientId}/allergies/${id}`, data);
  }

  deactivate(patientId: string, id: string): Observable<void> {
    return this.api.delete<void>(`/patients/${patientId}/allergies/${id}`);
  }
}
