import { Component, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() showBackButton: boolean = false;
  @Input() backRoute?: string;
  @Input() breadcrumbs: BreadcrumbItem[] = [];

  constructor(
    private location: Location,
    private router: Router
  ) {}

  onBackClick(): void {
    if (this.backRoute) {
      this.router.navigate([this.backRoute]);
    } else {
      this.location.back();
    }
  }

  navigateToBreadcrumb(route?: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }
}
