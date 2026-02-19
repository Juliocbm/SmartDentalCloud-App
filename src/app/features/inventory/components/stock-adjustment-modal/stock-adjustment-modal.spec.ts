import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StockAdjustmentModalComponent } from './stock-adjustment-modal';

describe('StockAdjustmentModalComponent', () => {
  let component: StockAdjustmentModalComponent;
  let fixture: ComponentFixture<StockAdjustmentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockAdjustmentModalComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StockAdjustmentModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with saving false', () => {
    expect(component.saving()).toBeFalse();
  });
});
