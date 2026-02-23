import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface CachedProfile {
  profilePictureUrl?: string;
  name?: string;
  roles?: string[];
}

@Injectable({ providedIn: 'root' })
export class UserProfileCacheService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  profilePictureUrl = signal<string | null>(null);
  private loaded = false;

  loadProfilePicture(): void {
    if (this.loaded) return;
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loaded = true;
    this.api.get<{ profilePictureUrl?: string }>(`/users/${user.id}/profile`).subscribe({
      next: (profile) => {
        this.profilePictureUrl.set(profile?.profilePictureUrl || null);
      },
      error: () => {}
    });
  }

  refresh(): void {
    this.loaded = false;
    this.loadProfilePicture();
  }
}
