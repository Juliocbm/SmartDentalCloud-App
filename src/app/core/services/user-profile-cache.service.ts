import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserProfileCacheService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  profilePictureUrl = signal<string | null>(null);
  private loaded = false;
  private currentBlobUrl: string | null = null;
  private cacheBuster = 0;

  loadProfilePicture(): void {
    if (this.loaded) return;
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loaded = true;

    // Descarga directa del blob — un solo request; 404 = sin foto
    // Siempre cache-bust para evitar respuestas stale del navegador
    const bust = this.cacheBuster || Date.now();
    this.api.getBlob(`/users/me/profile-picture/file?_t=${bust}`).subscribe({
      next: (blob) => {
        this.revokeBlobUrl();
        this.currentBlobUrl = URL.createObjectURL(blob);
        this.profilePictureUrl.set(this.currentBlobUrl);
      },
      error: () => {
        this.profilePictureUrl.set(null);
      }
    });
  }

  private revokeBlobUrl(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  /**
   * Limpia el cache sin recargar. Usado en logout para evitar datos stale entre usuarios.
   */
  reset(): void {
    this.loaded = false;
    this.revokeBlobUrl();
    this.profilePictureUrl.set(null);
  }

  refresh(): void {
    this.reset();
    this.cacheBuster = Date.now();
    this.loadProfilePicture();
  }
}
