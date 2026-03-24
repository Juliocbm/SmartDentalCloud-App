import { ROUTES, getDynamicRoute } from '../../../core/constants/routes.constants';

export interface InvoiceFormContext {
  preselectedPatientId: string | null;
  preselectedPatientName: string | null;
  returnUrl: string;
  lockPatient: boolean;
}

export const DEFAULT_INVOICE_CONTEXT: InvoiceFormContext = {
  preselectedPatientId: null,
  preselectedPatientName: null,
  returnUrl: ROUTES.INVOICES,
  lockPatient: false
};

export const TREATMENT_INVOICE_CONTEXT = (
  patientId: string,
  patientName: string,
  treatmentId: string
): Partial<InvoiceFormContext> => ({
  preselectedPatientId: patientId,
  preselectedPatientName: patientName,
  returnUrl: getDynamicRoute.treatmentDetail(treatmentId),
  lockPatient: true
});

export const APPOINTMENT_INVOICE_CONTEXT = (
  patientId: string,
  patientName: string,
  appointmentId: string
): Partial<InvoiceFormContext> => ({
  preselectedPatientId: patientId,
  preselectedPatientName: patientName,
  returnUrl: getDynamicRoute.appointmentDetail(appointmentId),
  lockPatient: true
});

export const PLAN_INVOICE_CONTEXT = (
  patientId: string,
  patientName: string,
  planId: string
): Partial<InvoiceFormContext> => ({
  preselectedPatientId: patientId,
  preselectedPatientName: patientName,
  returnUrl: getDynamicRoute.treatmentPlanDetail(planId),
  lockPatient: true
});
