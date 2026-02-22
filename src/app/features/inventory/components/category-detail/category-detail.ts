import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoriesService } from '../../services/categories.service';
import { Category } from '../../models/category.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './category-detail.html',
  styleUrls: ['./category-detail.scss']
})
export class CategoryDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private categoriesService = inject(CategoriesService);
  private logger = inject(LoggingService);
  private location = inject(Location);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory/categories' },
    { label: 'Categorías', route: '/inventory/categories' },
    { label: 'Detalle' }
  ];

  category = signal<Category | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCategory(id);
    } else {
      this.error.set('ID de categoría no proporcionado');
      this.loading.set(false);
    }
  }

  private loadCategory(id: string): void {
    this.loading.set(true);
    this.categoriesService.getById(id).subscribe({
      next: (category) => {
        this.category.set(category);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading category:', err);
        this.error.set('Error al cargar la categoría');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  editCategory(): void {
    const cat = this.category();
    if (!cat) return;
    this.router.navigate(['/inventory/categories', cat.id, 'edit']);
  }
}
