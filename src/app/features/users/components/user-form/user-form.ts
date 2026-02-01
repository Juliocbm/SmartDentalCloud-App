import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { RolesService } from '../../services/roles.service';
import { Role } from '../../models/role.models';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.scss']
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);

  userForm!: FormGroup;
  roles = signal<Role[]>([]);
  selectedRoles = signal<Set<string>>(new Set());
  
  isEditMode = signal(false);
  userId = signal<string | null>(null);
  loading = signal(false);
  loadingRoles = signal(true);
  error = signal<string | null>(null);
  showPassword = signal(false);

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
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
        console.error('Error loading roles:', err);
        this.error.set('Error al cargar roles');
        this.loadingRoles.set(false);
      }
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
        
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading user:', err);
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

  hasRoleDoctor(): boolean {
    const doctorRole = this.roles().find(r => r.name === 'Odontólogo');
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

    const formValue = this.userForm.value;
    
    if (this.isEditMode()) {
      this.updateUser(formValue);
    } else {
      this.createUser(formValue);
    }
  }

  private createUser(formValue: any): void {
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
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (err) => {
        console.error('Error creating user:', err);
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

  private updateUser(formValue: any): void {
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
            this.router.navigate(['/users', id]);
          },
          error: (err) => {
            console.error('Error updating roles:', err);
            this.error.set('Usuario actualizado pero error al actualizar roles');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error updating user:', err);
        if (err.status === 409) {
          this.error.set('El email ya está registrado');
        } else {
          this.error.set('Error al actualizar usuario');
        }
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/users', this.userId()]);
    } else {
      this.router.navigate(['/users']);
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
      'Odontólogo': 'badge-doctor',
      'Recepcionista': 'badge-receptionist',
      'Asistente': 'badge-assistant'
    };
    return roleMap[roleName] || 'badge-default';
  }

  getRoleIcon(roleName: string): string {
    const iconMap: Record<string, string> = {
      'Administrador': 'fa-user-tie',
      'Odontólogo': 'fa-user-doctor',
      'Recepcionista': 'fa-clipboard-user',
      'Asistente': 'fa-hands-helping'
    };
    return iconMap[roleName] || 'fa-user';
  }
}
