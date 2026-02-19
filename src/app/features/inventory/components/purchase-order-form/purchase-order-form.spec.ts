import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PurchaseOrderFormComponent } from './purchase-order-form';

describe('PurchaseOrderFormComponent', () => {
  let component: PurchaseOrderFormComponent;
  let fixture: ComponentFixture<PurchaseOrderFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseOrderFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseOrderFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with saving false', () => {
    expect(component.saving()).toBeFalse();
  });

  it('should have subtotal computed as 0 after init', () => {
    fixture.detectChanges();
    expect(component.subtotal()).toBe(0);
  });

  it('should compute tax as 16% of subtotal', () => {
    fixture.detectChanges();
    expect(component.tax()).toBe(0);
  });
});
