import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no notifications', () => {
    expect(service.notifications().length).toBe(0);
    expect(service.hasNotifications()).toBe(false);
  });

  it('should add success notification', () => {
    service.success('Test success');
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].type).toBe('success');
    expect(service.notifications()[0].message).toBe('Test success');
  });

  it('should add error notification', () => {
    service.error('Test error');
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].type).toBe('error');
  });

  it('should add warning notification', () => {
    service.warning('Test warning');
    expect(service.notifications()[0].type).toBe('warning');
  });

  it('should add info notification', () => {
    service.info('Test info');
    expect(service.notifications()[0].type).toBe('info');
  });

  it('should dismiss a notification by id', () => {
    service.success('First');
    service.error('Second');
    const id = service.notifications()[0].id;
    service.dismiss(id);
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].message).toBe('Second');
  });

  it('should clear all notifications', () => {
    service.success('First');
    service.error('Second');
    service.clearAll();
    expect(service.notifications().length).toBe(0);
  });

  it('should auto-dismiss after duration', (done) => {
    service.success('Auto dismiss', 500);
    expect(service.notifications().length).toBe(1);
    setTimeout(() => {
      expect(service.notifications().length).toBe(0);
      done();
    }, 600);
  });

  it('should resolve confirm with true', async () => {
    const promise = service.confirm('Are you sure?');
    expect(service.pendingConfirm()).toBeTruthy();
    service.resolveConfirm(true);
    const result = await promise;
    expect(result).toBe(true);
    expect(service.pendingConfirm()).toBeNull();
  });

  it('should resolve confirm with false', async () => {
    const promise = service.confirm('Are you sure?');
    service.resolveConfirm(false);
    const result = await promise;
    expect(result).toBe(false);
  });

  it('should track hasNotifications correctly', () => {
    expect(service.hasNotifications()).toBe(false);
    service.success('Test');
    expect(service.hasNotifications()).toBe(true);
    service.clearAll();
    expect(service.hasNotifications()).toBe(false);
  });
});
