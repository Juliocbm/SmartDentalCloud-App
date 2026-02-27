import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { CephTracerComponent } from '../../cephalometry-module/components/ceph-tracer/ceph-tracer.component';

@Component({
  selector: 'app-cephalometry-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, CephTracerComponent],
  templateUrl: './cephalometry-page.html',
  styleUrl: './cephalometry-page.scss'
})
export class CephalometryPageComponent {
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Cefalometría' }
  ];
}
