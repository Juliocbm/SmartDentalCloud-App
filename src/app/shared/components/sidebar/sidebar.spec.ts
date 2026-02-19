import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SidebarComponent } from './sidebar';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have menu items', () => {
    expect(component.menuItems().length).toBeGreaterThan(0);
  });

  it('should detect children in menu items', () => {
    const withChildren = component.menuItems().find(m => m.id === 'patients');
    const withoutChildren = component.menuItems().find(m => m.id === 'dashboard');
    expect(component.hasChildren(withChildren!)).toBeTrue();
    expect(component.hasChildren(withoutChildren!)).toBeFalse();
  });

  it('should filter menu items by search term', () => {
    component.onSearchChange('paciente');
    expect(component.filteredMenuItems().length).toBeGreaterThan(0);
    expect(component.hasSearchTerm()).toBeTrue();
  });

  it('should clear search', () => {
    component.onSearchChange('test');
    component.clearSearch();
    expect(component.hasSearchTerm()).toBeFalse();
  });

  it('should return all items when search is empty', () => {
    component.onSearchChange('');
    expect(component.filteredMenuItems().length).toBe(component.menuItems().length);
  });
});
