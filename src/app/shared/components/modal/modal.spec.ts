import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ModalComponent } from './modal';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default size md', () => {
    expect(component.size()).toBe('md');
  });

  it('should show close button by default', () => {
    expect(component.showCloseButton()).toBeTrue();
  });

  it('should close on backdrop by default', () => {
    expect(component.closeOnBackdrop()).toBeTrue();
  });

  it('should emit closed on close()', () => {
    spyOn(component.closed, 'emit');
    component.close();
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should emit closed on escape key', () => {
    spyOn(component.closed, 'emit');
    component.onEscapeKey();
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should close on backdrop click when closeOnBackdrop is true', () => {
    spyOn(component, 'close');
    const mockEvent = { target: document.createElement('div'), currentTarget: document.createElement('div') } as unknown as Event;
    Object.defineProperty(mockEvent, 'currentTarget', { value: mockEvent.target });
    component.onBackdropClick(mockEvent);
    expect(component.close).toHaveBeenCalled();
  });
});
