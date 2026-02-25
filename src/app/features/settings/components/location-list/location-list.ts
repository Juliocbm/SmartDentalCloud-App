import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationsService } from '../../services/locations.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { Location } from '../../models/location.models';
import { LocationFormModalComponent, LocationFormModalData } from '../location-form-modal/location-form-modal';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-list.html',
  styleUrl: './location-list.scss'
})
export class LocationListComponent implements OnInit {
  private locationsService = inject(LocationsService);
  private notifications = inject(NotificationService);
  private modalService = inject(ModalService);

  locations = signal<Location[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  totalPages = computed(() => Math.ceil(this.locations().length / this.pageSize()) || 1);

  paginatedLocations = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.locations().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading.set(true);
    this.error.set(null);
    this.locationsService.getAll().subscribe({
      next: (data) => {
        this.locations.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las sucursales. Por favor, intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPaginationPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxVisible = 5;
    const pages: number[] = [];
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  openCreateModal(): void {
    this.openLocationModal(null);
  }

  openEditModal(location: Location): void {
    this.openLocationModal(location);
  }

  private openLocationModal(location: Location | null): void {
    const ref = this.modalService.open<LocationFormModalData, boolean>(
      LocationFormModalComponent,
      { data: { location } }
    );

    ref.afterClosed().subscribe(saved => {
      if (saved) {
        this.loadLocations();
      }
    });
  }

  deleteLocation(location: Location): void {
    if (location.isDefault) {
      this.notifications.error('No se puede eliminar la sucursal predeterminada');
      return;
    }

    this.locationsService.delete(location.id).subscribe({
      next: () => {
        this.notifications.success('Sucursal desactivada');
        this.loadLocations();
        this.locationsService.refreshCache();
      },
      error: () => {
        this.notifications.error('Error al desactivar la sucursal');
      }
    });
  }
}
