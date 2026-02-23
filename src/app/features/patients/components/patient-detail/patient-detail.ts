import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PatientsService } from '../../services/patients.service';
import { Patient, UpdateTaxInfoRequest } from '../../models/patient.models';
import { AttachedFile, FILE_CATEGORIES, getFileIcon, formatFileSize } from '../../models/attached-file.models';
import { PatientFinancialSummary, PatientHistory } from '../../models/patient-dashboard.models';
import { AttachedFilesService } from '../../services/attached-files.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { OdontogramComponent } from '../../../dental-chart/components/odontogram/odontogram';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OdontogramComponent, PageHeaderComponent, AuditInfoComponent],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss'
})
export class PatientDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientsService = inject(PatientsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private attachedFilesService = inject(AttachedFilesService);
  private location = inject(Location);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pacientes', route: '/patients' },
    { label: 'Detalle' }
  ];

  patient = signal<Patient | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'info' | 'medical' | 'odontogram' | 'fiscal' | 'financial' | 'history' | 'files'>('info');

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
  showUploadForm = signal(false);
  uploading = signal(false);
  uploadCategory = signal('');
  uploadDescription = signal('');
  selectedFile = signal<File | null>(null);
  FILE_CATEGORIES = FILE_CATEGORIES;
  getFileIcon = getFileIcon;
  formatFileSize = formatFileSize;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPatient(id);
    }
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
        this.error.set('Error al cargar el paciente. Por favor intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  setActiveTab(tab: 'info' | 'medical' | 'odontogram' | 'fiscal' | 'financial' | 'history' | 'files'): void {
    this.activeTab.set(tab);
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
      error: () => {
        this.filesLoading.set(false);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  toggleUploadForm(): void {
    this.showUploadForm.update(v => !v);
    if (this.showUploadForm()) {
      this.selectedFile.set(null);
      this.uploadCategory.set('');
      this.uploadDescription.set('');
    }
  }

  uploadFile(): void {
    const patient = this.patient();
    const file = this.selectedFile();
    if (!patient || !file || this.uploading()) return;

    this.uploading.set(true);
    this.attachedFilesService.upload(
      patient.id,
      file,
      this.uploadCategory() || undefined,
      this.uploadDescription().trim() || undefined
    ).subscribe({
      next: () => {
        this.notifications.success('Archivo subido exitosamente');
        this.showUploadForm.set(false);
        this.uploading.set(false);
        this.loadFiles();
      },
      error: () => {
        this.notifications.error('Error al subir el archivo');
        this.uploading.set(false);
      }
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
      error: () => {
        this.notifications.error('Error al eliminar el archivo');
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

  hasAllergies(): boolean {
    const patient = this.patient();
    return !!(patient && patient.allergies && patient.allergies.trim().length > 0);
  }

  hasMedicalHistory(): boolean {
    const patient = this.patient();
    return !!(patient && (patient.allergies || patient.chronicDiseases || patient.currentMedications));
  }

  goBack(): void {
    this.location.back();
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
      error: () => {
        this.notifications.error('Error al guardar datos fiscales');
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
      error: () => {
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
      error: () => {
        this.historyLoading.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDateShort(date: Date | string | null): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(date));
  }
}
