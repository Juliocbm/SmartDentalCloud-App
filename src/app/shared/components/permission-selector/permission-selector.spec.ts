import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PermissionSelectorComponent } from './permission-selector';

describe('PermissionSelectorComponent', () => {
  let component: PermissionSelectorComponent;
  let fixture: ComponentFixture<PermissionSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionSelectorComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PermissionSelectorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with loading true', () => {
    expect(component.loading()).toBeTrue();
  });

  it('should toggle permission', () => {
    component.selectedPermissions = [];
    spyOn(component.permissionsChange, 'emit');

    component.togglePermission('patients.read');
    expect(component.selectedPermissions).toContain('patients.read');

    component.togglePermission('patients.read');
    expect(component.selectedPermissions).not.toContain('patients.read');
  });

  it('should toggle category expansion', () => {
    component.expandedGroups.set(new Set(['Pacientes']));
    component.toggleCategory('Pacientes');
    expect(component.isCategoryExpanded('Pacientes')).toBeFalse();
    component.toggleCategory('Pacientes');
    expect(component.isCategoryExpanded('Pacientes')).toBeTrue();
  });

  it('should deselect all', () => {
    component.selectedPermissions = ['a', 'b'];
    spyOn(component.permissionsChange, 'emit');
    component.deselectAll();
    expect(component.selectedPermissions).toEqual([]);
    expect(component.permissionsChange.emit).toHaveBeenCalledWith([]);
  });

  it('should return total selected count', () => {
    component.selectedPermissions = ['a', 'b', 'c'];
    expect(component.getTotalSelectedCount()).toBe(3);
  });

  it('should collapse all groups', () => {
    component.expandedGroups.set(new Set(['A', 'B']));
    component.collapseAll();
    expect(component.expandedGroups().size).toBe(0);
  });
});
