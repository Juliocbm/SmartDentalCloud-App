import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { 
  Role, 
  CreateRoleRequest, 
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
  Permission
} from '../models/role.models';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private api = inject(ApiService);
  private readonly baseUrl = '/roles';
  private readonly permissionsUrl = '/permissions';

  getAll(): Observable<Role[]> {
    return this.api.get<Role[]>(this.baseUrl);
  }

  getById(id: string): Observable<Role> {
    return this.api.get<Role>(`${this.baseUrl}/${id}`);
  }

  create(data: CreateRoleRequest): Observable<Role> {
    return this.api.post<Role>(this.baseUrl, data);
  }

  update(id: string, data: UpdateRoleRequest): Observable<Role> {
    return this.api.put<Role>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }

  getRolePermissions(roleId: string): Observable<Permission[]> {
    return this.api.get<Permission[]>(`${this.baseUrl}/${roleId}/permissions`);
  }

  updateRolePermissions(roleId: string, data: UpdateRolePermissionsRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${roleId}/permissions`, data);
  }

  getAllPermissions(): Observable<Permission[]> {
    return this.api.get<Permission[]>(this.permissionsUrl);
  }
}
