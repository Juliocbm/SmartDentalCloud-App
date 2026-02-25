import { Component, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationsService } from '../../../features/settings/services/locations.service';

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-selector.html',
  styleUrl: './location-selector.scss'
})
export class LocationSelectorComponent {
  private locationsService = inject(LocationsService);

  locationId = input<string | null>(null);
  label = input<string>('Sucursal');
  showLabel = input<boolean>(true);
  locationChange = output<string | null>();

  locations = computed(() => this.locationsService.locationSummaries());
  visible = computed(() => this.locationsService.hasMultipleLocations());

  onSelectionChange(value: string): void {
    this.locationChange.emit(value || null);
  }
}
