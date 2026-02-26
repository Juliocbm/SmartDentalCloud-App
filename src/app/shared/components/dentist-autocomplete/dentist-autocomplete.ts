import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UsersService } from '../../../core/services/users.service';
import { DentistListItem } from '../../../core/models/user.models';
import { LoggingService } from '../../../core/services/logging.service';

@Component({
  selector: 'app-dentist-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dentist-autocomplete.html',
  styleUrl: './dentist-autocomplete.scss'
})
export class DentistAutocompleteComponent implements OnChanges {
  private usersService = inject(UsersService);
  private logger = inject(LoggingService);

  @Input() selectedDentistId: string | null = null;
  @Input() selectedDentistName: string | null = null;
  @Input() placeholder = 'Buscar dentista...';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error: string | null = null;

  @Output() dentistSelected = new EventEmitter<DentistListItem | null>();

  searchControl = new FormControl('');
  allDentists = signal<DentistListItem[]>([]);
  filteredDentists = signal<DentistListItem[]>([]);
  loading = signal(false);
  showDropdown = signal(false);
  selectedDentist = signal<DentistListItem | null>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedDentistId'] && this.selectedDentistId && this.selectedDentistName) {
      this.selectedDentist.set({
        id: this.selectedDentistId,
        name: this.selectedDentistName
      });
      this.searchControl.setValue(this.selectedDentistName, { emitEvent: false });
    }
  }

  constructor() {
    this.loadDentists();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe(search => {
        if (!search || search.length < 1) {
          this.filteredDentists.set([]);
          this.showDropdown.set(false);
          return;
        }

        const term = search.toLowerCase();
        const filtered = this.allDentists().filter(d =>
          d.name.toLowerCase().includes(term) ||
          (d.specialization && d.specialization.toLowerCase().includes(term))
        );
        this.filteredDentists.set(filtered);
        this.showDropdown.set(filtered.length > 0);
      });
  }

  private loadDentists(): void {
    this.loading.set(true);
    this.usersService.getDentists().subscribe({
      next: (dentists) => {
        this.allDentists.set(dentists);
        this.loading.set(false);
      },
      error: (error) => {
        this.logger.error('Error loading dentists:', error);
        this.loading.set(false);
      }
    });
  }

  selectDentist(dentist: DentistListItem): void {
    this.selectedDentist.set(dentist);
    this.searchControl.setValue(dentist.name, { emitEvent: false });
    this.filteredDentists.set([]);
    this.showDropdown.set(false);
    this.dentistSelected.emit(dentist);
  }

  clearSelection(): void {
    this.selectedDentist.set(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.filteredDentists.set([]);
    this.showDropdown.set(false);
    this.dentistSelected.emit(null);
  }

  onFocus(): void {
    const search = this.searchControl.value;
    if (search && search.length >= 1 && this.filteredDentists().length > 0) {
      this.showDropdown.set(true);
    } else if (!this.selectedDentist()) {
      // Show all dentists when focusing empty input
      this.filteredDentists.set(this.allDentists());
      this.showDropdown.set(this.allDentists().length > 0);
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }
}
