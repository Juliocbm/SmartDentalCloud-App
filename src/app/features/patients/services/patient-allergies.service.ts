import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  PatientAllergy,
  AllergyAlert,
  CreatePatientAllergyRequest,
  UpdatePatientAllergyRequest
} from '../models/patient-allergy.models';

@Injectable({ providedIn: 'root' })
export class PatientAllergiesService {
  private api = inject(ApiService);

  getByPatient(patientId: string, activeOnly: boolean = true): Observable<PatientAllergy[]> {
    return this.api.get<PatientAllergy[]>(`/patients/${patientId}/allergies`, { activeOnly });
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
