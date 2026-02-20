import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UsersService } from '../../services/users.service';
import { UserProfile } from '../../models/user.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.scss'
})
export class MyProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  loading = signal(false);
  saving = signal(false);
  editing = signal(false);
  profile = signal<UserProfile | null>(null);

  // Form fields
  phoneNumber = signal('');
  alternateEmail = signal('');
  address = signal('');
  specialty = signal('');
  professionalLicense = signal('');
  yearsOfExperience = signal<number | null>(null);
  education = signal('');
  emergencyContactName = signal('');
  emergencyContactPhone = signal('');
  bio = signal('');

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const user = this.currentUser;
    if (!user) return;

    this.loading.set(true);
    this.usersService.getUserProfile(user.id).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.populateForm(profile);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading profile:', err);
        this.loading.set(false);
      }
    });
  }

  private populateForm(p: UserProfile): void {
    this.phoneNumber.set(p.phoneNumber || '');
    this.alternateEmail.set(p.alternateEmail || '');
    this.address.set(p.address || '');
    this.specialty.set(p.specialty || '');
    this.professionalLicense.set(p.professionalLicense || '');
    this.yearsOfExperience.set(p.yearsOfExperience || null);
    this.education.set(p.education || '');
    this.emergencyContactName.set(p.emergencyContactName || '');
    this.emergencyContactPhone.set(p.emergencyContactPhone || '');
    this.bio.set(p.bio || '');
  }

  toggleEdit(): void {
    this.editing.update(v => !v);
    if (this.editing() && this.profile()) {
      this.populateForm(this.profile()!);
    }
  }

  saveProfile(): void {
    const user = this.currentUser;
    if (!user || this.saving()) return;

    this.saving.set(true);
    const data: Partial<UserProfile> = {
      phoneNumber: this.phoneNumber().trim() || undefined,
      alternateEmail: this.alternateEmail().trim() || undefined,
      address: this.address().trim() || undefined,
      specialty: this.specialty().trim() || undefined,
      professionalLicense: this.professionalLicense().trim() || undefined,
      yearsOfExperience: this.yearsOfExperience() || undefined,
      education: this.education().trim() || undefined,
      emergencyContactName: this.emergencyContactName().trim() || undefined,
      emergencyContactPhone: this.emergencyContactPhone().trim() || undefined,
      bio: this.bio().trim() || undefined
    };

    this.usersService.updateUserProfile(user.id, data).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.editing.set(false);
        this.saving.set(false);
        this.notifications.success('Perfil actualizado correctamente');
      },
      error: () => {
        this.saving.set(false);
        this.notifications.error('Error al actualizar el perfil');
      }
    });
  }
}
