import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RolesService } from '../../services/roles.service';
import { PermissionSelectorComponent } from '../../../../shared/components/permission-selector/permission-selector';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PermissionSelectorComponent],
  templateUrl: './role-form.html',
  styleUrls: ['./role-form.scss']
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private rolesService = inject(RolesService);

  roleForm!: FormGroup;
  selectedPermissions = signal<string[]>([]);
  
  isEditMode = signal(false);
  roleId = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

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
        console.error('Error loading role:', err);
        this.error.set('Error al cargar rol');
        this.loading.set(false);
      }
    });
  }

  onPermissionsChange(permissions: string[]): void {
    this.selectedPermissions.set(permissions);
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.markFormGroupTouched(this.roleForm);
      return;
    }

    if (this.selectedPermissions().length === 0) {
      this.error.set('Debes seleccionar al menos un permiso');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.roleForm.value;
    
    if (this.isEditMode()) {
      this.updateRole(formValue);
    } else {
      this.createRole(formValue);
    }
  }

  private createRole(formValue: any): void {
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
        console.error('Error creating role:', err);
        if (err.status === 409) {
          this.error.set('Ya existe un rol con ese nombre');
        } else {
          this.error.set('Error al crear rol. Intenta de nuevo');
        }
        this.loading.set(false);
      }
    });
  }

  private updateRole(formValue: any): void {
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
            console.error('Error updating permissions:', err);
            this.error.set('Rol actualizado pero error al actualizar permisos');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error updating role:', err);
        if (err.status === 409) {
          this.error.set('Ya existe un rol con ese nombre');
        } else {
          this.error.set('Error al actualizar rol');
        }
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/users/roles']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get nameControl() {
    return this.roleForm.get('name');
  }

  get descriptionControl() {
    return this.roleForm.get('description');
  }
}
