import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(LoggingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call console.error on error()', () => {
    spyOn(console, 'error');
    service.error('Test error', new Error('test'));
    expect(console.error).toHaveBeenCalled();
  });

  it('should call console.warn on warn()', () => {
    spyOn(console, 'warn');
    service.warn('Test warning');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should call console.debug on debug() in non-production', () => {
    spyOn(console, 'debug');
    service.debug('Test debug');
    expect(console.debug).toHaveBeenCalled();
  });

  it('should call console.info on info() in non-production', () => {
    spyOn(console, 'info');
    service.info('Test info');
    expect(console.info).toHaveBeenCalled();
  });
});
