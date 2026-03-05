import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { RadiologicImagesService } from '../../services/radiologic-images.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { IMAGE_TYPES } from '../../models/radiologic-image.models';

export interface RadioUploadModalData {
  patientId: string;
}

@Component({
  selector: 'app-radio-upload-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './radio-upload-modal.html',
  styleUrl: './radio-upload-modal.scss'
})
export class RadioUploadModalComponent implements ModalComponentBase<RadioUploadModalData, boolean> {
  private fb = inject(FormBuilder);
  private radioService = inject(RadiologicImagesService);
  private notifications = inject(NotificationService);

  modalData?: RadioUploadModalData;
  modalRef?: ModalRef<RadioUploadModalData, boolean>;
  modalConfig?: ModalConfig<RadioUploadModalData>;

  form!: FormGroup;
  loading = signal(false);
  selectedFile = signal<File | null>(null);

  IMAGE_TYPES = IMAGE_TYPES;

  ngOnInit(): void {
    this.form = this.fb.group({
      imageType: ['Periapical', Validators.required],
      title: ['', Validators.required],
      description: [''],
      notes: [''],
      takenAt: ['']
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.selectedFile()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const v = this.form.value;

    this.radioService.upload(
      this.modalData!.patientId,
      this.selectedFile()!,
      v.imageType,
      v.title.trim(),
      v.description?.trim() || undefined,
      v.takenAt || undefined,
      undefined,
      v.notes?.trim() || undefined
    ).subscribe({
      next: () => {
        this.notifications.success('Radiografía subida exitosamente');
        this.modalRef?.close(true);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onClose(): void {
    this.modalRef?.close();
  }
}
