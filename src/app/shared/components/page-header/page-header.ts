import { Component, Input, signal, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() showBackButton: boolean = false;
  @Input() backRoute?: string;
  @Input() defaultBackRoute?: string;
  @Input() breadcrumbs: BreadcrumbItem[] = [];

  constructor(
    private location: Location,
    private router: Router
  ) {}

  onBackClick(): void {
    if (this.backRoute) {
      this.router.navigate([this.backRoute]);
    } else if (this.defaultBackRoute) {
      if (window.history.length > 1) {
        this.location.back();
      } else {
        this.router.navigate([this.defaultBackRoute]);
      }
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
