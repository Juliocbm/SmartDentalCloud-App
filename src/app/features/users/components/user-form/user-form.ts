import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { UsersService } from '../../services/users.service';
import { RolesService } from '../../services/roles.service';
import { LocationsService } from '../../../settings/services/locations.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { Role } from '../../models/role.models';
import { LocationSummary } from '../../../settings/models/location.models';
import { UserFormContextService } from '../../services/user-form-context.service';

interface UserFormValue {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  specialty: string;
  professionalLicense: string;
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.scss']
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private locationsService = inject(LocationsService);
  private logger = inject(LoggingService);
  private contextService = inject(UserFormContextService);

  backRoute = computed(() => this.contextService.context().returnUrl);

  userForm!: FormGroup;
  roles = signal<Role[]>([]);
  selectedRoles = signal<Set<string>>(new Set());
  
  // Locations
  locations = signal<LocationSummary[]>([]);
  selectedLocations = signal<Set<string>>(new Set());
  loadingLocations = signal(false);
  hasMultipleLocations = computed(() => this.locations().length > 1);

  isEditMode = signal(false);
  userId = signal<string | null>(null);
  loading = signal(false);
  loadingRoles = signal(true);
  error = signal<string | null>(null);
  showPassword = signal(false);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const ctx = this.contextService.context();
    const isDentist = ctx.contextRole === 'Dentista';
    return [
      { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
      { label: isDentist ? 'Dentistas' : 'Usuarios', route: isDentist ? '/dentists' : '/users', icon: isDentist ? 'fa-user-doctor' : 'fa-users' },
      { label: this.isEditMode() ? 'Editar' : 'Nuevo' }
    ];
  });

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
    this.loadLocations();
    this.checkEditMode();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phoneNumber: [''],
      specialty: [''],
      professionalLicense: ['']
    });
  }

  private loadRoles(): void {
    this.loadingRoles.set(true);
    this.rolesService.getAll().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loadingRoles.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading roles:', err);
        this.error.set('Error al cargar roles');
        this.loadingRoles.set(false);
      }
    });
  }

  private loadLocations(): void {
    this.loadingLocations.set(true);
    this.locationsService.getSummaries().subscribe({
      next: (locations) => {
        this.locations.set(locations);
        this.loadingLocations.set(false);
      },
      error: () => this.loadingLocations.set(false)
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.userId.set(id);
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      this.loadUser(id);
    }
  }

  private loadUser(id: string): void {
    this.loading.set(true);
    this.usersService.getById(id).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          name: user.name,
          email: user.email,
          phoneNumber: user.profile?.phoneNumber || '',
          specialty: user.profile?.specialty || '',
          professionalLicense: user.profile?.professionalLicense || ''
        });
        
        const roleIds = new Set(user.roles.map(r => r.id));
        this.selectedRoles.set(roleIds);

        // Cargar ubicaciones asignadas al usuario
        this.usersService.getUserLocations(id).subscribe({
          next: (locs) => {
            this.selectedLocations.set(new Set(locs.map(l => l.id)));
          }
        });
        
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading user:', err);
        this.error.set('Error al cargar usuario');
        this.loading.set(false);
      }
    });
  }

  toggleRole(roleId: string): void {
    const selected = new Set(this.selectedRoles());
    if (selected.has(roleId)) {
      selected.delete(roleId);
    } else {
      selected.add(roleId);
    }
    this.selectedRoles.set(selected);
  }

  isRoleSelected(roleId: string): boolean {
    return this.selectedRoles().has(roleId);
  }

  toggleLocation(locationId: string): void {
    const selected = new Set(this.selectedLocations());
    if (selected.has(locationId)) {
      selected.delete(locationId);
    } else {
      selected.add(locationId);
    }
    this.selectedLocations.set(selected);
  }

  isLocationSelected(locationId: string): boolean {
    return this.selectedLocations().has(locationId);
  }

  hasRoleDoctor(): boolean {
    const doctorRole = this.roles().find(r => r.name === 'Dentista');
    return doctorRole ? this.selectedRoles().has(doctorRole.id) : false;
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }

    if (this.selectedRoles().size === 0) {
      this.error.set('Debes seleccionar al menos un rol');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.userForm.value as UserFormValue;
    
    if (this.isEditMode()) {
      this.updateUser(formValue);
    } else {
      this.createUser(formValue);
    }
  }

  private createUser(formValue: UserFormValue): void {
    const request = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      roleIds: Array.from(this.selectedRoles()),
      phoneNumber: formValue.phoneNumber || undefined,
      specialty: formValue.specialty || undefined,
      professionalLicense: formValue.professionalLicense || undefined
    };

    this.usersService.create(request).subscribe({
      next: (created) => {
        this.saveUserLocations(created.id!, () => this.router.navigate(['/users']));
      },
      error: (err) => {
        this.logger.error('Error creating user:', err);
        if (err.status === 409) {
          this.error.set('El email ya está registrado');
        } else if (err.status === 400) {
          this.error.set('Datos inválidos. Verifica el formulario');
        } else {
          this.error.set('Error al crear usuario. Intenta de nuevo');
        }
        this.loading.set(false);
      }
    });
  }

  private updateUser(formValue: UserFormValue): void {
    const id = this.userId();
    if (!id) return;

    const updateRequest = {
      name: formValue.name,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber || undefined,
      specialty: formValue.specialty || undefined,
      professionalLicense: formValue.professionalLicense || undefined
    };

    this.usersService.update(id, updateRequest).subscribe({
      next: () => {
        this.usersService.updateUserRoles(id, Array.from(this.selectedRoles())).subscribe({
          next: () => {
            this.saveUserLocations(id, () => this.router.navigate(['/users', id]));
          },
          error: (err) => {
            this.logger.error('Error updating roles:', err);
            this.error.set('Usuario actualizado pero error al actualizar roles');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        this.logger.error('Error updating user:', err);
        if (err.status === 409) {
          this.error.set('El email ya está registrado');
        } else {
          this.error.set('Error al actualizar usuario');
        }
        this.loading.set(false);
      }
    });
  }

  private saveUserLocations(userId: string, onSuccess: () => void): void {
    const locationIds = Array.from(this.selectedLocations());

    // Si no hay múltiples sucursales, no hay nada que guardar
    if (!this.hasMultipleLocations()) {
      onSuccess();
      return;
    }

    this.usersService.updateUserLocations(userId, locationIds).subscribe({
      next: () => onSuccess(),
      error: (err) => {
        this.logger.error('Error updating user locations:', err);
        // Partial success — user/roles saved, locations failed
        onSuccess();
      }
    });
  }

  cancel(): void {
    const returnUrl = this.contextService.getCurrentContext().returnUrl;
    this.contextService.resetContext();
    if (this.isEditMode()) {
      this.router.navigate(['/users', this.userId()]);
    } else {
      this.router.navigate([returnUrl]);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get nameControl() {
    return this.userForm.get('name');
  }

  get emailControl() {
    return this.userForm.get('email');
  }

  get passwordControl() {
    return this.userForm.get('password');
  }

  getRoleBadgeClass(roleName: string): string {
    const roleMap: Record<string, string> = {
      'Administrador': 'badge-admin',
      'Dentista': 'badge-doctor',
      'Recepcionista': 'badge-receptionist',
      'Asistente': 'badge-assistant'
    };
    return roleMap[roleName] || 'badge-default';
  }

  getRoleIcon(roleName: string): string {
    const iconMap: Record<string, string> = {
      'Administrador': 'fa-user-tie',
      'Dentista': 'fa-user-doctor',
      'Recepcionista': 'fa-clipboard-user',
      'Asistente': 'fa-hands-helping'
    };
    return iconMap[roleName] || 'fa-user';
  }
}
