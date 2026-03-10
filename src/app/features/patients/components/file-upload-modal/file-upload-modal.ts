import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { AttachedFilesService } from '../../services/attached-files.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { FormSelectComponent } from '../../../../shared/components/form-select/form-select';
import { FILE_CATEGORIES, formatFileSize } from '../../models/attached-file.models';

export interface FileUploadModalData {
  patientId: string;
}

@Component({
  selector: 'app-file-upload-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, FormSelectComponent],
  templateUrl: './file-upload-modal.html',
  styleUrl: './file-upload-modal.scss'
})
export class FileUploadModalComponent implements ModalComponentBase<FileUploadModalData, boolean> {
  private fb = inject(FormBuilder);
  private filesService = inject(AttachedFilesService);
  private notifications = inject(NotificationService);

  modalData?: FileUploadModalData;
  modalRef?: ModalRef<FileUploadModalData, boolean>;
  modalConfig?: ModalConfig<FileUploadModalData>;

  form!: FormGroup;
  loading = signal(false);
  selectedFile = signal<File | null>(null);

  FILE_CATEGORIES = FILE_CATEGORIES;
  formatFileSize = formatFileSize;

  ngOnInit(): void {
    this.form = this.fb.group({
      category: [''],
      description: ['']
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  onSubmit(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.loading.set(true);
    const v = this.form.value;

    this.filesService.upload(
      this.modalData!.patientId,
      file,
      v.category || undefined,
      v.description?.trim() || undefined
    ).subscribe({
      next: () => {
        this.notifications.success('Archivo subido exitosamente');
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
