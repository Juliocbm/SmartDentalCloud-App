import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DentalServicesService } from '../../services/dental-services.service';
import { DentalService } from '../../models/service.models';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-service-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-select.html',
  styleUrl: './service-select.scss'
})
export class ServiceSelectComponent implements OnInit {
  private dentalServicesService = inject(DentalServicesService);
  private logger = inject(LoggingService);

  @Input() disabled = false;
  @Input() placeholder = 'Buscar servicio del catálogo...';

  @Output() serviceSelected = new EventEmitter<DentalService | null>();

  searchControl = new FormControl('');
  allServices = signal<DentalService[]>([]);
  filteredServices = signal<DentalService[]>([]);
  loading = signal(false);
  showDropdown = signal(false);
  selectedService = signal<DentalService | null>(null);

  ngOnInit(): void {
    this.loadServices();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe(search => {
        if (!search || search.length < 1) {
          this.filteredServices.set(this.allServices());
          this.showDropdown.set(false);
        } else {
          const term = search.toLowerCase();
          this.filteredServices.set(
            this.allServices().filter(s =>
              s.name.toLowerCase().includes(term) ||
              (s.description && s.description.toLowerCase().includes(term)) ||
              (s.claveProdServ && s.claveProdServ.includes(term))
            )
          );
          if (!this.selectedService()) {
            this.showDropdown.set(true);
          }
        }
      });
  }

  private loadServices(): void {
    this.loading.set(true);
    this.dentalServicesService.getAll().subscribe({
      next: (services) => {
        const active = services.filter(s => s.isActive);
        this.allServices.set(active);
        this.filteredServices.set(active);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading dental services:', err);
        this.loading.set(false);
      }
    });
  }

  selectService(service: DentalService): void {
    this.selectedService.set(service);
    this.searchControl.setValue(service.name, { emitEvent: false });
    this.showDropdown.set(false);
    this.serviceSelected.emit(service);
  }

  clearSelection(): void {
    this.selectedService.set(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.filteredServices.set(this.allServices());
    this.showDropdown.set(false);
    this.serviceSelected.emit(null);
  }

  onFocus(): void {
    if (!this.selectedService() && this.allServices().length > 0) {
      this.filteredServices.set(this.allServices());
      this.showDropdown.set(true);
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }
}
