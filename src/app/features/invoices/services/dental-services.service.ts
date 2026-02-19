import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DentalService } from '../models/service.models';

@Injectable({ providedIn: 'root' })
export class DentalServicesService {
  private api = inject(ApiService);

  getAll(): Observable<DentalService[]> {
    return this.api.get<DentalService[]>('/services');
  }

  getById(id: string): Observable<DentalService> {
    return this.api.get<DentalService>(`/services/${id}`);
  }
}
