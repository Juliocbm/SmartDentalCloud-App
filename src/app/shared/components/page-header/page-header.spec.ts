import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { Location } from '@angular/common';
import { PageHeaderComponent } from './page-header';

describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept title input', () => {
    component.title = 'Test Title';
    expect(component.title).toBe('Test Title');
  });

  it('should navigate to backRoute on back click when backRoute is set', () => {
    spyOn(router, 'navigate');
    component.backRoute = '/dashboard';
    component.onBackClick();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should use Location.back() when no backRoute', () => {
    const location = TestBed.inject(Location);
    spyOn(location, 'back');
    component.backRoute = undefined;
    component.onBackClick();
    expect(location.back).toHaveBeenCalled();
  });

  it('should navigate to breadcrumb route', () => {
    spyOn(router, 'navigate');
    component.navigateToBreadcrumb('/patients');
    expect(router.navigate).toHaveBeenCalledWith(['/patients']);
  });

  it('should not navigate if breadcrumb route is undefined', () => {
    spyOn(router, 'navigate');
    component.navigateToBreadcrumb(undefined);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
