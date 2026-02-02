import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { CategoriesService } from '../../services/categories.service';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../models/category.models';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './category-form.html',
  styleUrls: ['./category-form.scss']
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private categoriesService = inject(CategoriesService);

  categoryForm!: FormGroup;
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  categoryId = signal<string | null>(null);
  isEditMode = computed(() => !!this.categoryId());

  categories = signal<Category[]>([]);

  breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Inicio', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory', icon: 'fa-boxes-stacked' },
    { label: 'Categorías', route: '/inventory/categories', icon: 'fa-tags' },
    { label: 'Nueva Categoría', route: '', icon: 'fa-plus' }
  ]);

  ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoryId.set(id);
      this.breadcrumbItems.update(items => {
        items[items.length - 1] = { label: 'Editar Categoría', route: '', icon: 'fa-pen' };
        return items;
      });
      this.loadCategory(id);
    }
  }

  private initializeForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      parentCategoryId: [null],
      isActive: [true]
    });
  }

  private loadCategories(): void {
    this.categoriesService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories.filter(c => c.isActive));
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  private loadCategory(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.categoriesService.getById(id).subscribe({
      next: (category) => {
        if (category) {
          this.categoryForm.patchValue({
            name: category.name,
            description: category.description,
            parentCategoryId: category.parentCategoryId,
            isActive: category.isActive
          });
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading category:', err);
        this.error.set('Error al cargar la categoría. Por favor, intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const formValue = this.categoryForm.value;

    if (this.isEditMode()) {
      const updateData: UpdateCategoryRequest = {
        name: formValue.name,
        description: formValue.description || null,
        parentCategoryId: formValue.parentCategoryId || null,
        isActive: formValue.isActive
      };

      this.categoriesService.update(this.categoryId()!, updateData).subscribe({
        next: () => {
          this.router.navigate(['/inventory/categories']);
        },
        error: (err) => {
          console.error('Error updating category:', err);
          this.error.set('Error al actualizar la categoría. Por favor, intenta de nuevo.');
          this.saving.set(false);
        }
      });
    } else {
      const createData: CreateCategoryRequest = {
        name: formValue.name,
        description: formValue.description || null,
        parentCategoryId: formValue.parentCategoryId || null
      };

      this.categoriesService.create(createData).subscribe({
        next: () => {
          this.router.navigate(['/inventory/categories']);
        },
        error: (err) => {
          console.error('Error creating category:', err);
          this.error.set('Error al crear la categoría. Por favor, intenta de nuevo.');
          this.saving.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/inventory/categories']);
  }

  hasError(field: string, error: string): boolean {
    const control = this.categoryForm.get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}
