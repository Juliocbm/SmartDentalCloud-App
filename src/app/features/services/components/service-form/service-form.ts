import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ServicesService } from '../../services/services.service';
import { SERVICE_CATEGORIES } from '../../models/service.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent
  ],
  templateUrl: './service-form.html',
  styleUrl: './service-form.scss'
})
export class ServiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private servicesService = inject(ServicesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  form!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  serviceId = signal<string | null>(null);

  // Constants
  categoryOptions = SERVICE_CATEGORIES;

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Servicios', route: '/services' },
    { label: this.isEditMode() ? 'Editar Servicio' : 'Nuevo Servicio' }
  ]);

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      durationMinutes: [null],
      description: [''],
      category: [''],
      isActive: [true],
      requiresFollowUp: [false],
      followUpDays: [null],
      requiresAnesthesia: [false],
      isMultiSession: [false],
      estimatedSessions: [null],
      notes: [''],
      claveProdServ: [''],
      claveUnidad: ['']
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.serviceId.set(id);
      this.loadService(id);
    }
  }

  private loadService(id: string): void {
    this.loading.set(true);
    this.servicesService.getById(id).subscribe({
      next: (service) => {
        this.form.patchValue({
          name: service.name,
          cost: service.cost,
          durationMinutes: service.durationMinutes || null,
          description: service.description || '',
          category: service.category || '',
          isActive: service.isActive,
          requiresFollowUp: service.requiresFollowUp,
          followUpDays: service.followUpDays || null,
          requiresAnesthesia: service.requiresAnesthesia,
          isMultiSession: service.isMultiSession,
          estimatedSessions: service.estimatedSessions || null,
          notes: service.notes || '',
          claveProdServ: service.claveProdServ || '',
          claveUnidad: service.claveUnidad || ''
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading service for edit:', err);
        this.error.set('Error al cargar el servicio.');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    const request = {
      ...formValue,
      cost: Number(formValue.cost),
      durationMinutes: formValue.durationMinutes ? Number(formValue.durationMinutes) : undefined,
      followUpDays: formValue.followUpDays ? Number(formValue.followUpDays) : undefined,
      estimatedSessions: formValue.estimatedSessions ? Number(formValue.estimatedSessions) : undefined,
      category: formValue.category || undefined,
      description: formValue.description || undefined,
      notes: formValue.notes || undefined,
      claveProdServ: formValue.claveProdServ || undefined,
      claveUnidad: formValue.claveUnidad || undefined
    };

    if (this.isEditMode()) {
      const updateRequest = { id: this.serviceId()!, ...request };
      this.servicesService.update(this.serviceId()!, updateRequest).subscribe({
        next: () => {
          this.notifications.success('Servicio actualizado exitosamente');
          this.router.navigate(['/services']);
        },
        error: (err) => {
          this.logger.error('Error updating service:', err);
          this.error.set(err?.error?.message || 'Error al actualizar el servicio.');
          this.loading.set(false);
        }
      });
    } else {
      this.servicesService.create(request).subscribe({
        next: () => {
          this.notifications.success('Servicio creado exitosamente');
          this.router.navigate(['/services']);
        },
        error: (err) => {
          this.logger.error('Error creating service:', err);
          this.error.set(err?.error?.message || 'Error al crear el servicio.');
          this.loading.set(false);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/services']);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }
}
