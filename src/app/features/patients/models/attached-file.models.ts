/**
 * Interfaces para Archivos Adjuntos de Pacientes
 * Mirrors backend DTO: AttachedFileDto
 * API: /api/patients/{patientId}/files, /api/files/{fileId}
 */

export interface AttachedFile {
  id: string;
  patientId: string;
  appointmentId?: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
  description?: string;
  tags?: string;
  createdAt: Date;
  createdByUserName?: string;
}

export interface UploadFileRequest {
  patientId: string;
  file: File;
  appointmentId?: string;
  category?: string;
  description?: string;
  tags?: string;
}

export const FILE_CATEGORIES = [
  { value: 'radiografia', label: 'Radiografía' },
  { value: 'fotografia', label: 'Fotografía' },
  { value: 'documento', label: 'Documento' },
  { value: 'laboratorio', label: 'Resultado de Laboratorio' },
  { value: 'consentimiento', label: 'Consentimiento Informado' },
  { value: 'otro', label: 'Otro' }
];

export function getFileIcon(fileType?: string): string {
  if (!fileType) return 'fa-file';
  if (fileType.startsWith('image/')) return 'fa-file-image';
  if (fileType === 'application/pdf') return 'fa-file-pdf';
  if (fileType.includes('word') || fileType.includes('document')) return 'fa-file-word';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'fa-file-excel';
  return 'fa-file';
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
