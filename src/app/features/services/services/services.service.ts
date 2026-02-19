import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DentalServiceItem, CreateServiceRequest, UpdateServiceRequest } from '../models/service.models';

@Injectable()
export class ServicesService {
  private api = inject(ApiService);

  getAll(): Observable<DentalServiceItem[]> {
    return this.api.get<DentalServiceItem[]>('/services');
  }

  getById(id: string): Observable<DentalServiceItem> {
    return this.api.get<DentalServiceItem>(`/services/${id}`);
  }

  create(request: CreateServiceRequest): Observable<DentalServiceItem> {
    return this.api.post<DentalServiceItem>('/services', request);
  }

  update(id: string, request: UpdateServiceRequest): Observable<DentalServiceItem> {
    return this.api.put<DentalServiceItem>(`/services/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/services/${id}`);
  }
}
