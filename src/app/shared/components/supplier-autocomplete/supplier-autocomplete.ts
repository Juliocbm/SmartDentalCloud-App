import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SuppliersService } from '../../../features/inventory/services/suppliers.service';
import { SupplierSummary } from '../../../features/inventory/models/supplier.models';
import { LoggingService } from '../../../core/services/logging.service';

@Component({
  selector: 'app-supplier-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-autocomplete.html',
  styleUrl: './supplier-autocomplete.scss'
})
export class SupplierAutocompleteComponent implements OnChanges {
  private suppliersService = inject(SuppliersService);
  private logger = inject(LoggingService);

  @Input() selectedSupplierId: string | null = null;
  @Input() selectedSupplierName: string | null = null;
  @Input() placeholder = 'Buscar proveedor...';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error: string | null = null;

  @Output() supplierSelected = new EventEmitter<SupplierSummary | null>();

  searchControl = new FormControl('');
  allSuppliers = signal<SupplierSummary[]>([]);
  filteredSuppliers = signal<SupplierSummary[]>([]);
  loading = signal(false);
  showDropdown = signal(false);
  selectedSupplier = signal<SupplierSummary | null>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedSupplierId'] && this.selectedSupplierId && this.selectedSupplierName) {
      this.selectedSupplier.set({
        id: this.selectedSupplierId,
        name: this.selectedSupplierName
      });
      this.searchControl.setValue(this.selectedSupplierName, { emitEvent: false });
    }
  }

  constructor() {
    this.loadSuppliers();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe(search => {
        if (!search || search.length < 1) {
          this.filteredSuppliers.set([]);
          this.showDropdown.set(false);
          return;
        }

        const term = search.toLowerCase();
        const filtered = this.allSuppliers().filter(s =>
          s.name.toLowerCase().includes(term) ||
          (s.contactName && s.contactName.toLowerCase().includes(term))
        );
        this.filteredSuppliers.set(filtered);
        this.showDropdown.set(filtered.length > 0);
      });
  }

  private loadSuppliers(): void {
    this.loading.set(true);
    this.suppliersService.getAll(true).subscribe({
      next: (suppliers) => {
        this.allSuppliers.set(suppliers.map(s => ({
          id: s.id,
          name: s.name,
          contactName: s.contactName
        })));
        this.loading.set(false);
      },
      error: (error) => {
        this.logger.error('Error loading suppliers:', error);
        this.loading.set(false);
      }
    });
  }

  selectSupplier(supplier: SupplierSummary): void {
    this.selectedSupplier.set(supplier);
    this.searchControl.setValue(supplier.name, { emitEvent: false });
    this.filteredSuppliers.set([]);
    this.showDropdown.set(false);
    this.supplierSelected.emit(supplier);
  }

  clearSelection(): void {
    this.selectedSupplier.set(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.filteredSuppliers.set([]);
    this.showDropdown.set(false);
    this.supplierSelected.emit(null);
  }

  onFocus(): void {
    const search = this.searchControl.value;
    if (search && search.length >= 1 && this.filteredSuppliers().length > 0) {
      this.showDropdown.set(true);
    } else if (!this.selectedSupplier()) {
      this.filteredSuppliers.set(this.allSuppliers());
      this.showDropdown.set(this.allSuppliers().length > 0);
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }
}
