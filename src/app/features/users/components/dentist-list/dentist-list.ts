import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { UsersService } from '../../services/users.service';
import { RolesService } from '../../services/roles.service';
import { User, Role } from '../../models/user.models';

@Component({
  selector: 'app-dentist-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PageHeaderComponent],
  templateUrl: './dentist-list.html',
  styleUrls: ['./dentist-list.scss']
})
export class DentistListComponent implements OnInit, OnDestroy {
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private searchSubject = new Subject<string>();

  dentists = signal<User[]>([]);
  filteredDentists = signal<User[]>([]);
  dentistRole = signal<Role | null>(null);
  
  loading = signal(true);
  error = signal<string | null>(null);
  
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Dentistas' }
  ];

  ngOnInit(): void {
    this.loadData();
    
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    Promise.all([
      this.usersService.getAll().toPromise(),
      this.rolesService.getAll().toPromise()
    ])
      .then(([users, roles]) => {
        // Encontrar el rol de Dentista
        const dentistRole = roles?.find(r => r.name === 'Dentista');
        this.dentistRole.set(dentistRole || null);
        
        // Filtrar solo usuarios con rol de Dentista
        const dentistUsers = users?.filter(user => 
          user.roles.some(r => r.name === 'Dentista')
        ) || [];
        
        this.dentists.set(dentistUsers);
        this.applyFilters();
        this.loading.set(false);
      })
      .catch(err => {
        console.error('Error loading dentists:', err);
        this.error.set('Error al cargar dentistas. Intenta de nuevo.');
        this.loading.set(false);
      });
  }

  applyFilters(): void {
    let filtered = [...this.dentists()];

    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(dentist =>
        dentist.name.toLowerCase().includes(search) ||
        dentist.email.toLowerCase().includes(search) ||
        dentist.profile?.specialty?.toLowerCase().includes(search)
      );
    }

    const status = this.filterStatus();
    if (status !== 'all') {
      filtered = filtered.filter(dentist =>
        status === 'active' ? dentist.isActive : !dentist.isActive
      );
    }

    this.filteredDentists.set(filtered);
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.filterStatus.set(value);
    this.applyFilters();
  }

  toggleDentistActive(dentist: User): void {
    if (confirm(`¿Estás seguro de ${dentist.isActive ? 'desactivar' : 'activar'} a ${dentist.name}?`)) {
      this.usersService.toggleActive(dentist.id).subscribe({
        next: (updatedUser) => {
          const index = this.dentists().findIndex(d => d.id === dentist.id);
          if (index !== -1) {
            const updated = [...this.dentists()];
            updated[index] = updatedUser;
            this.dentists.set(updated);
            this.applyFilters();
          }
        },
        error: (err) => {
          console.error('Error toggling dentist status:', err);
          alert('Error al cambiar el estado del dentista');
        }
      });
    }
  }
}
