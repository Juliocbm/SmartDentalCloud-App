import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, DentistListItem } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = inject(ApiService);

  getAll(): Observable<User[]> {
    return this.api.get<User[]>('/users');
  }

  getById(id: string): Observable<User> {
    return this.api.get<User>(`/users/${id}`);
  }

  getDentists(): Observable<DentistListItem[]> {
    return this.api.get<DentistListItem[]>('/users/dentists');
  }
}
