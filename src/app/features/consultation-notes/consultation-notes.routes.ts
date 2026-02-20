import { Routes } from '@angular/router';
import { ConsultationNotesService } from './services/consultation-notes.service';

export const CONSULTATION_NOTES_ROUTES: Routes = [
  {
    path: '',
    providers: [ConsultationNotesService],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/consultation-note-list/consultation-note-list').then(m => m.ConsultationNoteListComponent)
      },
      {
        path: 'appointment/:appointmentId',
        loadComponent: () =>
          import('./components/consultation-note-view/consultation-note-view').then(m => m.ConsultationNoteViewComponent)
      }
    ]
  }
];
