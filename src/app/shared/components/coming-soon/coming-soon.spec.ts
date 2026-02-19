import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ComingSoonComponent } from './coming-soon';

describe('ComingSoonComponent', () => {
  let component: ComingSoonComponent;
  let fixture: ComponentFixture<ComingSoonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComingSoonComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { moduleName: 'Tratamientos', icon: 'fa-tooth' } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComingSoonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read moduleName from route data', () => {
    fixture.detectChanges();
    expect(component.moduleName()).toBe('Tratamientos');
  });

  it('should read icon from route data', () => {
    fixture.detectChanges();
    expect(component.icon()).toBe('fa-tooth');
  });

  it('should have default values before init', () => {
    expect(component.moduleName()).toBe('Este módulo');
    expect(component.icon()).toBe('fa-clock');
  });
});
