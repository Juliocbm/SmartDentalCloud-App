import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { LocationsService } from '../../services/locations.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UsersService } from '../../../users/services/users.service';
import { Location, LocationUser, CreateLocationRequest, UpdateLocationRequest } from '../../models/location.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

/**
 * Datos que recibe el modal de crear/editar sucursal
 */
export interface LocationFormModalData {
  location: Location | null;
}

interface DoctorOption {
  id: string;
  name: string;
  assigned: boolean;
}

/**
 * Modal para crear o editar una sucursal.
 * Invocado desde LocationListComponent vía ModalService.
 */
@Component({
  selector: 'app-location-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './location-form-modal.html',
  styleUrl: './location-form-modal.scss'
})
export class LocationFormModalComponent implements OnInit {
  private locationsService = inject(LocationsService);
  private usersService = inject(UsersService);
  private notifications = inject(NotificationService);

  // Inyectados por ModalService
  modalRef!: ModalRef<LocationFormModalData, boolean>;
  modalData!: LocationFormModalData;
  modalConfig!: ModalConfig<LocationFormModalData>;

  saving = signal(false);
  loadingDoctors = signal(false);

  // Form fields
  formName = signal('');
  formAddress = signal('');
  formPhone = signal('');
  formEmail = signal('');
  formIsDefault = signal(false);
  formSortOrder = signal(0);

  // Doctors assignment
  doctors = signal<DoctorOption[]>([]);

  get isEditing(): boolean {
    return this.modalData?.location !== null;
  }

  get modalTitle(): string {
    return this.isEditing ? 'Editar Sucursal' : 'Nueva Sucursal';
  }

  get modalSubtitle(): string {
    return this.isEditing
      ? this.modalData.location!.name
      : 'Registra una nueva ubicación física del consultorio';
  }

  ngOnInit(): void {
    const loc = this.modalData?.location;
    if (loc) {
      this.formName.set(loc.name);
      this.formAddress.set(loc.address);
      this.formPhone.set(loc.phone || '');
      this.formEmail.set(loc.email || '');
      this.formIsDefault.set(loc.isDefault);
      this.formSortOrder.set(loc.sortOrder);
      this.loadDoctors(loc.assignedUsers);
    } else {
      this.loadDoctors([]);
    }
  }

  private loadDoctors(assignedUsers: LocationUser[]): void {
    this.loadingDoctors.set(true);
    const assignedIds = new Set(assignedUsers.map(u => u.userId));

    this.usersService.getAll().subscribe({
      next: (users) => {
        this.doctors.set(
          users.map(u => ({
            id: u.id!,
            name: u.name,
            assigned: assignedIds.has(u.id!)
          }))
        );
        this.loadingDoctors.set(false);
      },
      error: (err: any) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar doctores'));
        this.loadingDoctors.set(false);
      }
    });
  }

  toggleDoctor(doctor: DoctorOption): void {
    this.doctors.update(list =>
      list.map(d => d.id === doctor.id ? { ...d, assigned: !d.assigned } : d)
    );
  }

  onSubmit(): void {
    if (this.saving() || !this.formName().trim() || !this.formAddress().trim()) return;
    this.saving.set(true);

    if (this.isEditing) {
      const data: UpdateLocationRequest = {
        id: this.modalData.location!.id,
        name: this.formName().trim(),
        address: this.formAddress().trim(),
        phone: this.formPhone().trim() || null,
        email: this.formEmail().trim() || null,
        isDefault: this.formIsDefault(),
        sortOrder: this.formSortOrder()
      };

      this.locationsService.update(data.id, data).subscribe({
        next: () => {
          this.saveUserAssignments(data.id);
        },
        error: (err) => {
          this.notifications.error(getApiErrorMessage(err));
          this.saving.set(false);
        }
      });
    } else {
      const data: CreateLocationRequest = {
        name: this.formName().trim(),
        address: this.formAddress().trim(),
        phone: this.formPhone().trim() || null,
        email: this.formEmail().trim() || null,
        isDefault: this.formIsDefault(),
        sortOrder: this.formSortOrder()
      };

      this.locationsService.create(data).subscribe({
        next: (created) => {
          this.saveUserAssignments(created.id);
        },
        error: (err) => {
          this.notifications.error(getApiErrorMessage(err));
          this.saving.set(false);
        }
      });
    }
  }

  private saveUserAssignments(locationId: string): void {
    const assignedIds = this.doctors()
      .filter(d => d.assigned)
      .map(d => d.id);

    this.locationsService.assignUsers(locationId, assignedIds).subscribe({
      next: () => {
        this.notifications.success(this.isEditing ? 'Sucursal actualizada' : 'Sucursal creada');
        this.saving.set(false);
        this.locationsService.refreshCache();
        this.modalRef.close(true);
      },
      error: () => {
        // Location saved but users failed — still notify partial success
        this.notifications.success(this.isEditing ? 'Sucursal actualizada (error al asignar doctores)' : 'Sucursal creada (error al asignar doctores)');
        this.saving.set(false);
        this.locationsService.refreshCache();
        this.modalRef.close(true);
      }
    });
  }

  onClose(): void {
    this.modalRef.close();
  }
}
