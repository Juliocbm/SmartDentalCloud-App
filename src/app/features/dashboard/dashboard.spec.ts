import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard';
import { DashboardService } from './services/dashboard.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        DashboardService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with loading true', () => {
    expect(component.loading()).toBeTrue();
  });

  it('should have quick actions defined', () => {
    expect(component.quickActions.length).toBeGreaterThan(0);
  });

  it('should navigate on quick action', () => {
    spyOn(router, 'navigate');
    component.onQuickAction(component.quickActions[0]);
    expect(router.navigate).toHaveBeenCalledWith([component.quickActions[0].route]);
  });

  it('should format currency in MXN', () => {
    const formatted = component.formatCurrency(1500);
    expect(formatted).toContain('1,500');
  });
});
