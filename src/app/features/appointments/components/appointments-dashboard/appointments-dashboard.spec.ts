import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppointmentsDashboardComponent } from './appointments-dashboard';
import { AppointmentsService } from '../../services/appointments.service';
import { AppointmentsAnalyticsService } from '../../services/appointments-analytics.service';

describe('AppointmentsDashboardComponent', () => {
  let component: AppointmentsDashboardComponent;
  let fixture: ComponentFixture<AppointmentsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsDashboardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AppointmentsService,
        AppointmentsAnalyticsService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentsDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with loading true', () => {
    expect(component.loading()).toBeTrue();
  });
});
