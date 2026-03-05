export interface RadiologicImageDto {
  id: string;
  patientId: string;
  appointmentId?: string;
  imageType: string;
  title: string;
  description?: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  storagePath: string;
  takenAt?: string;
  takenBy?: string;
  takenByUserName?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  createdByUserName?: string;
}

export const IMAGE_TYPES = [
  { value: 'Periapical', label: 'Periapical' },
  { value: 'Panoramic', label: 'Panorámica' },
  { value: 'Bitewing', label: 'Bitewing (Aleta de mordida)' },
  { value: 'Cephalometric', label: 'Cefalométrica' },
  { value: 'CBCT', label: 'CBCT (Tomografía)' },
  { value: 'Other', label: 'Otro' }
];

export function getImageTypeLabel(type: string): string {
  return IMAGE_TYPES.find(t => t.value === type)?.label || type;
}

// formatFileSize moved to shared/utils/file.utils.ts
export { formatFileSize } from '../../../shared/utils/file.utils';
