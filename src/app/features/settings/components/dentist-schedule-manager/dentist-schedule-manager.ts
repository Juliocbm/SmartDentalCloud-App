import { Component, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DentistListItem } from '../../../../core/models/user.models';
import { DentistAutocompleteComponent } from '../../../../shared/components/dentist-autocomplete/dentist-autocomplete';
import { LocationAutocompleteComponent } from '../../../../shared/components/location-autocomplete/location-autocomplete';
import { LocationSummary } from '../../../settings/models/location.models';
import { LocationsService } from '../../services/locations.service';
import { WorkScheduleEditorComponent } from '../work-schedule-editor/work-schedule-editor';

@Component({
  selector: 'app-dentist-schedule-manager',
  standalone: true,
  imports: [CommonModule, DentistAutocompleteComponent, LocationAutocompleteComponent, WorkScheduleEditorComponent],
  templateUrl: './dentist-schedule-manager.html',
  styleUrl: './dentist-schedule-manager.scss'
})
export class DentistScheduleManagerComponent {
  locationsService = inject(LocationsService);

  selectedDentistId = signal<string | null>(null);
  selectedLocationId = signal<string | null>(null);
  private selectedDentist = signal<DentistListItem | null>(null);

  editorRef = viewChild(WorkScheduleEditorComponent);

  selectedDentistName(): string {
    return this.selectedDentist()?.name ?? '';
  }

  onDentistSelected(dentist: DentistListItem | null): void {
    this.selectedDentist.set(dentist);
    this.selectedDentistId.set(dentist?.id ?? null);
    setTimeout(() => {
      this.editorRef()?.loadSchedule();
    });
  }

  onLocationSelected(location: LocationSummary | null): void {
    this.selectedLocationId.set(location?.id ?? null);
    setTimeout(() => {
      this.editorRef()?.loadSchedule();
    });
  }
}
