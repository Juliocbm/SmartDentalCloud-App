import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

// ── Models ──

export interface SignatureResult {
  id: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  reason: string | null;
  ipAddress: string | null;
  signedAt: string;
}

export interface SetPinRequest {
  pin: string;
  confirmPin: string;
}

export interface SignDocumentRequest {
  entityType: string;
  entityId: string;
  pin: string;
  reason?: string;
}

// ── Service ──

@Injectable({ providedIn: 'root' })
export class ElectronicSignatureService {
  private api = inject(ApiService);

  /** Configura o actualiza el PIN de firma electrónica */
  setPin(request: SetPinRequest): Observable<void> {
    return this.api.post<void>('/users/signature-pin', request);
  }

  /** Firma electrónicamente un documento clínico */
  signDocument(request: SignDocumentRequest): Observable<SignatureResult> {
    return this.api.post<SignatureResult>('/users/sign', request);
  }

  /** Obtiene las firmas electrónicas de un documento */
  getSignatures(entityType: string, entityId: string): Observable<SignatureResult[]> {
    return this.api.get<SignatureResult[]>('/users/signatures', { entityType, entityId });
  }
}
