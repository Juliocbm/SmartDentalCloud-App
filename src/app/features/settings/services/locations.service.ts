import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Location,
  LocationSummary,
  CreateLocationRequest,
  UpdateLocationRequest
} from '../models/location.models';

@Injectable({ providedIn: 'root' })
export class LocationsService {
  private api = inject(ApiService);

  private locationsCache = signal<LocationSummary[]>([]);
  locationSummaries = this.locationsCache.asReadonly();
  hasMultipleLocations = computed(() => this.locationsCache().length > 1);

  getAll(isActive?: boolean): Observable<Location[]> {
    const params: Record<string, string> = {};
    if (isActive !== undefined) params['isActive'] = String(isActive);
    return this.api.get<Location[]>('/locations', params);
  }

  getById(id: string): Observable<Location> {
    return this.api.get<Location>(`/locations/${id}`);
  }

  getSummaries(): Observable<LocationSummary[]> {
    return this.api.get<LocationSummary[]>('/locations/summaries').pipe(
      tap(summaries => this.locationsCache.set(summaries))
    );
  }

  create(data: CreateLocationRequest): Observable<Location> {
    return this.api.post<Location>('/locations', data);
  }

  update(id: string, data: UpdateLocationRequest): Observable<Location> {
    return this.api.put<Location>(`/locations/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/locations/${id}`);
  }

  assignUsers(locationId: string, userIds: string[]): Observable<void> {
    return this.api.post<void>(`/locations/${locationId}/users`, userIds);
  }

  removeUser(locationId: string, userId: string): Observable<void> {
    return this.api.delete<void>(`/locations/${locationId}/users/${userId}`);
  }

  refreshCache(): void {
    this.getSummaries().subscribe();
  }
}
