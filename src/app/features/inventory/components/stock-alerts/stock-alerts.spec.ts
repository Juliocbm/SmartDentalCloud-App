import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StockAlertsComponent } from './stock-alerts';

describe('StockAlertsComponent', () => {
  let component: StockAlertsComponent;
  let fixture: ComponentFixture<StockAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockAlertsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StockAlertsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with loading false', () => {
    expect(component.loading()).toBeFalse();
  });
});
