import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PieChartComponent } from './pie-chart';

describe('PieChartComponent', () => {
  let component: PieChartComponent;
  let fixture: ComponentFixture<PieChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChartComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(PieChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show legend by default', () => {
    expect(component.showLegend).toBeTrue();
  });

  it('should not be doughnut by default', () => {
    expect(component.doughnut).toBeFalse();
  });

  it('should have default height', () => {
    expect(component.height).toBe('300px');
  });
});
