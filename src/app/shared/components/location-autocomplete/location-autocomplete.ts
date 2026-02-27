import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { LocationsService } from '../../../features/settings/services/locations.service';
import { LocationSummary } from '../../../features/settings/models/location.models';
import { LoggingService } from '../../../core/services/logging.service';

@Component({
  selector: 'app-location-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './location-autocomplete.html',
  styleUrl: './location-autocomplete.scss'
})
export class LocationAutocompleteComponent implements OnChanges {
  private locationsService = inject(LocationsService);
  private logger = inject(LoggingService);

  @Input() selectedLocationId: string | null = null;
  @Input() selectedLocationName: string | null = null;
  @Input() placeholder = 'Buscar sucursal...';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error: string | null = null;

  @Output() locationSelected = new EventEmitter<LocationSummary | null>();

  searchControl = new FormControl('');
  allLocations = signal<LocationSummary[]>([]);
  filteredLocations = signal<LocationSummary[]>([]);
  loading = signal(false);
  showDropdown = signal(false);
  selectedLocation = signal<LocationSummary | null>(null);

  visible = computed(() => this.locationsService.hasMultipleLocations());

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedLocationId'] && this.selectedLocationId && this.selectedLocationName) {
      this.selectedLocation.set({
        id: this.selectedLocationId,
        name: this.selectedLocationName,
        isDefault: false,
        maxConcurrentAppointments: null
      });
      this.searchControl.setValue(this.selectedLocationName, { emitEvent: false });
    }
  }

  constructor() {
    this.loadLocations();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe(search => {
        if (!search || search.length < 1) {
          this.filteredLocations.set([]);
          this.showDropdown.set(false);
          return;
        }

        const term = search.toLowerCase();
        const filtered = this.allLocations().filter(l =>
          l.name.toLowerCase().includes(term)
        );
        this.filteredLocations.set(filtered);
        this.showDropdown.set(filtered.length > 0);
      });
  }

  private loadLocations(): void {
    this.loading.set(true);
    this.locationsService.getSummaries().subscribe({
      next: (locations) => {
        this.allLocations.set(locations);
        this.loading.set(false);
      },
      error: (error) => {
        this.logger.error('Error loading locations:', error);
        this.loading.set(false);
      }
    });
  }

  selectLocation(location: LocationSummary): void {
    this.selectedLocation.set(location);
    this.searchControl.setValue(location.name, { emitEvent: false });
    this.filteredLocations.set([]);
    this.showDropdown.set(false);
    this.locationSelected.emit(location);
  }

  clearSelection(): void {
    this.selectedLocation.set(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.filteredLocations.set([]);
    this.showDropdown.set(false);
    this.locationSelected.emit(null);
  }

  onFocus(): void {
    const search = this.searchControl.value;
    if (search && search.length >= 1 && this.filteredLocations().length > 0) {
      this.showDropdown.set(true);
    } else if (!this.selectedLocation()) {
      // Show all locations when focusing empty input
      this.filteredLocations.set(this.allLocations());
      this.showDropdown.set(this.allLocations().length > 0);
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }
}
