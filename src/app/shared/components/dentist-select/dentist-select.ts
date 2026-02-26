import { Component, Input, Output, EventEmitter, signal, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { DentistListItem } from '../../../core/models/user.models';
import { LoggingService } from '../../../core/services/logging.service';

@Component({
  selector: 'app-dentist-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dentist-select.html',
  styleUrl: './dentist-select.scss'
})
export class DentistSelectComponent implements OnInit, OnChanges {
  private usersService = inject(UsersService);
  private logger = inject(LoggingService);

  @Input() selectedDentistId: string | null = null;
  @Input() placeholder = 'Seleccionar dentista...';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error: string | null = null;

  @Output() dentistSelected = new EventEmitter<DentistListItem | null>();

  selectControl = new FormControl<string | null>(null);
  dentists = signal<DentistListItem[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadDentists();
    
    this.selectControl.valueChanges.subscribe(dentistId => {
      const dentist = this.dentists().find(d => d.id === dentistId);
      this.dentistSelected.emit(dentist || null);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedDentistId'] && this.selectedDentistId) {
      this.selectControl.setValue(this.selectedDentistId, { emitEvent: false });
    }
  }

  loadDentists() {
    this.loading.set(true);
    this.usersService.getDentists().subscribe({
      next: (dentists) => {
        this.dentists.set(dentists);
        this.loading.set(false);
        if (this.selectedDentistId) {
          setTimeout(() => {
            this.selectControl.setValue(this.selectedDentistId, { emitEvent: false });
          });
        }
      },
      error: (error) => {
        this.logger.error('Error loading dentists:', error);
        this.loading.set(false);
      }
    });
  }
}
