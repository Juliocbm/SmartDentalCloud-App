import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { RolesService } from '../../services/roles.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PermissionSelectorComponent } from '../../../../shared/components/permission-selector/permission-selector';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { applyServerErrors, markFormGroupTouched, isFieldInvalid, getFieldError } from '../../../../core/utils/form-error.utils';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert';

interface RoleFormValue {
  name: string;
  description: string;
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PermissionSelectorComponent, PageHeaderComponent, FormAlertComponent],
  templateUrl: './role-form.html',
  styleUrls: ['./role-form.scss']
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private rolesService = inject(RolesService);
  private logger = inject(LoggingService);

  roleForm!: FormGroup;
  selectedPermissions = signal<string[]>([]);
  
  isEditMode = signal(false);
  roleId = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Usuarios', route: '/users', icon: 'fa-users' },
    { label: 'Roles', route: '/users/roles', icon: 'fa-shield-halved' },
    { label: this.isEditMode() ? 'Editar' : 'Nuevo' }
  ]);

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.roleId.set(id);
      this.loadRole(id);
    }
  }

  private loadRole(id: string): void {
    this.loading.set(true);
    this.rolesService.getById(id).subscribe({
      next: (role) => {
        this.roleForm.patchValue({
          name: role.name,
          description: role.description || ''
        });
        
        this.selectedPermissions.set(role.permissions || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading role:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onPermissionsChange(permissions: string[]): void {
    this.selectedPermissions.set(permissions);
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      markFormGroupTouched(this.roleForm);
      return;
    }

    if (this.selectedPermissions().length === 0) {
      this.error.set('Debes seleccionar al menos un permiso');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.roleForm.value as RoleFormValue;
    
    if (this.isEditMode()) {
      this.updateRole(formValue);
    } else {
      this.createRole(formValue);
    }
  }

  private createRole(formValue: RoleFormValue): void {
    const request = {
      name: formValue.name,
      description: formValue.description || undefined,
      permissionKeys: this.selectedPermissions()
    };

    this.rolesService.create(request).subscribe({
      next: () => {
        this.router.navigate(['/users/roles']);
      },
      error: (err) => {
        this.logger.error('Error creating role:', err);
        this.error.set(applyServerErrors(err, this.roleForm));
        this.loading.set(false);
      }
    });
  }

  private updateRole(formValue: RoleFormValue): void {
    const id = this.roleId();
    if (!id) return;

    const updateRequest = {
      name: formValue.name,
      description: formValue.description || undefined
    };

    this.rolesService.update(id, updateRequest).subscribe({
      next: () => {
        const permissionsRequest = {
          permissionKeys: this.selectedPermissions()
        };
        
        this.rolesService.updateRolePermissions(id, permissionsRequest).subscribe({
          next: () => {
            this.router.navigate(['/users/roles']);
          },
          error: (err) => {
            this.logger.error('Error updating permissions:', err);
            this.error.set('Rol actualizado pero error al actualizar permisos');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        this.logger.error('Error updating role:', err);
        this.error.set(applyServerErrors(err, this.roleForm));
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/users/roles']);
  }

  isFieldInvalid(field: string): boolean {
    return isFieldInvalid(this.roleForm, field);
  }

  getFieldError(field: string): string | null {
    return getFieldError(this.roleForm, field);
  }
}
