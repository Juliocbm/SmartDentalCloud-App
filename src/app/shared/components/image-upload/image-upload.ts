import { Component, Input, Output, EventEmitter, signal, inject, DestroyRef, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss'
})
export class ImageUploadComponent implements OnInit, OnDestroy, OnChanges {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  @Input() currentImageUrl: string | null = null;
  @Input() uploadUrl = '';
  @Input() downloadUrl = '';
  @Input() deleteUrl = '';
  @Input() accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
  @Input() maxSizeMb = 5;
  @Input() placeholder = 'Seleccionar imagen';
  @Input() previewShape: 'circle' | 'rectangle' = 'rectangle';

  @Output() imageUploaded = new EventEmitter<string>();
  @Output() imageRemoved = new EventEmitter<void>();

  selectedFile = signal<File | null>(null);
  localPreviewUrl = signal<string | null>(null);
  blobUrl = signal<string | null>(null);
  uploading = signal(false);
  deleting = signal(false);
  loadingImage = signal(false);
  error = signal<string | null>(null);

  private internalImageUrl = signal<string | null>(null);
  private currentBlobUrl: string | null = null;

  ngOnInit(): void {
    this.internalImageUrl.set(this.currentImageUrl);
    this.loadCurrentImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentImageUrl'] && !changes['currentImageUrl'].firstChange) {
      this.internalImageUrl.set(this.currentImageUrl);
      this.loadCurrentImage();
    }
  }

  ngOnDestroy(): void {
    this.revokeBlobUrl();
  }

  private loadCurrentImage(): void {
    if (!this.internalImageUrl() || !this.downloadUrl) {
      this.revokeBlobUrl();
      this.blobUrl.set(null);
      return;
    }

    // Si ya tenemos un preview local (post-upload), no re-descargar del servidor
    if (this.localPreviewUrl()) return;

    this.loadingImage.set(true);
    const cacheBust = `${this.downloadUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    this.api.getBlob(`${this.downloadUrl}${cacheBust}`).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (blob) => {
        this.revokeBlobUrl();
        this.currentBlobUrl = URL.createObjectURL(blob);
        this.blobUrl.set(this.currentBlobUrl);
        this.loadingImage.set(false);
      },
      error: () => {
        this.blobUrl.set(null);
        this.loadingImage.set(false);
      }
    });
  }

  private revokeBlobUrl(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.error.set(null);

    // Validar tipo
    const acceptedTypes = this.accept.split(',').map(t => t.trim());
    if (!acceptedTypes.includes(file.type)) {
      this.error.set('Tipo de archivo no permitido');
      input.value = '';
      return;
    }

    // Validar tamaño
    if (file.size > this.maxSizeMb * 1024 * 1024) {
      this.error.set(`El archivo excede el límite de ${this.maxSizeMb}MB`);
      input.value = '';
      return;
    }

    this.selectedFile.set(file);

    // Preview local inmediato
    const reader = new FileReader();
    reader.onload = () => this.localPreviewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;

    this.uploading.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('file', file, file.name);

    this.api.post<{ imageUrl: string }>(this.uploadUrl, formData).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.internalImageUrl.set(result.imageUrl);
        this.selectedFile.set(null);
        // Mantener localPreviewUrl como imagen visible — evita re-fetch
        // que devolvería la imagen anterior por cache del navegador
        this.uploading.set(false);
        this.imageUploaded.emit(result.imageUrl);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al subir la imagen');
        this.uploading.set(false);
      }
    });
  }

  remove(): void {
    if (this.deleting() || !this.deleteUrl) return;

    this.deleting.set(true);
    this.error.set(null);

    this.api.delete(this.deleteUrl).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.internalImageUrl.set(null);
        this.selectedFile.set(null);
        this.localPreviewUrl.set(null);
        this.revokeBlobUrl();
        this.blobUrl.set(null);
        this.deleting.set(false);
        this.imageRemoved.emit();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al eliminar la imagen');
        this.deleting.set(false);
      }
    });
  }

  cancelSelection(): void {
    this.selectedFile.set(null);
    this.localPreviewUrl.set(null);
    this.error.set(null);
  }

  get displayUrl(): string | null {
    return this.localPreviewUrl() || this.blobUrl();
  }

  get hasImage(): boolean {
    return !!this.internalImageUrl();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
