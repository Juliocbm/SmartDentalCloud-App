import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HeaderComponent } from './header';
import { AuthService } from '../../../core/services/auth.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle notifications panel', () => {
    expect(component.showNotifications).toBeFalse();
    component.toggleNotifications();
    expect(component.showNotifications).toBeTrue();
    expect(component.showUserMenu).toBeFalse();
  });

  it('should toggle user menu and close notifications', () => {
    component.showNotifications = true;
    component.toggleUserMenu();
    expect(component.showUserMenu).toBeTrue();
    expect(component.showNotifications).toBeFalse();
  });

  it('should count unread notifications', () => {
    expect(component.unreadCount).toBe(2);
  });
});
