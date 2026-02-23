import { Component, inject, computed, signal, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { AuthService } from '../../../core/services/auth.service';
import { LoggingService } from '../../../core/services/logging.service';
import { GlobalSearchService } from '../../../core/services/global-search.service';
import { GlobalSearchResult, SearchResultItem } from '../../../core/models/search.models';
import { NotificationsApiService } from '../../../features/notifications/services/notifications.service';
import { AppNotification } from '../../../features/notifications/models/notification.models';
import { UserProfileCacheService } from '../../../core/services/user-profile-cache.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private logger = inject(LoggingService);
  private searchService = inject(GlobalSearchService);
  private router = inject(Router);

  private elementRef = inject(ElementRef);
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  showNotifications = false;
  showUserMenu = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.showNotifications = false;
      this.showUserMenu = false;
      this.showSearchDropdown.set(false);
    }
  }

  // Search state
  searchTerm = signal('');
  searchResults = signal<GlobalSearchResult | null>(null);
  searchLoading = signal(false);
  showSearchDropdown = signal(false);
  private searchSubject = new Subject<string>();
  private keyboardListener: ((e: KeyboardEvent) => void) | null = null;

  private notificationsService = inject(NotificationsApiService);
  private profileCache = inject(UserProfileCacheService);
  profilePictureUrl = this.profileCache.profilePictureUrl;

  currentUser = this.authService.currentUser;
  userName = computed(() => this.currentUser()?.name || 'Usuario');
  userEmail = computed(() => this.currentUser()?.email || '');

  // Notifications state
  notifications = signal<AppNotification[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2) {
          this.searchResults.set(null);
          this.searchLoading.set(false);
          this.showSearchDropdown.set(false);
          return of(null);
        }
        this.searchLoading.set(true);
        return this.searchService.search(term);
      })
    ).subscribe({
      next: (result) => {
        this.searchResults.set(result);
        this.searchLoading.set(false);
        this.showSearchDropdown.set(result !== null && result.totalResults > 0);
      },
      error: (err) => {
        this.logger.error('Search error:', err);
        this.searchLoading.set(false);
      }
    });

    // Load profile picture and notifications
    this.profileCache.loadProfilePicture();
    this.loadNotifications();

    // Ctrl+K keyboard shortcut
    this.keyboardListener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.focusSearch();
      }
      if (e.key === 'Escape') {
        this.closeSearchDropdown();
      }
    };
    document.addEventListener('keydown', this.keyboardListener);
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    if (this.keyboardListener) {
      document.removeEventListener('keydown', this.keyboardListener);
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.searchResults.set(null);
    this.showSearchDropdown.set(false);
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
      this.searchInput.nativeElement.focus();
    }
  }

  focusSearch(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
      this.searchInput.nativeElement.select();
    }
  }

  closeSearchDropdown(): void {
    this.showSearchDropdown.set(false);
    if (this.searchInput) {
      this.searchInput.nativeElement.blur();
    }
  }

  onSearchFocus(): void {
    const results = this.searchResults();
    if (results && results.totalResults > 0) {
      this.showSearchDropdown.set(true);
    }
    this.showNotifications = false;
    this.showUserMenu = false;
  }

  onSearchBlur(): void {
    setTimeout(() => this.showSearchDropdown.set(false), 200);
  }

  navigateToResult(item: SearchResultItem): void {
    this.showSearchDropdown.set(false);
    this.router.navigateByUrl(item.route);
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
    this.showSearchDropdown.set(false);
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.notificationsService.getNotifications().subscribe({
      next: (data) => this.notifications.set(data),
      error: (err) => this.logger.error('Error loading notifications:', err)
    });
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => ({ ...n, isRead: true }))
        );
      },
      error: (err) => this.logger.error('Error marking notifications as read:', err)
    });
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
    this.showSearchDropdown.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Navegación al login se maneja en el servicio
      },
      error: (error) => {
        this.logger.error('Error during logout:', error);
        // Aún así limpiar sesión local
        localStorage.clear();
        window.location.href = '/login';
      }
    });
  }
}
