import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PatientsService } from '../../services/patients.service';
import { Patient, UpdateTaxInfoRequest, UpdateMedicalHistoryRequest, BloodType, SmokingStatus, ChangeHistoryEntry, PATIENT_ENTITY_TYPE_LABELS, PATIENT_ENTITY_TYPE_ICONS, PATIENT_ENTITY_TYPE_FILTERS } from '../../models/patient.models';
import { AttachedFile, FILE_CATEGORIES, getFileIcon, formatFileSize } from '../../models/attached-file.models';
import { PatientFinancialSummary, PatientHistory } from '../../models/patient-dashboard.models';
import { AttachedFilesService } from '../../services/attached-files.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { OdontogramComponent } from '../../../dental-chart/components/odontogram/odontogram';
import { PerioHistoryListComponent } from '../../../periodontogram/components/perio-history-list/perio-history-list';
import { CephHistoryListComponent } from '../../../cephalometry/components/ceph-history-list/ceph-history-list';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { PatientClinicalSummaryComponent } from '../../../../shared/components/patient-clinical-summary/patient-clinical-summary';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { ModalService } from '../../../../shared/services/modal.service';
import { PatientAllergiesService } from '../../services/patient-allergies.service';
import {
  PatientAllergy,
  getAllergenTypeLabel,
  getSeverityLabel,
  getSeverityClass
} from '../../models/patient-allergy.models';
import { InformedConsentsService } from '../../services/informed-consents.service';
import {
  InformedConsent,
  getConsentTypeLabel,
  getConsentStatusLabel,
  getConsentStatusClass
} from '../../models/informed-consent.models';
import { PatientDiagnosesService } from '../../services/patient-diagnoses.service';
import { ElectronicSignatureService, SignatureResult } from '../../../../core/services/electronic-signature.service';
import { SignaturePadComponent } from '../../../../shared/components/signature-pad/signature-pad';
import { SignatureModalComponent } from '../../../../shared/components/signature-modal/signature-modal';
import { SignaturePinSetupComponent } from '../../../../shared/components/signature-pin-setup/signature-pin-setup';
import { ConsentTemplateService, ConsentTemplate as ConsentTemplateModel } from '../../../settings/services/consent-template.service';
import { ConsentPrintViewComponent } from '../../../../shared/components/consent-print-view/consent-print-view';
import {
  PatientDiagnosis,
  getDiagnosisStatusLabel,
  getDiagnosisStatusClass,
  getDiagnosisSeverityLabel,
  getDiagnosisSeverityClass
} from '../../models/patient-diagnosis.models';
import { RadiologicImagesService } from '../../services/radiologic-images.service';
import { triggerBlobDownload } from '../../../../shared/utils/file.utils';
import {
  RadiologicImageDto,
  IMAGE_TYPES,
  getImageTypeLabel,
  formatFileSize as formatRadioFileSize
} from '../../models/radiologic-image.models';
import { AllergyFormModalComponent, AllergyFormModalData } from '../allergy-form-modal/allergy-form-modal';
import { ConsentFormModalComponent, ConsentFormModalData } from '../consent-form-modal/consent-form-modal';
import { DiagnosisFormModalComponent, DiagnosisFormModalData } from '../diagnosis-form-modal/diagnosis-form-modal';
import { RadioUploadModalComponent, RadioUploadModalData } from '../radio-upload-modal/radio-upload-modal';
import { FileUploadModalComponent, FileUploadModalData } from '../file-upload-modal/file-upload-modal';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OdontogramComponent, PerioHistoryListComponent, CephHistoryListComponent, PageHeaderComponent, AuditInfoComponent, PatientClinicalSummaryComponent, SignaturePadComponent, SignatureModalComponent, SignaturePinSetupComponent, ConsentPrintViewComponent],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss'
})
export class PatientDetailComponent implements OnInit, OnDestroy {
  showAuditModal = signal(false);

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientsService = inject(PatientsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private attachedFilesService = inject(AttachedFilesService);
  private allergiesService = inject(PatientAllergiesService);
  private consentsService = inject(InformedConsentsService);
  private diagnosesService = inject(PatientDiagnosesService);
  private signatureService = inject(ElectronicSignatureService);
  private consentTemplateService = inject(ConsentTemplateService);
  private location = inject(Location);
  private radiologicImagesService = inject(RadiologicImagesService);
  private modalService = inject(ModalService);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pacientes', route: '/patients' },
    { label: 'Detalle' }
  ];

  patient = signal<Patient | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'info' | 'medical' | 'allergies' | 'consents' | 'problems' | 'odontogram' | 'periodontogram' | 'cephalometry' | 'radiographs' | 'fiscal' | 'financial' | 'history' | 'changes' | 'files'>('info');

  // Allergies state (NOM-024)
  allergies = signal<PatientAllergy[]>([]);
  allergiesLoading = signal(false);
  getAllergenTypeLabel = getAllergenTypeLabel;
  getSeverityLabel = getSeverityLabel;
  getSeverityClass = getSeverityClass;

  // Consents state (NOM-024)
  consents = signal<InformedConsent[]>([]);
  consentsLoading = signal(false);
  consentAppointmentId = signal<string | null>(null);
  consentTreatmentId = signal<string | null>(null);
  getConsentTypeLabel = getConsentTypeLabel;
  getConsentStatusLabel = getConsentStatusLabel;
  getConsentStatusClass = getConsentStatusClass;

  // Consent signing flow
  signingConsentId = signal<string | null>(null);
  signingConsentTitle = signal('');
  signingStep = signal<'patient-signature' | 'doctor-pin' | null>(null);
  patientSignatureData = signal<string | null>(null);
  witnessName = signal('');
  showPinSetup = signal(false);
  consentSignatures = signal<SignatureResult[]>([]);

  // Consent print view
  printingConsent = signal<InformedConsent | null>(null);

  // Change history (NOM-024 Audit Trail)
  changeHistory = signal<ChangeHistoryEntry[]>([]);
  changesLoading = signal(false);
  changesEntityFilter = signal('');
  ENTITY_TYPE_FILTERS = PATIENT_ENTITY_TYPE_FILTERS;

  // Diagnoses state (NOM-024)
  diagnoses = signal<PatientDiagnosis[]>([]);
  diagnosesLoading = signal(false);
  getDiagnosisStatusLabel = getDiagnosisStatusLabel;
  getDiagnosisStatusClass = getDiagnosisStatusClass;
  getDiagnosisSeverityLabel = getDiagnosisSeverityLabel;
  getDiagnosisSeverityClass = getDiagnosisSeverityClass;

  // Radiologic images state (NOM-024 §5.3)
  radioImages = signal<RadiologicImageDto[]>([]);
  radioImagesLoading = signal(false);
  radioViewingImage = signal<RadiologicImageDto | null>(null);
  radioBrightness = signal(100);
  radioContrast = signal(100);
  radioBlobUrls = signal<Record<string, string>>({});
  IMAGE_TYPES = IMAGE_TYPES;
  getImageTypeLabel = getImageTypeLabel;
  formatRadioFileSize = formatRadioFileSize;

  // Medical history editing state
  editingMedical = signal(false);
  savingMedical = signal(false);
  medBloodType = signal('');
  medCurrentMedications = signal('');
  medSmokingStatus = signal('');
  medNotes = signal('');
  bloodTypeOptions = Object.values(BloodType);
  smokingStatusOptions = Object.values(SmokingStatus);

  // Fiscal data state
  taxId = signal('');
  legalName = signal('');
  fiscalAddress = signal('');
  savingTax = signal(false);
  editingTax = signal(false);

  // Financial summary state
  financialSummary = signal<PatientFinancialSummary | null>(null);
  financialLoading = signal(false);

  // History state
  patientHistory = signal<PatientHistory | null>(null);
  historyLoading = signal(false);

  // Attached files state
  files = signal<AttachedFile[]>([]);
  filesLoading = signal(false);
  FILE_CATEGORIES = FILE_CATEGORIES;
  filterCategory = signal('');
  filteredFiles = computed(() => {
    const cat = this.filterCategory();
    const all = this.files();
    return cat ? all.filter(f => f.category === cat) : all;
  });
  getFileIcon = getFileIcon;
  formatFileSize = formatFileSize;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPatient(id);
    }

    // Read query params for tab navigation and consent context
    const qp = this.route.snapshot.queryParamMap;
    const tab = qp.get('tab');
    if (tab) {
      this.setActiveTab(tab as any);
    }
    const appointmentId = qp.get('appointmentId');
    if (appointmentId) {
      this.consentAppointmentId.set(appointmentId);
    }
    const treatmentId = qp.get('treatmentId');
    if (treatmentId) {
      this.consentTreatmentId.set(treatmentId);
    }
    // Auto-open consent modal when arriving with context
    if (tab === 'consents' && (appointmentId || treatmentId)) {
      setTimeout(() => this.openConsentModal(), 500);
    }
  }

  ngOnDestroy(): void {
    const urls = this.radioBlobUrls();
    Object.values(urls).forEach(url => URL.revokeObjectURL(url));
  }

  private loadPatient(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.patientsService.getById(id).subscribe({
      next: (patient) => {
        this.patient.set(patient);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading patient:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  setActiveTab(tab: 'info' | 'medical' | 'allergies' | 'consents' | 'problems' | 'odontogram' | 'periodontogram' | 'cephalometry' | 'radiographs' | 'fiscal' | 'financial' | 'history' | 'changes' | 'files'): void {
    this.activeTab.set(tab);
    if (tab === 'allergies' && this.allergies().length === 0 && !this.allergiesLoading()) {
      this.loadAllergies();
    }
    if (tab === 'consents' && this.consents().length === 0 && !this.consentsLoading()) {
      this.loadConsents();
    }
    if (tab === 'problems' && this.diagnoses().length === 0 && !this.diagnosesLoading()) {
      this.loadDiagnoses();
    }
    if (tab === 'radiographs' && this.radioImages().length === 0 && !this.radioImagesLoading()) {
      this.loadRadioImages();
    }
    if (tab === 'files' && this.files().length === 0 && !this.filesLoading()) {
      this.loadFiles();
    }
    if (tab === 'fiscal') {
      this.populateTaxForm();
    }
    if (tab === 'financial' && !this.financialSummary() && !this.financialLoading()) {
      this.loadFinancialSummary();
    }
    if (tab === 'history' && !this.patientHistory() && !this.historyLoading()) {
      this.loadHistory();
    }
    if (tab === 'changes' && this.changeHistory().length === 0 && !this.changesLoading()) {
      this.loadChangeHistory();
    }
  }

  // === Allergies (NOM-024) ===

  private loadAllergies(): void {
    const pat = this.patient();
    if (!pat) return;

    this.allergiesLoading.set(true);
    this.allergiesService.getByPatient(pat.id, false).subscribe({
      next: (data) => {
        this.allergies.set(data);
        this.allergiesLoading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar alergias'));
        this.allergiesLoading.set(false);
      }
    });
  }

  openAllergyModal(): void {
    const pat = this.patient();
    if (!pat) return;

    const ref = this.modalService.open<AllergyFormModalData, boolean>(
      AllergyFormModalComponent,
      { data: { patientId: pat.id } }
    );
    ref.afterClosed().subscribe(result => {
      if (result) this.loadAllergies();
    });
  }

  async deactivateAllergy(allergy: PatientAllergy): Promise<void> {
    const pat = this.patient();
    if (!pat) return;

    const confirmed = await this.notifications.confirm(
      `¿Desactivar alergia "${allergy.allergenName}"?`
    );
    if (!confirmed) return;

    this.allergiesService.deactivate(pat.id, allergy.id).subscribe({
      next: () => {
        this.notifications.success('Alergia desactivada');
        this.loadAllergies();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  getActiveAllergiesCount(): number {
    return this.allergies().filter(a => a.isActive).length;
  }

  hasSevereAllergies(): boolean {
    return this.allergies().some(a => a.isActive && (a.severity === 'Severe' || a.severity === 'LifeThreatening'));
  }

  // === Informed Consents (NOM-024) ===

  private loadConsents(): void {
    const pat = this.patient();
    if (!pat) return;

    this.consentsLoading.set(true);
    this.consentsService.getByPatient(pat.id).subscribe({
      next: (data) => {
        this.consents.set(data);
        this.consentsLoading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar consentimientos'));
        this.consentsLoading.set(false);
      }
    });
  }

  openConsentModal(): void {
    const pat = this.patient();
    if (!pat) return;

    const ref = this.modalService.open<ConsentFormModalData, boolean>(
      ConsentFormModalComponent,
      {
        data: {
          patientId: pat.id,
          appointmentId: this.consentAppointmentId() || undefined,
          treatmentId: this.consentTreatmentId() || undefined
        }
      }
    );
    ref.afterClosed().subscribe(result => {
      if (result) this.loadConsents();
    });
  }

  async revokeConsent(consent: InformedConsent): Promise<void> {
    const pat = this.patient();
    if (!pat) return;

    const confirmed = await this.notifications.confirm(
      `¿Revocar consentimiento "${consent.title}"?`
    );
    if (!confirmed) return;

    this.consentsService.revoke(pat.id, consent.id, { reason: 'Revocado por el paciente' }).subscribe({
      next: () => {
        this.notifications.success('Consentimiento revocado');
        this.loadConsents();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  getPendingConsentsCount(): number {
    return this.consents().filter(c => c.status === 'Pending').length;
  }

  // Consent signing flow

  startSignConsent(consent: InformedConsent): void {
    this.signingConsentId.set(consent.id);
    this.signingConsentTitle.set(consent.title);
    this.patientSignatureData.set(null);
    this.witnessName.set('');
    this.signingStep.set('patient-signature');
  }

  onPatientSignatureChanged(data: string | null): void {
    this.patientSignatureData.set(data);
  }

  proceedToDoctorPin(): void {
    if (!this.patientSignatureData()) return;
    // Don't call consentsService.sign() yet — wait until doctor PIN is verified
    this.signingStep.set('doctor-pin');
  }

  onDocumentSigned(result: SignatureResult): void {
    // Doctor PIN verified — NOW save patient signature + mark as Signed
    const pat = this.patient();
    const consentId = this.signingConsentId();
    if (!pat || !consentId) return;

    this.consentsService.sign(pat.id, consentId, {
      patientSignatureData: this.patientSignatureData() || undefined,
      witnessName: this.witnessName().trim() || undefined
    }).subscribe({
      next: () => {
        this.notifications.success('Consentimiento firmado electrónicamente');
        this.signingStep.set(null);
        this.signingConsentId.set(null);
        this.loadConsents();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.signingStep.set(null);
        this.signingConsentId.set(null);
      }
    });
  }

  cancelSigning(): void {
    this.signingStep.set(null);
    this.signingConsentId.set(null);
  }

  onPinConfigured(): void {
    this.showPinSetup.set(false);
    this.notifications.success('PIN configurado. Ahora puede firmar el documento.');
  }

  loadConsentSignatures(consent: InformedConsent): void {
    this.signatureService.getSignatures('InformedConsent', consent.id).subscribe({
      next: (sigs) => this.consentSignatures.set(sigs),
      error: () => this.consentSignatures.set([])
    });
  }

  // Template loading removed — now handled by ConsentFormModalComponent

  // Print view

  openConsentPrintView(consent: InformedConsent): void {
    this.printingConsent.set(consent);
  }

  closeConsentPrintView(): void {
    this.printingConsent.set(null);
  }

  // === Change History (NOM-024 Audit Trail) ===

  private loadChangeHistory(): void {
    const pat = this.patient();
    if (!pat) return;

    this.changesLoading.set(true);
    const entityFilter = this.changesEntityFilter() || undefined;
    this.patientsService.getChangeHistory(pat.id, 1, 100, entityFilter).subscribe({
      next: (data) => {
        this.changeHistory.set(data);
        this.changesLoading.set(false);
      },
      error: () => {
        this.changesLoading.set(false);
      }
    });
  }

  onChangesFilterChange(): void {
    this.changeHistory.set([]);
    this.loadChangeHistory();
  }

  getEntityTypeLabel(entityType: string): string {
    return PATIENT_ENTITY_TYPE_LABELS[entityType] || entityType;
  }

  getEntityTypeIcon(entityType: string): string {
    return PATIENT_ENTITY_TYPE_ICONS[entityType] || 'fa-circle';
  }

  formatChangeDate(date: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatJson(json: string | null): string {
    if (!json) return '';
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  }

  // === Patient Diagnoses (NOM-024) ===

  private loadDiagnoses(): void {
    const pat = this.patient();
    if (!pat) return;

    this.diagnosesLoading.set(true);
    this.diagnosesService.getByPatient(pat.id).subscribe({
      next: (data) => {
        this.diagnoses.set(data);
        this.diagnosesLoading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar diagnósticos'));
        this.diagnosesLoading.set(false);
      }
    });
  }

  openDiagnosisModal(): void {
    const pat = this.patient();
    if (!pat) return;

    const ref = this.modalService.open<DiagnosisFormModalData, boolean>(
      DiagnosisFormModalComponent,
      { data: { patientId: pat.id } }
    );
    ref.afterClosed().subscribe(result => {
      if (result) this.loadDiagnoses();
    });
  }

  async resolveDiagnosis(diagnosis: PatientDiagnosis): Promise<void> {
    const pat = this.patient();
    if (!pat) return;

    const confirmed = await this.notifications.confirm(
      `¿Marcar como resuelto "${diagnosis.description}"?`
    );
    if (!confirmed) return;

    this.diagnosesService.resolve(pat.id, diagnosis.id, {}).subscribe({
      next: () => {
        this.notifications.success('Diagnóstico marcado como resuelto');
        this.loadDiagnoses();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  getActiveDiagnosesCount(): number {
    return this.diagnoses().filter(p => p.status === 'Active').length;
  }

  // === Radiologic Images (NOM-024 §5.3) ===

  private loadRadioImages(): void {
    const pat = this.patient();
    if (!pat) return;

    this.radioImagesLoading.set(true);
    this.radiologicImagesService.getByPatient(pat.id).subscribe({
      next: (data) => {
        this.radioImages.set(data);
        this.radioImagesLoading.set(false);
        this.loadRadioBlobUrls(pat.id, data);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar radiografías'));
        this.radioImagesLoading.set(false);
      }
    });
  }

  private loadRadioBlobUrls(patientId: string, images: RadiologicImageDto[]): void {
    // Revoke old blob URLs to free memory
    const oldUrls = this.radioBlobUrls();
    Object.values(oldUrls).forEach(url => URL.revokeObjectURL(url));
    this.radioBlobUrls.set({});

    for (const img of images) {
      if (img.contentType.startsWith('image/')) {
        this.radiologicImagesService.getFileBlob(patientId, img.id).subscribe({
          next: (blob) => {
            const blobUrl = URL.createObjectURL(blob);
            this.radioBlobUrls.update(urls => ({ ...urls, [img.id]: blobUrl }));
          }
        });
      }
    }
  }

  openRadioUploadModal(): void {
    const pat = this.patient();
    if (!pat) return;

    const ref = this.modalService.open<RadioUploadModalData, boolean>(
      RadioUploadModalComponent,
      { data: { patientId: pat.id } }
    );
    ref.afterClosed().subscribe(result => {
      if (result) this.loadRadioImages();
    });
  }

  async deleteRadioImage(image: RadiologicImageDto): Promise<void> {
    const pat = this.patient();
    if (!pat) return;

    const confirmed = await this.notifications.confirm(
      `¿Eliminar radiografía "${image.title}"?`
    );
    if (!confirmed) return;

    this.radiologicImagesService.delete(pat.id, image.id).subscribe({
      next: () => {
        this.notifications.success('Radiografía eliminada');
        if (this.radioViewingImage()?.id === image.id) {
          this.radioViewingImage.set(null);
        }
        this.loadRadioImages();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  viewRadioImage(image: RadiologicImageDto): void {
    this.radioViewingImage.set(image);
    this.radioBrightness.set(100);
    this.radioContrast.set(100);
  }

  closeRadioViewer(): void {
    this.radioViewingImage.set(null);
  }

  resetRadioFilters(): void {
    this.radioBrightness.set(100);
    this.radioContrast.set(100);
  }

  getRadioImageStyle(): string {
    return `filter: brightness(${this.radioBrightness()}%) contrast(${this.radioContrast()}%);`;
  }

  getRadioFileUrl(img: RadiologicImageDto): string {
    const blobUrl = this.radioBlobUrls()[img.id];
    if (blobUrl) return blobUrl;
    return '';
  }

  formatRadioDate(date: string | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(date));
  }

  // === Attached Files ===

  private loadFiles(): void {
    const patient = this.patient();
    if (!patient) return;

    this.filesLoading.set(true);
    this.attachedFilesService.getByPatient(patient.id).subscribe({
      next: (data) => {
        const parsed = data.map(f => ({
          ...f,
          createdAt: new Date(f.createdAt)
        }));
        parsed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        this.files.set(parsed);
        this.filesLoading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar archivos'));
        this.filesLoading.set(false);
      }
    });
  }

  openFileUploadModal(): void {
    const pat = this.patient();
    if (!pat) return;

    const ref = this.modalService.open<FileUploadModalData, boolean>(
      FileUploadModalComponent,
      { data: { patientId: pat.id } }
    );
    ref.afterClosed().subscribe(result => {
      if (result) this.loadFiles();
    });
  }

  downloadAttachedFile(file: AttachedFile): void {
    this.attachedFilesService.getFileBlob(file.id).subscribe({
      next: (blob) => triggerBlobDownload(blob, file.fileName),
      error: (err) => this.notifications.error(getApiErrorMessage(err, 'Error al descargar archivo'))
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const confirmed = await this.notifications.confirm('¿Está seguro de eliminar este archivo?');
    if (!confirmed) return;

    this.attachedFilesService.delete(fileId).subscribe({
      next: () => {
        this.notifications.success('Archivo eliminado');
        this.loadFiles();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  formatDateFile(date: Date | string): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  async toggleActive(): Promise<void> {
    const patient = this.patient();
    if (!patient) return;

    const action = patient.isActive ? 'desactivar' : 'activar';
    
    const confirmed = await this.notifications.confirm(`¿Está seguro de ${action} a ${patient.firstName} ${patient.lastName}?`);
    if (!confirmed) return;

    const operation = patient.isActive 
      ? this.patientsService.deactivate(patient.id)
      : this.patientsService.activate(patient.id);

    operation.subscribe({
      next: () => {
        this.notifications.success(`Paciente ${action === 'activar' ? 'activado' : 'desactivado'} correctamente.`);
        this.loadPatient(patient.id);
      },
      error: () => {
        this.notifications.error(`Error al ${action} el paciente. Por favor intente nuevamente.`);
      }
    });
  }

  editPatient(): void {
    const patient = this.patient();
    if (patient) {
      this.router.navigate(['/patients', patient.id, 'edit']);
    }
  }

  getFullName(): string {
    const patient = this.patient();
    return patient ? `${patient.firstName} ${patient.lastName}`.trim() : '';
  }

  getAge(): string {
    const patient = this.patient();
    return patient && patient.age !== null ? `${patient.age} años` : 'N/A';
  }

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  hasMedicalHistory(): boolean {
    const patient = this.patient();
    return !!(patient && (patient.bloodType || patient.currentMedications));
  }

  goBack(): void {
    this.location.back();
  }

  // === Medical History ===

  private populateMedicalForm(): void {
    const pat = this.patient();
    if (!pat) return;
    this.medBloodType.set(pat.bloodType || '');
    this.medCurrentMedications.set(pat.currentMedications || '');
    this.medSmokingStatus.set(pat.smokingStatus || '');
    this.medNotes.set(pat.notes || '');
  }

  toggleEditMedical(): void {
    this.editingMedical.update(v => !v);
    if (this.editingMedical()) this.populateMedicalForm();
  }

  saveMedicalHistory(): void {
    const pat = this.patient();
    if (!pat || this.savingMedical()) return;

    this.savingMedical.set(true);
    const data: UpdateMedicalHistoryRequest = {
      patientId: pat.id,
      bloodType: this.medBloodType().trim() || null,
      currentMedications: this.medCurrentMedications().trim() || null,
      smokingStatus: this.medSmokingStatus().trim() || null,
      notes: this.medNotes().trim() || null
    };

    this.patientsService.updateMedicalHistory(pat.id, data).subscribe({
      next: () => {
        this.notifications.success('Historia médica actualizada');
        this.editingMedical.set(false);
        this.savingMedical.set(false);
        this.loadPatient(pat.id);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.savingMedical.set(false);
      }
    });
  }

  // === Fiscal Data ===

  private populateTaxForm(): void {
    const pat = this.patient();
    if (!pat) return;
    this.taxId.set(pat.taxId || '');
    this.legalName.set(pat.legalName || '');
    this.fiscalAddress.set(pat.fiscalAddress || '');
  }

  toggleEditTax(): void {
    this.editingTax.update(v => !v);
    if (this.editingTax()) this.populateTaxForm();
  }

  saveTaxInfo(): void {
    const pat = this.patient();
    if (!pat || this.savingTax()) return;

    this.savingTax.set(true);
    const data: UpdateTaxInfoRequest = {
      patientId: pat.id,
      taxId: this.taxId().trim(),
      legalName: this.legalName().trim(),
      fiscalAddress: this.fiscalAddress().trim()
    };

    this.patientsService.updateTaxInfo(pat.id, data).subscribe({
      next: () => {
        this.notifications.success('Datos fiscales actualizados');
        this.editingTax.set(false);
        this.savingTax.set(false);
        this.loadPatient(pat.id);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.savingTax.set(false);
      }
    });
  }

  // === Financial Summary ===

  private loadFinancialSummary(): void {
    const pat = this.patient();
    if (!pat) return;

    this.financialLoading.set(true);
    this.patientsService.getFinancialSummary(pat.id).subscribe({
      next: (data) => {
        this.financialSummary.set(data);
        this.financialLoading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar resumen financiero'));
        this.financialLoading.set(false);
      }
    });
  }

  // === History ===

  private loadHistory(): void {
    const pat = this.patient();
    if (!pat) return;

    this.historyLoading.set(true);
    this.patientsService.getHistory(pat.id).subscribe({
      next: (data) => {
        this.patientHistory.set(data);
        this.historyLoading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar historial'));
        this.historyLoading.set(false);
      }
    });
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDateShort(date: Date | string | null): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(date));
  }
}
