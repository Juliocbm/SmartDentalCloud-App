import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss'
})
export class SkeletonComponent {
  @Input() type: 'text' | 'title' | 'avatar' | 'thumbnail' | 'button' | 'badge' = 'text';
  @Input() width: string = '100%';
  @Input() height: string = '';
  @Input() repeat: number = 1;
  @Input() animated: boolean = true;

  get items(): number[] {
    return Array.from({ length: this.repeat }, (_, i) => i);
  }
}
