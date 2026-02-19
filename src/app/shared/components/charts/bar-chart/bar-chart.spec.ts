import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BarChartComponent } from './bar-chart';

describe('BarChartComponent', () => {
  let component: BarChartComponent;
  let fixture: ComponentFixture<BarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(BarChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default height', () => {
    expect(component.height).toBe('300px');
  });

  it('should not be horizontal by default', () => {
    expect(component.horizontal).toBeFalse();
  });

  it('should accept data input', () => {
    component.data = [{ label: 'A', value: 10 }];
    expect(component.data.length).toBe(1);
  });
});
