import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiService = inject(ApiService);

  private readonly favoriteIds = signal<string[]>([]);

  favorites = this.favoriteIds.asReadonly();

  isFavorite = (menuItemId: string): boolean => {
    return this.favoriteIds().includes(menuItemId);
  };

  hasFavorites = computed(() => this.favoriteIds().length > 0);

  loadFavorites(): void {
    this.apiService.get<string[]>('/favorites').subscribe({
      next: (ids) => this.favoriteIds.set(ids),
      error: () => this.favoriteIds.set([])
    });
  }

  toggleFavorite(menuItemId: string): void {
    if (this.isFavorite(menuItemId)) {
      this.removeFavorite(menuItemId);
    } else {
      this.addFavorite(menuItemId);
    }
  }

  private addFavorite(menuItemId: string): void {
    // Optimistic update
    this.favoriteIds.update(ids => [...ids, menuItemId]);

    this.apiService.post(`/favorites/${menuItemId}`, {}).subscribe({
      error: () => {
        // Revert on error
        this.favoriteIds.update(ids => ids.filter(id => id !== menuItemId));
      }
    });
  }

  private removeFavorite(menuItemId: string): void {
    // Optimistic update
    this.favoriteIds.update(ids => ids.filter(id => id !== menuItemId));

    this.apiService.delete(`/favorites/${menuItemId}`).subscribe({
      error: () => {
        // Revert on error
        this.favoriteIds.update(ids => [...ids, menuItemId]);
      }
    });
  }
}
