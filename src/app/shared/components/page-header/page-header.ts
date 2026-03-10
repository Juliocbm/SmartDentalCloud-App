import { Component, Input, signal, ChangeDetectionStrategy, ViewEncapsulation, HostListener, ElementRef, inject, OnInit, OnDestroy } from '@angular/core';
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
export class PageHeaderComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() showBackButton: boolean = false;
  @Input() backRoute?: string;
  @Input() defaultBackRoute?: string;
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() sticky: boolean = false;

  private location = inject(Location);
  private router = inject(Router);
  private el = inject(ElementRef);
  private scrollHandler?: () => void;

  ngOnInit(): void {
    if (this.sticky) {
      this.el.nativeElement.querySelector('.page-header')?.classList.add('page-header--sticky');
      this.scrollHandler = () => {
        const el = this.el.nativeElement.querySelector('.page-header');
        if (el) {
          el.classList.toggle('is-scrolled', window.scrollY > 10);
        }
      };
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
  }

  ngOnDestroy(): void {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }

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
