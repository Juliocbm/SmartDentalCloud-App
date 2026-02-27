import { ROUTES, getDynamicRoute } from '../../../core/constants/routes.constants';

export interface AppointmentFormContext {
  preselectedDentistId: string | null;
  preselectedDentistName: string | null;
  preselectedDentistSpecialization: string | null;
  preselectedPatientId: string | null;
  preselectedPatientName: string | null;
  preselectedLocationId: string | null;
  preselectedLocationName: string | null;
  preselectedStartAt: Date | null;
  preselectedEndAt: Date | null;
  returnUrl: string;
  lockDentist: boolean;
  lockPatient: boolean;
}

export const DEFAULT_APPOINTMENT_CONTEXT: AppointmentFormContext = {
  preselectedDentistId: null,
  preselectedDentistName: null,
  preselectedDentistSpecialization: null,
  preselectedPatientId: null,
  preselectedPatientName: null,
  preselectedLocationId: null,
  preselectedLocationName: null,
  preselectedStartAt: null,
  preselectedEndAt: null,
  returnUrl: ROUTES.APPOINTMENTS,
  lockDentist: false,
  lockPatient: false
};

export const DENTIST_APPOINTMENT_CONTEXT = (
  dentistId: string,
  dentistName: string,
  dentistSpecialization?: string
): Partial<AppointmentFormContext> => ({
  preselectedDentistId: dentistId,
  preselectedDentistName: dentistName,
  preselectedDentistSpecialization: dentistSpecialization || null,
  returnUrl: ROUTES.DENTISTS,
  lockDentist: true
});

export const PATIENT_APPOINTMENT_CONTEXT = (
  patientId: string,
  patientName: string
): Partial<AppointmentFormContext> => ({
  preselectedPatientId: patientId,
  preselectedPatientName: patientName,
  returnUrl: getDynamicRoute.patientDetail(patientId),
  lockPatient: true
});

export const CALENDAR_APPOINTMENT_CONTEXT = (
  startAt: Date,
  endAt: Date,
  dentistId?: string,
  dentistName?: string,
  dentistSpecialization?: string,
  locationId?: string,
  locationName?: string
): Partial<AppointmentFormContext> => ({
  preselectedStartAt: startAt,
  preselectedEndAt: endAt,
  preselectedDentistId: dentistId || null,
  preselectedDentistName: dentistName || null,
  preselectedDentistSpecialization: dentistSpecialization || null,
  preselectedLocationId: locationId || null,
  preselectedLocationName: locationName || null,
  returnUrl: ROUTES.APPOINTMENTS_CALENDAR,
  lockDentist: !!dentistId
});
