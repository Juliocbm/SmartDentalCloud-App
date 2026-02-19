import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PatientListComponent } from './patient-list';

describe('PatientListComponent', () => {
  let component: PatientListComponent;
  let fixture: ComponentFixture<PatientListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default pagination values', () => {
    expect(component.currentPage()).toBe(1);
    expect(component.pageSize()).toBe(10);
  });

  it('should start with empty patients', () => {
    expect(component.patients()).toEqual([]);
  });

  it('should have breadcrumb items', () => {
    expect(component.breadcrumbItems.length).toBeGreaterThan(0);
  });

  it('should start with all status filter', () => {
    expect(component.filterStatus()).toBe('all');
  });
});
