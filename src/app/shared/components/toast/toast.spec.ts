import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ToastComponent } from './toast';
import { NotificationService } from '../../../core/services/notification.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let notificationService: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct icon for notification types', () => {
    expect(component.getIcon('success')).toBe('fa-circle-check');
    expect(component.getIcon('error')).toBe('fa-circle-xmark');
    expect(component.getIcon('warning')).toBe('fa-triangle-exclamation');
    expect(component.getIcon('info')).toBe('fa-circle-info');
    expect(component.getIcon('unknown')).toBe('fa-circle-info');
  });

  it('should dismiss notification', () => {
    spyOn(notificationService, 'dismiss');
    component.dismiss(1);
    expect(notificationService.dismiss).toHaveBeenCalledWith(1);
  });

  it('should resolve confirm with true', () => {
    spyOn(notificationService, 'resolveConfirm');
    component.onConfirm();
    expect(notificationService.resolveConfirm).toHaveBeenCalledWith(true);
  });

  it('should resolve confirm with false on cancel', () => {
    spyOn(notificationService, 'resolveConfirm');
    component.onCancel();
    expect(notificationService.resolveConfirm).toHaveBeenCalledWith(false);
  });
});
