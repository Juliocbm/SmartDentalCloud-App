import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { DoctorListItem } from '../../../core/models/user.models';

@Component({
  selector: 'app-doctor-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './doctor-select.html',
  styleUrl: './doctor-select.scss'
})
export class DoctorSelectComponent implements OnInit {
  private usersService = inject(UsersService);

  @Input() selectedDoctorId: string | null = null;
  @Input() placeholder = 'Seleccionar doctor...';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error: string | null = null;

  @Output() doctorSelected = new EventEmitter<DoctorListItem | null>();

  selectControl = new FormControl<string | null>(null);
  doctors = signal<DoctorListItem[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadDoctors();
    
    this.selectControl.valueChanges.subscribe(doctorId => {
      const doctor = this.doctors().find(d => d.id === doctorId);
      this.doctorSelected.emit(doctor || null);
    });

    if (this.selectedDoctorId) {
      this.selectControl.setValue(this.selectedDoctorId);
    }
  }

  loadDoctors() {
    this.loading.set(true);
    this.usersService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.loading.set(false);
      }
    });
  }
}
