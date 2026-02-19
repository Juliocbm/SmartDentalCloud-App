import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DentistSelectComponent } from './dentist-select';

describe('DentistSelectComponent', () => {
  let component: DentistSelectComponent;
  let fixture: ComponentFixture<DentistSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DentistSelectComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DentistSelectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default placeholder', () => {
    expect(component.placeholder).toBe('Seleccionar dentista...');
  });

  it('should start with loading false', () => {
    expect(component.loading()).toBeFalse();
  });

  it('should have empty dentists initially', () => {
    expect(component.dentists()).toEqual([]);
  });
});
