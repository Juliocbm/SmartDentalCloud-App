import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location as NgLocation } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LocationsService } from '../../services/locations.service';
import { Location } from '../../models/location.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { LocationFormModalComponent, LocationFormModalData } from '../location-form-modal/location-form-modal';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-location-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent],
  templateUrl: './location-detail.html',
  styleUrl: './location-detail.scss'
})
export class LocationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ngLocation = inject(NgLocation);
  private locationsService = inject(LocationsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private modalService = inject(ModalService);

  location = signal<Location | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showAuditModal = signal(false);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Configuración', route: '/settings', icon: 'fa-gear' },
    { label: 'Sucursal' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadLocation(id);
    } else {
      this.error.set('ID de sucursal no proporcionado');
      this.loading.set(false);
    }
  }

  private loadLocation(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.locationsService.getById(id).subscribe({
      next: (location) => {
        this.location.set(location);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading location:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.ngLocation.back();
  }

  openEditModal(): void {
    const loc = this.location();
    if (!loc) return;

    const ref = this.modalService.open<LocationFormModalData, boolean>(
      LocationFormModalComponent,
      { data: { location: loc } }
    );

    ref.afterClosed().subscribe(saved => {
      if (saved) {
        this.loadLocation(loc.id);
      }
    });
  }
}
