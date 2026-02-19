import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DentistListComponent } from './dentist-list';

describe('DentistListComponent', () => {
  let component: DentistListComponent;
  let fixture: ComponentFixture<DentistListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DentistListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DentistListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty dentists', () => {
    expect(component.dentists()).toEqual([]);
  });

  it('should start with loading true', () => {
    expect(component.loading()).toBeTrue();
  });

  it('should have breadcrumb items', () => {
    expect(component.breadcrumbItems.length).toBeGreaterThan(0);
  });
});
