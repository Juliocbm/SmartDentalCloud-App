import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentRef } from '@angular/core';
import { OdontogramComponent } from './odontogram';

describe('OdontogramComponent', () => {
  let component: OdontogramComponent;
  let fixture: ComponentFixture<OdontogramComponent>;
  let componentRef: ComponentRef<OdontogramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdontogramComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OdontogramComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('patientId', 'test-patient-id');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with loading true', () => {
    expect(component.loading()).toBeTrue();
  });

  it('should start with no selected tooth', () => {
    expect(component.selectedTooth()).toBeNull();
  });

  it('should have 8 teeth per quadrant for permanent dentition', () => {
    expect(component.upperRight().length).toBe(8);
    expect(component.upperLeft().length).toBe(8);
    expect(component.lowerRight().length).toBe(8);
    expect(component.lowerLeft().length).toBe(8);
  });

  it('should have 5 teeth per quadrant for primary dentition', () => {
    component.switchDentition('primary');
    expect(component.upperRight().length).toBe(5);
    expect(component.upperLeft().length).toBe(5);
    expect(component.lowerRight().length).toBe(5);
    expect(component.lowerLeft().length).toBe(5);
  });

  it('should have detail panel hidden initially', () => {
    expect(component.showDetailPanel()).toBeFalse();
  });

  it('should have 6 status options', () => {
    expect(component.statusOptions.length).toBe(6);
  });

  it('should compute empty stats initially', () => {
    expect(component.stats().total).toBe(0);
  });

  it('should handle tooth hover', () => {
    component.onToothHover('11');
    expect(component.hoveredTooth()).toBe('11');
    component.onToothHover(null);
    expect(component.hoveredTooth()).toBeNull();
  });

  it('should return default color for unknown tooth', () => {
    expect(component.getToothColor('99')).toBe('#E0E0E0');
  });

  it('should toggle conditions', () => {
    component.toggleCondition('caries');
    expect(component.editConditions().has('caries')).toBeTrue();
    component.toggleCondition('caries');
    expect(component.editConditions().has('caries')).toBeFalse();
  });
});
