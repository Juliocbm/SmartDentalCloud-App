import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SuppliersService } from '../../services/suppliers.service';
import { Supplier } from '../../models/supplier.models';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './supplier-list.html',
  styleUrls: ['./supplier-list.scss']
})
export class SupplierListComponent implements OnInit, OnDestroy {
  private suppliersService = inject(SuppliersService);
  private searchSubject = new Subject<string>();

  suppliers = signal<Supplier[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');

  breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Inicio', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory', icon: 'fa-boxes-stacked' },
    { label: 'Proveedores', route: '/inventory/suppliers', icon: 'fa-truck' }
  ]);

  filteredSuppliers = computed(() => {
    let result = this.suppliers();

    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.code.toLowerCase().includes(search) ||
        (s.contactName && s.contactName.toLowerCase().includes(search)) ||
        (s.email && s.email.toLowerCase().includes(search)) ||
        (s.phone && s.phone.toLowerCase().includes(search))
      );
    }

    const status = this.filterStatus();
    if (status === 'active') {
      result = result.filter(s => s.isActive);
    } else if (status === 'inactive') {
      result = result.filter(s => !s.isActive);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadData();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.suppliersService.getAll().subscribe({
      next: (suppliers) => {
        this.suppliers.set(suppliers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.error.set('Error al cargar proveedores. Por favor, intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(status: 'all' | 'active' | 'inactive'): void {
    this.filterStatus.set(status);
  }

  deleteSupplier(id: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      return;
    }

    this.suppliersService.delete(id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        console.error('Error deleting supplier:', err);
        alert('Error al eliminar proveedor');
      }
    });
  }
}
