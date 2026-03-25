import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  NotificationSettings, 
  UpdateNotificationSettingsRequest 
} from '../models/notification-settings.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationSettingsService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/notifications/settings';

  getSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(this.baseUrl);
  }

  updateSettings(settings: UpdateNotificationSettingsRequest): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(this.baseUrl, settings);
  }
}
