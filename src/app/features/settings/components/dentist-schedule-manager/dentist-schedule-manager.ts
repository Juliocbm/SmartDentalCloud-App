import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../../core/services/users.service';
import { DentistListItem } from '../../../../core/models/user.models';
import { WorkScheduleEditorComponent } from '../work-schedule-editor/work-schedule-editor';

@Component({
  selector: 'app-dentist-schedule-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkScheduleEditorComponent],
  templateUrl: './dentist-schedule-manager.html',
  styleUrl: './dentist-schedule-manager.scss'
})
export class DentistScheduleManagerComponent implements OnInit {
  private usersService = inject(UsersService);

  dentists = signal<DentistListItem[]>([]);
  selectedDentistId = signal<string | null>(null);
  loadingDentists = signal(false);

  editorRef = viewChild(WorkScheduleEditorComponent);

  selectedDentistName(): string {
    const id = this.selectedDentistId();
    if (!id) return '';
    const d = this.dentists().find(d => d.id === id);
    return d?.name ?? '';
  }

  ngOnInit(): void {
    this.loadDentists();
  }

  private loadDentists(): void {
    this.loadingDentists.set(true);
    this.usersService.getDentists().subscribe({
      next: (dentists) => {
        this.dentists.set(dentists);
        this.loadingDentists.set(false);
      },
      error: () => {
        this.dentists.set([]);
        this.loadingDentists.set(false);
      }
    });
  }

  onDentistChange(dentistId: string): void {
    this.selectedDentistId.set(dentistId || null);
    // Reload the editor when dentist changes
    setTimeout(() => {
      this.editorRef()?.loadSchedule();
    });
  }
}
