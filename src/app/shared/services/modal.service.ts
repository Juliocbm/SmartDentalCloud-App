import { Injectable, ComponentRef, ViewContainerRef, Type, signal } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Configuración para abrir un modal
 */
export interface ModalConfig<T = any> {
  data?: T;
  width?: string;
  maxWidth?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

/**
 * Referencia al modal abierto
 */
export interface ModalRef<T = any, R = any> {
  close: (result?: R) => void;
  afterClosed: () => Subject<R | undefined>;
  data: T;
}

/**
 * Servicio para gestión de modales en toda la aplicación.
 * Permite abrir modales de forma programática desde cualquier componente.
 */
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private viewContainerRef: ViewContainerRef | null = null;
  private modalStack: ComponentRef<any>[] = [];
  
  isOpen = signal(false);

  /**
   * Registra el ViewContainerRef donde se renderizarán los modales.
   * Debe llamarse una vez desde el componente raíz (app.component o layout).
   */
  registerViewContainerRef(vcr: ViewContainerRef): void {
    this.viewContainerRef = vcr;
  }

  /**
   * Abre un modal con el componente especificado
   */
  open<T, R = any>(component: Type<any>, config: ModalConfig<T> = {}): ModalRef<T, R> {
    if (!this.viewContainerRef) {
      throw new Error('ModalService: ViewContainerRef no registrado. Llama registerViewContainerRef() primero.');
    }

    const afterClosedSubject = new Subject<R | undefined>();
    
    const componentRef = this.viewContainerRef.createComponent(component);
    
    // Pasar datos al componente
    if (config.data) {
      (componentRef.instance as any).modalData = config.data;
    }

    // Configurar el cierre
    const modalRef: ModalRef<T, R> = {
      close: (result?: R) => {
        afterClosedSubject.next(result);
        afterClosedSubject.complete();
        this.closeModal(componentRef);
      },
      afterClosed: () => afterClosedSubject,
      data: config.data as T
    };

    // Pasar la referencia al componente
    (componentRef.instance as any).modalRef = modalRef;
    (componentRef.instance as any).modalConfig = config;

    this.modalStack.push(componentRef);
    this.isOpen.set(true);

    // Manejar cierre con Escape
    if (config.closeOnEscape !== false) {
      const escapeHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          modalRef.close();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
    }

    return modalRef;
  }

  /**
   * Cierra el modal más reciente
   */
  closeLast(): void {
    const lastModal = this.modalStack.pop();
    if (lastModal) {
      lastModal.destroy();
    }
    this.isOpen.set(this.modalStack.length > 0);
  }

  /**
   * Cierra todos los modales abiertos
   */
  closeAll(): void {
    this.modalStack.forEach(modal => modal.destroy());
    this.modalStack = [];
    this.isOpen.set(false);
  }

  private closeModal(componentRef: ComponentRef<any>): void {
    const index = this.modalStack.indexOf(componentRef);
    if (index > -1) {
      this.modalStack.splice(index, 1);
      componentRef.destroy();
    }
    this.isOpen.set(this.modalStack.length > 0);
  }
}
