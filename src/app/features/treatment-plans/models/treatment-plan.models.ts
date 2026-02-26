// ============================================
// TreatmentPlan Models
// Mirrors backend DTOs from SmartDentalCloud.Application.Common.DTOs
// ============================================

// ===== Enums =====

export enum TreatmentPlanStatus {
  Draft = 'Draft',
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export enum ItemPriority {
  Urgent = 'Urgent',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

export enum ItemStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

// ===== Status Config =====

export interface StatusConfig {
  label: string;
  class: string;
  icon: string;
}

export const TREATMENT_PLAN_STATUS_CONFIG: Record<string, StatusConfig> = {
  [TreatmentPlanStatus.Draft]: { label: 'Borrador', class: 'badge-neutral', icon: 'fa-file-pen' },
  [TreatmentPlanStatus.PendingApproval]: { label: 'Pendiente', class: 'badge-warning', icon: 'fa-clock' },
  [TreatmentPlanStatus.Approved]: { label: 'Aprobado', class: 'badge-info', icon: 'fa-circle-check' },
  [TreatmentPlanStatus.Rejected]: { label: 'Rechazado', class: 'badge-danger', icon: 'fa-circle-xmark' },
  [TreatmentPlanStatus.InProgress]: { label: 'En Progreso', class: 'badge-active', icon: 'fa-spinner' },
  [TreatmentPlanStatus.Completed]: { label: 'Completado', class: 'badge-success', icon: 'fa-circle-check' },
  [TreatmentPlanStatus.Cancelled]: { label: 'Cancelado', class: 'badge-inactive', icon: 'fa-ban' }
};

export const ITEM_PRIORITY_CONFIG: Record<string, StatusConfig> = {
  [ItemPriority.Urgent]: { label: 'Urgente', class: 'badge-danger', icon: 'fa-exclamation' },
  [ItemPriority.High]: { label: 'Alta', class: 'badge-warning', icon: 'fa-arrow-up' },
  [ItemPriority.Medium]: { label: 'Media', class: 'badge-info', icon: 'fa-minus' },
  [ItemPriority.Low]: { label: 'Baja', class: 'badge-neutral', icon: 'fa-arrow-down' }
};

export const ITEM_STATUS_CONFIG: Record<string, StatusConfig> = {
  [ItemStatus.Pending]: { label: 'Pendiente', class: 'badge-neutral', icon: 'fa-clock' },
  [ItemStatus.InProgress]: { label: 'En Progreso', class: 'badge-active', icon: 'fa-spinner' },
  [ItemStatus.Completed]: { label: 'Completado', class: 'badge-success', icon: 'fa-circle-check' },
  [ItemStatus.Cancelled]: { label: 'Cancelado', class: 'badge-inactive', icon: 'fa-ban' }
};

// ===== Interfaces =====

export interface TreatmentPlanItem {
  id: string;
  treatmentPlanId: string;
  serviceId?: string;
  serviceName?: string;
  description: string;
  notes?: string;
  priority: string;
  estimatedCost: number;
  actualCost?: number;
  discount?: number;
  status: string;
  progressPercentage: number;
  displayOrder: number;
  treatmentPhase?: string;
  completedTreatmentId?: string;
  estimatedDate?: Date;
  completedAt?: Date;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  patientName?: string;
  planNumber: string;
  title: string;
  description?: string;
  diagnosis?: string;
  status: string;
  totalEstimatedCost: number;
  totalActualCost: number;
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  approvedAt?: Date;
  approvedByName?: string;
  rejectedAt?: Date;
  rejectedByName?: string;
  rejectionReason?: string;
  createdAt: Date;
  createdByName?: string;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  pendingItems: number;
  overallProgressPercentage: number;
  items: TreatmentPlanItem[];
}

// ===== Request DTOs =====

export interface CreateTreatmentPlanItemRequest {
  serviceId?: string;
  description: string;
  notes?: string;
  priority: string;
  estimatedCost: number;
  discount?: number;
  treatmentPhase?: string;
  estimatedDate?: string;
}

export interface CreateTreatmentPlanRequest {
  patientId: string;
  title: string;
  description?: string;
  diagnosis?: string;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  items: CreateTreatmentPlanItemRequest[];
}

export interface UpdateTreatmentPlanRequest {
  title: string;
  description?: string;
  diagnosis?: string;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
}

export interface AddPlanItemRequest {
  serviceId?: string;
  description: string;
  notes?: string;
  priority: string;
  estimatedCost: number;
  discount?: number;
  treatmentPhase?: string;
  estimatedDate?: string;
}

export interface UpdatePlanItemRequest {
  serviceId?: string;
  description: string;
  notes?: string;
  priority: string;
  estimatedCost: number;
  discount?: number;
  treatmentPhase?: string;
  estimatedDate?: string;
}

export interface RejectPlanRequest {
  planId: string;
  reason: string;
}

export interface UpdateItemProgressRequest {
  status: string;
  progressPercentage?: number;
  completedTreatmentId?: string;
}

// ===== Progress DTO =====

export interface TreatmentPlanProgress {
  planId: string;
  planNumber: string;
  title: string;
  status: string;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  pendingItems: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  completedCost: number;
  overallProgress: number;
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  items: TreatmentPlanItemProgress[];
}

export interface TreatmentPlanItemProgress {
  id: string;
  serviceName: string;
  description: string;
  status: string;
  progressPercentage: number;
  estimatedCost: number;
  actualCost?: number;
  completedTreatmentId?: string;
  completedAt?: Date;
}
