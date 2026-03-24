import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DentalServiceItem, CreateServiceRequest, UpdateServiceRequest, TreatmentSummary, ServiceStatistics, ServiceCategory, PriceChange } from '../models/service.models';

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

  getLinkedTreatments(serviceId: string): Observable<TreatmentSummary[]> {
    return this.api.get<TreatmentSummary[]>(`/services/${serviceId}/treatments`);
  }

  getStatistics(serviceId: string): Observable<ServiceStatistics> {
    return this.api.get<ServiceStatistics>(`/services/${serviceId}/statistics`);
  }

  getPriceHistory(serviceId: string): Observable<PriceChange[]> {
    return this.api.get<PriceChange[]>(`/services/${serviceId}/price-history`);
  }

  // Categories
  getAllCategories(): Observable<ServiceCategory[]> {
    return this.api.get<ServiceCategory[]>('/service-categories');
  }

  getCategoryById(id: string): Observable<ServiceCategory> {
    return this.api.get<ServiceCategory>(`/service-categories/${id}`);
  }

  createCategory(request: { name: string; description?: string; displayOrder: number }): Observable<ServiceCategory> {
    return this.api.post<ServiceCategory>('/service-categories', request);
  }

  updateCategory(id: string, request: { name: string; description?: string; displayOrder: number; isActive: boolean }): Observable<ServiceCategory> {
    return this.api.put<ServiceCategory>(`/service-categories/${id}`, { ...request, id });
  }

  deleteCategory(id: string): Observable<void> {
    return this.api.delete<void>(`/service-categories/${id}`);
  }
}
