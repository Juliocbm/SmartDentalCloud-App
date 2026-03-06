import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  templateUrl: './skeleton-table.html',
  styleUrl: './skeleton.scss'
})
export class SkeletonTableComponent {
  @Input() rows: number = 5;
  @Input() columns: number = 4;

  get rowItems(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }

  get colItems(): number[] {
    return Array.from({ length: this.columns }, (_, i) => i);
  }
}
