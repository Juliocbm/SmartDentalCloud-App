import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ServicesService } from '../../services/services.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss'
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private servicesService = inject(ServicesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  form!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  categoryId = signal<string | null>(null);
  isEditMode = computed(() => !!this.categoryId());

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Servicios', route: '/services', icon: 'fa-briefcase-medical' },
    { label: 'Categorías', route: '/services/categories', icon: 'fa-tags' },
    { label: this.isEditMode() ? 'Editar' : 'Nueva' }
  ]);

  ngOnInit(): void {
    this.initForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoryId.set(id);
      this.loadCategory(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      displayOrder: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  private loadCategory(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.servicesService.getCategoryById(id).subscribe({
      next: (category) => {
        this.form.patchValue({
          name: category.name,
          description: category.description,
          displayOrder: category.displayOrder,
          isActive: category.isActive
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading service category:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const formValue = this.form.value;
    const request$ = this.isEditMode()
      ? this.servicesService.updateCategory(this.categoryId()!, formValue)
      : this.servicesService.createCategory(formValue);
    request$.subscribe({
      next: () => {
        this.notifications.success(
          this.isEditMode() ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente'
        );
        this.router.navigate(['/services/categories']);
      },
      error: (err) => {
        this.logger.error('Error saving service category:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/services/categories']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
