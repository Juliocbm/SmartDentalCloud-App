import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { CategoriesService } from '../../services/categories.service';
import { CategoryFormContextService } from '../../services/category-form-context.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../models/category.models';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ROUTES } from '../../../../core/constants/routes.constants';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

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
  private contextService = inject(CategoryFormContextService);
  private logger = inject(LoggingService);

  categoryForm!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  categoryId = signal<string | null>(null);
  isEditMode = computed(() => !!this.categoryId());

  categories = signal<Category[]>([]);
  backRoute = computed(() => this.contextService.context().returnUrl);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Inventario', route: ROUTES.INVENTORY, icon: 'fa-boxes-stacked' },
    { label: 'Categorías', route: ROUTES.INVENTORY_CATEGORIES, icon: 'fa-tags' },
    { label: this.isEditMode() ? 'Editar' : 'Nueva' }
  ]);

  ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();
    this.loadContext();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoryId.set(id);
      this.loadCategory(id);
    }
  }

  private loadContext(): void {
    const context = this.contextService.getCurrentContext();
    
    if (context.preselectedParentCategoryId) {
      this.categoryForm.patchValue({
        parentCategoryId: context.preselectedParentCategoryId
      });
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
        this.logger.error('Error loading categories:', err);
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
        this.logger.error('Error loading category:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
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
          const returnUrl = this.contextService.getCurrentContext().returnUrl;
          this.contextService.resetContext();
          this.router.navigate([returnUrl]);
        },
        error: (err) => {
          this.logger.error('Error updating category:', err);
          this.error.set(getApiErrorMessage(err));
          this.loading.set(false);
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
          const returnUrl = this.contextService.getCurrentContext().returnUrl;
          this.contextService.resetContext();
          this.router.navigate([returnUrl]);
        },
        error: (err) => {
          this.logger.error('Error creating category:', err);
          this.error.set(getApiErrorMessage(err));
          this.loading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    const returnUrl = this.contextService.getCurrentContext().returnUrl;
    this.contextService.resetContext();
    this.router.navigate([returnUrl]);
  }

  hasError(field: string, error: string): boolean {
    const control = this.categoryForm.get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}
