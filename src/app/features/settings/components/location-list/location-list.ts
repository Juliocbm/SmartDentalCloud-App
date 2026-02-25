import { Component, OnInit, signal, inject } from '@angular/core';
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

  ngOnInit(): void {
    this.loadLocations();
  }

  private loadLocations(): void {
    this.loading.set(true);
    this.locationsService.getAll().subscribe({
      next: (data) => {
        this.locations.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error('Error al cargar las sucursales');
        this.loading.set(false);
      }
    });
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
