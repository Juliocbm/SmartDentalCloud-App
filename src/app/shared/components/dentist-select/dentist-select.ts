import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { DentistListItem } from '../../../core/models/user.models';

@Component({
  selector: 'app-dentist-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dentist-select.html',
  styleUrl: './dentist-select.scss'
})
export class DentistSelectComponent implements OnInit {
  private usersService = inject(UsersService);

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

    if (this.selectedDentistId) {
      this.selectControl.setValue(this.selectedDentistId);
    }
  }

  loadDentists() {
    this.loading.set(true);
    this.usersService.getDentists().subscribe({
      next: (dentists) => {
        this.dentists.set(dentists);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading dentists:', error);
        this.loading.set(false);
      }
    });
  }
}
