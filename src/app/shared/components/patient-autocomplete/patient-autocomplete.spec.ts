import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PatientAutocompleteComponent } from './patient-autocomplete';

describe('PatientAutocompleteComponent', () => {
  let component: PatientAutocompleteComponent;
  let fixture: ComponentFixture<PatientAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientAutocompleteComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientAutocompleteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default placeholder', () => {
    expect(component.placeholder).toBe('Buscar paciente...');
  });

  it('should not show dropdown initially', () => {
    expect(component.showDropdown()).toBeFalse();
  });

  it('should clear selection', () => {
    spyOn(component.patientSelected, 'emit');
    component.clearSelection();
    expect(component.selectedPatient()).toBeNull();
    expect(component.showDropdown()).toBeFalse();
    expect(component.patientSelected.emit).toHaveBeenCalledWith(null);
  });

  it('should show dropdown on focus if patients exist', () => {
    component.patients.set([{ id: '1', name: 'Test', email: '', phone: '' }]);
    component.onFocus();
    expect(component.showDropdown()).toBeTrue();
  });

  it('should not show dropdown on focus if no patients', () => {
    component.onFocus();
    expect(component.showDropdown()).toBeFalse();
  });
});
