import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, Component, ViewContainerRef, inject } from '@angular/core';
import { ModalService, ModalComponentBase, ModalRef, ModalConfig } from './modal.service';

// Test modal component
@Component({ selector: 'app-test-modal', standalone: true, template: '<p>test</p>' })
class TestModalComponent implements ModalComponentBase<{ message: string }, boolean> {
  modalData?: { message: string };
  modalRef?: ModalRef<{ message: string }, boolean>;
  modalConfig?: ModalConfig<{ message: string }>;
}

// Host component to provide ViewContainerRef
@Component({ selector: 'app-test-host', standalone: true, template: '' })
class TestHostComponent {
  vcr = inject(ViewContainerRef);
}

describe('ModalService', () => {
  let service: ModalService;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, TestModalComponent],
      providers: [provideZonelessChangeDetection()]
    });

    service = TestBed.inject(ModalService);
    hostFixture = TestBed.createComponent(TestHostComponent);
    service.registerViewContainerRef(hostFixture.componentInstance.vcr);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should throw if ViewContainerRef not registered', () => {
    const freshService = new ModalService();
    expect(() => freshService.open(TestModalComponent)).toThrowError(/ViewContainerRef no registrado/);
  });

  it('should open a modal and return ModalRef', () => {
    const ref = service.open(TestModalComponent, { data: { message: 'hello' } });
    expect(ref).toBeTruthy();
    expect(ref.data).toEqual({ message: 'hello' });
    expect(service.isOpen()).toBeTrue();
  });

  it('should close modal via ModalRef.close()', () => {
    const ref = service.open(TestModalComponent);
    let closedResult: boolean | undefined;

    ref.afterClosed().subscribe(result => {
      closedResult = result;
    });

    ref.close(true);

    expect(closedResult).toBeTrue();
    expect(service.isOpen()).toBeFalse();
  });

  it('should support stacking multiple modals', () => {
    const ref1 = service.open(TestModalComponent);
    const ref2 = service.open(TestModalComponent);

    expect(service.isOpen()).toBeTrue();

    ref2.close();
    expect(service.isOpen()).toBeTrue();

    ref1.close();
    expect(service.isOpen()).toBeFalse();
  });

  it('should close all modals via closeAll()', () => {
    service.open(TestModalComponent);
    service.open(TestModalComponent);

    service.closeAll();
    expect(service.isOpen()).toBeFalse();
  });

  it('should close last modal via closeLast()', () => {
    service.open(TestModalComponent);
    service.open(TestModalComponent);

    service.closeLast();
    expect(service.isOpen()).toBeTrue();

    service.closeLast();
    expect(service.isOpen()).toBeFalse();
  });
});
