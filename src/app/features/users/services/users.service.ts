import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserProfile,
  Role
} from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private api = inject(ApiService);
  private readonly baseUrl = '/users';

  getAll(): Observable<User[]> {
    return this.api.get<User[]>(this.baseUrl).pipe(
      map(users => users.map(this.parseUserDates))
    );
  }

  getById(id: string): Observable<User> {
    return this.api.get<User>(`${this.baseUrl}/${id}`).pipe(
      map(this.parseUserDates)
    );
  }

  create(data: CreateUserRequest): Observable<User> {
    return this.api.post<User>(this.baseUrl, data).pipe(
      map(this.parseUserDates)
    );
  }

  update(id: string, data: UpdateUserRequest): Observable<User> {
    return this.api.put<User>(`${this.baseUrl}/${id}`, data).pipe(
      map(this.parseUserDates)
    );
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }

  toggleActive(id: string): Observable<User> {
    return this.api.patch<User>(`${this.baseUrl}/${id}/toggle-active`, {}).pipe(
      map(this.parseUserDates)
    );
  }

  getUserRoles(userId: string): Observable<Role[]> {
    return this.api.get<Role[]>(`${this.baseUrl}/${userId}/roles`);
  }

  assignRole(userId: string, roleId: string): Observable<void> {
    return this.api.post<void>(`${this.baseUrl}/${userId}/roles`, { roleId });
  }

  removeRole(userId: string, roleId: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${userId}/roles/${roleId}`);
  }

  updateUserRoles(userId: string, roleIds: string[]): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${userId}/roles`, { roleIds });
  }

  getUserPermissions(userId: string): Observable<string[]> {
    return this.api.get<string[]>(`${this.baseUrl}/${userId}/permissions`);
  }

  getUserProfile(userId: string): Observable<UserProfile> {
    return this.api.get<UserProfile>(`${this.baseUrl}/${userId}/profile`);
  }

  updateUserProfile(userId: string, data: Partial<UserProfile>): Observable<UserProfile> {
    return this.api.put<UserProfile>(`${this.baseUrl}/${userId}/profile`, data);
  }

  getDoctors(): Observable<Array<{ id: string; name: string; specialization?: string }>> {
    return this.api.get<Array<{ id: string; name: string; specialization?: string }>>(
      `${this.baseUrl}/doctors`
    );
  }

  private parseUserDates(user: User): User {
    return {
      ...user,
      createdAt: new Date(user.createdAt)
    };
  }
}
