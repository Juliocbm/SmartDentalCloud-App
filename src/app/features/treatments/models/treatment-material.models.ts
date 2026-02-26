/**
 * Interfaces para Materiales de Tratamiento
 * Mirrors backend DTO: TreatmentMaterialDto
 * API: /api/treatments/{treatmentId}/materials
 */

export interface TreatmentMaterial {
  id: string;
  treatmentId: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
  createdByName?: string;
}

export interface CreateTreatmentMaterialRequest {
  productId: string;
  locationId?: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}
