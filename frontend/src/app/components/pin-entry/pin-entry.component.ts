import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, UserProfile } from '../../services/api.service';

@Component({
  selector: 'app-pin-entry',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pin-screen">
      <!-- Top Title -->
      <div class="top-title-bar">
        <h1 class="page-title">Enter your M-PESA PIN</h1>
      </div>

      <!-- User Profile Information with Quick Switcher Trigger -->
      <div class="user-profile-section" (click)="toggleSwitcher()" title="Tap to switch account">
        <div class="avatar-circle">
          {{ user.initials || 'RO' }}
        </div>
        <div class="user-name">{{ user.name || 'Regarn Omondi' }}</div>
        <div class="user-phone-badge">
          <span>{{ user.maskedPhone || '079******85' }}</span>
          <svg class="dropdown-arrow" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 6L8 9.5L11.5 6H4.5Z"/>
          </svg>
        </div>
      </div>

      <!-- Green Data Bundles Notice Pill -->
      <div class="bundles-notice-pill">
        <div class="notice-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.2 4.2L17.2 3.8L18.4 6.6L21.3 7.6L21.3 10.6L23.4 12.8L21.8 15.4L22.6 18.3L19.8 19.8L19.2 22.8L16.2 22.8L14.4 25.2L12 23.4L9.6 25.2L7.8 22.8L4.8 22.8L4.2 19.8L1.4 18.3L2.2 15.4L0.6 12.8L2.7 10.6L2.7 7.6L5.6 6.6L6.8 3.8L9.8 4.2L12 2Z" 
                  fill="#00c853" opacity="0.25"/>
            <path d="M12 4L13.8 5.6L16.2 5.3L17.2 7.5L19.5 8.3L19.5 10.7L21.2 12.5L19.9 14.6L20.5 16.9L18.3 18.1L17.8 20.5L15.4 20.5L14 22.4L12 21L10 22.4L8.6 20.5L6.2 20.5L5.7 18.1L3.5 16.9L4.1 14.6L2.8 12.5L4.5 10.7L4.5 8.3L6.8 7.5L7.8 5.3L10.2 5.6L12 4Z" 
                  stroke="#00c853" stroke-width="1.6"/>
            <path d="M12 9v1M12 13v4" stroke="#00c853" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="12" cy="8.5" r="1.2" fill="#00c853"/>
          </svg>
        </div>
        <span class="notice-text">This app will not use any of your data bundles</span>
      </div>

      <!-- 4 PIN Square Input Boxes -->
      <div class="pin-boxes-container" [class.dancing]="isDancing" [class.shaking]="isShaking">
        <div class="pin-box" [class.filled]="pin.length >= 1" [class.active]="pin.length === 0">
          <div class="pin-dot" *ngIf="pin.length >= 1"></div>
        </div>
        <div class="pin-box" [class.filled]="pin.length >= 2" [class.active]="pin.length === 1">
          <div class="pin-dot" *ngIf="pin.length >= 2"></div>
        </div>
        <div class="pin-box" [class.filled]="pin.length >= 3" [class.active]="pin.length === 2">
          <div class="pin-dot" *ngIf="pin.length >= 3"></div>
        </div>
        <div class="pin-box" [class.filled]="pin.length >= 4" [class.active]="pin.length === 3">
          <div class="pin-dot" *ngIf="pin.length >= 4"></div>
        </div>
      </div>

      <!-- Loading State while Dancing -->
      <div class="pin-loading-container">
        <div class="pin-loading-state" *ngIf="isLoading">
          <div class="mini-spinner"></div>
          <span class="loading-label">Verifying PIN...</span>
        </div>
        <div class="error-text" *ngIf="errorMessage && !isLoading">{{ errorMessage }}</div>
      </div>

      <!-- Numeric Keypad matching photo -->
      <div class="keypad-wrapper" [class.disabled-keypad]="isLoading">
        <div class="keypad-row">
          <button class="num-key" [disabled]="isLoading" (click)="pressKey('1')">1</button>
          <button class="num-key" [disabled]="isLoading" (click)="pressKey('2')">2</button>
          <button class="num-key" [disabled]="isLoading" (click)="pressKey('3')">3</button>
        </div>
        <div class="keypad-row">
          <button class="num-key" [disabled]="isLoading" (click)="pressKey('4')">4</button>
          <button class="num-key" [disabled]="isLoading" (click)="pressKey('5')">5</button>
          <button class="num-key" [disabled]="isLoading" (click)="pressKey('6')">6</button>
        </div>
        <div class="keypad-row">
          <button class="num-key" [disabled]="isLoading" (click)="pressKey('7')">7</button>
          <button class="num-key" [disabled]="isLoading" (click)="pressKey('8')">8</button>
          <button class="num-key" [disabled]="isLoading" (click)="pressKey('9')">9</button>
        </div>
        <div class="keypad-row">
          <div class="num-key empty-key"></div>
          <button class="num-key" [disabled]="isLoading" (click)="pressKey('0')">0</button>
          <!-- Green round backspace button with ✕ from photo -->
          <button class="num-key backspace-btn" [disabled]="isLoading" (click)="deleteKey()">
            <div class="green-x-badge">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="#00c853" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      <!-- Bottom Android Gesture Bar -->
      <div class="bottom-bar">
        <div class="home-indicator"></div>
      </div>

      <!-- ========================================================================= -->
      <!-- QUICK ACCOUNT SWITCHER BOTTOM SHEET (Zero login screen, pure convenience) -->
      <!-- ========================================================================= -->
      <div class="switcher-backdrop" *ngIf="showSwitcher" (click)="toggleSwitcher()"></div>
      <div class="switcher-sheet" *ngIf="showSwitcher">
        <div class="sheet-handle"></div>
        <div class="sheet-header">
          <h3>Select Active Profile</h3>
          <p class="sheet-sub">Each admin controls their own isolated balance & working PINs</p>
        </div>
        <div class="profiles-list">
          <div 
            class="profile-item" 
            *ngFor="let p of availableProfiles" 
            [class.active-p]="p.phone === activeAdminPhone"
            (click)="selectProfile(p)">
            <div class="p-avatar">{{ p.initials || 'AD' }}</div>
            <div class="p-info">
              <span class="p-name">{{ p.name }}</span>
              <span class="p-phone">{{ p.maskedPhone || p.phone }}</span>
            </div>
            <div class="p-check" *ngIf="p.phone === activeAdminPhone">
              <svg viewBox="0 0 20 20" fill="#00c853">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
        <button class="close-sheet-btn" (click)="toggleSwitcher()">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .pin-screen {
      width: 100%;
      height: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      background-color: #0b0c0e;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #ffffff;
      padding: 30px 18px 12px 18px;
      user-select: none;
      position: relative;
    }

    .top-title-bar {
      text-align: center;
      margin-top: 10px;
    }

    .page-title {
      font-size: 16.5px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: 0.2px;
    }

    .user-profile-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 15px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: transform 0.15s ease;
    }

    .user-profile-section:active {
      transform: scale(0.97);
    }

    .avatar-circle {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #e53935 0%, #b71c1c 100%);
      color: #ffffff;
      font-size: 26px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 1px;
      box-shadow: 0 4px 14px rgba(229, 57, 53, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .user-name {
      font-size: 19px;
      font-weight: 700;
      margin-top: 12px;
      color: #ffffff;
      letter-spacing: 0.2px;
    }

    .user-phone-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13.5px;
      color: #9aa0a6;
      font-weight: 500;
      margin-top: 3px;
      background: rgba(255, 255, 255, 0.05);
      padding: 3px 10px;
      border-radius: 12px;
    }

    .dropdown-arrow {
      width: 13px;
      height: 13px;
      opacity: 0.7;
    }

    .bundles-notice-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      background: rgba(18, 25, 21, 0.85);
      border: 1px solid rgba(0, 200, 83, 0.28);
      padding: 7px 14px;
      border-radius: 20px;
      margin: 10px auto 14px auto;
      max-width: 320px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
    }

    .notice-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notice-icon svg {
      width: 100%;
      height: 100%;
    }

    .notice-text {
      font-size: 11.5px;
      font-weight: 500;
      color: #d1d5db;
      line-height: 1.25;
      text-align: center;
    }

    .pin-boxes-container {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin: 12px 0 6px 0;
    }

    @keyframes boxDanceWave {
      0%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-4px);
      }
      70% {
        transform: translateY(3px);
      }
    }

    @keyframes dotPulseGlow {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 6px rgba(0, 200, 83, 0.4);
      }
      50% {
        transform: scale(1.15);
        box-shadow: 0 0 12px rgba(0, 200, 83, 0.9);
      }
    }

    @keyframes boxShake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-8px); }
      40%, 80% { transform: translateX(8px); }
    }

    .pin-boxes-container.dancing .pin-box:nth-child(1) {
      animation: boxDanceWave 0.75s ease-in-out infinite 0.00s;
    }
    .pin-boxes-container.dancing .pin-box:nth-child(2) {
      animation: boxDanceWave 0.75s ease-in-out infinite 0.14s;
    }
    .pin-boxes-container.dancing .pin-box:nth-child(3) {
      animation: boxDanceWave 0.75s ease-in-out infinite 0.28s;
    }
    .pin-boxes-container.dancing .pin-box:nth-child(4) {
      animation: boxDanceWave 0.75s ease-in-out infinite 0.42s;
    }

    .pin-boxes-container.dancing .pin-dot {
      animation: dotPulseGlow 0.75s ease-in-out infinite;
    }

    .pin-boxes-container.shaking {
      animation: boxShake 0.45s ease-in-out;
    }

    .pin-box {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      border: 1.5px solid #2e353b;
      background: #14181c;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .pin-box.active {
      border-color: #00c853;
      background: #18201a;
      box-shadow: 0 0 10px rgba(0, 200, 83, 0.25);
    }

    .pin-box.filled {
      border-color: #3b444b;
      background: #1b2126;
    }

    .pin-dot {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background-color: #ffffff;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
    }

    .pin-loading-container {
      min-height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 4px 0 10px 0;
    }

    .pin-loading-state {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mini-spinner {
      width: 15px;
      height: 15px;
      border: 2px solid rgba(0, 200, 83, 0.2);
      border-top-color: #00c853;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-label {
      font-size: 12.5px;
      color: #00c853;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .error-text {
      color: #ff5252;
      font-size: 12px;
      font-weight: 500;
      text-align: center;
      padding: 0 12px;
    }

    .keypad-wrapper {
      width: 100%;
      max-width: 330px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .keypad-wrapper.disabled-keypad {
      opacity: 0.65;
      pointer-events: none;
    }

    .keypad-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .num-key {
      flex: 1;
      height: 56px;
      background: #151a1e;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      color: #ffffff;
      font-size: 25px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.12s ease;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .num-key:active {
      transform: scale(0.95);
      background: #1f272e;
      border-color: #00c853;
    }

    .empty-key {
      background: transparent;
      border: none;
      box-shadow: none;
      cursor: default;
    }

    .backspace-btn {
      background: #151a1e;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .green-x-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1.8px solid #00c853;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px;
    }

    .green-x-badge svg {
      width: 100%;
      height: 100%;
    }

    .bottom-bar {
      display: flex;
      justify-content: center;
      padding-bottom: 6px;
      flex-shrink: 0;
    }

    .home-indicator {
      width: 110px;
      height: 4px;
      background-color: #636b72;
      border-radius: 4px;
      opacity: 0.65;
    }

    /* Switcher Sheet */
    .switcher-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 99;
    }

    .switcher-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #161b20;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px 20px 0 0;
      padding: 16px 20px 24px 20px;
      z-index: 100;
      animation: slideUp 0.25s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .sheet-handle {
      width: 36px;
      height: 4px;
      background: #4b5563;
      border-radius: 2px;
      margin: 0 auto 14px auto;
    }

    .sheet-header h3 {
      font-size: 17px;
      font-weight: 700;
      margin: 0;
      color: #ffffff;
    }

    .sheet-sub {
      font-size: 12px;
      color: #9aa0a6;
      margin: 4px 0 16px 0;
    }

    .profiles-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 260px;
      overflow-y: auto;
      margin-bottom: 16px;
    }

    .profile-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #1f272e;
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 12px 14px;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .profile-item.active-p {
      border-color: #00c853;
      background: rgba(0, 200, 83, 0.1);
    }

    .p-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #b71c1c;
      color: #ffffff;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .p-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .p-name {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
    }

    .p-phone {
      font-size: 12px;
      color: #9aa0a6;
    }

    .p-check svg {
      width: 22px;
      height: 22px;
    }

    .close-sheet-btn {
      width: 100%;
      padding: 12px;
      background: #283038;
      border: none;
      border-radius: 10px;
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class PinEntryComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  pin: string = '';
  isNavigating: boolean = false;
  isLoading: boolean = false;
  isDancing: boolean = false;
  isShaking: boolean = false;

  activeAdminPhone: string = '0798765485';
  showSwitcher: boolean = false;
  availableProfiles: any[] = [];

  user: UserProfile = {
    name: 'Regarn Omondi',
    initials: 'RO',
    phone: '0798765485',
    maskedPhone: '079******85',
    greeting: 'Good morning,',
    balance: 61.66,
    fuliza: 100.00,
    airtime: 0.00
  };

  errorMessage: string = '';

  ngOnInit(): void {
    this.pin = '';
    this.isNavigating = false;
    this.isLoading = false;
    this.isDancing = false;
    this.isShaking = false;

    this.activeAdminPhone = this.api.getActiveAdminPhone();

    this.api.user$.subscribe(u => {
      if (u) {
        this.user = u;
      }
    });

    // Fetch initial user wallet for active admin
    this.api.getUser(this.activeAdminPhone).subscribe(res => {
      if (res && res.user) this.user = res.user;
    });

    // Preload available admin profiles for switcher
    this.api.getPublicAdminProfiles().subscribe(profiles => {
      this.availableProfiles = profiles;
    });
  }

  toggleSwitcher(): void {
    if (this.isLoading || this.isNavigating) return;
    this.showSwitcher = !this.showSwitcher;
    if (this.showSwitcher) {
      this.api.getPublicAdminProfiles().subscribe(profiles => {
        this.availableProfiles = profiles;
      });
    }
  }

  selectProfile(p: any): void {
    this.activeAdminPhone = p.phone;
    this.api.setActiveAdminPhone(p.phone);
    this.showSwitcher = false;
    this.pin = '';
    this.errorMessage = '';
    this.api.getUser(p.phone).subscribe(res => {
      if (res && res.user) this.user = res.user;
    });
  }

  pressKey(digit: string): void {
    if (this.isLoading || this.isNavigating || this.pin.length >= 4) {
      return;
    }
    this.pin += digit;
    this.errorMessage = '';

    if (this.pin.length === 4) {
      this.isLoading = true;
      this.isDancing = true;

      // Verify PIN against working PINs for active admin or any admin
      this.api.verifyAppPin(this.pin, this.activeAdminPhone).subscribe({
        next: (res) => {
          if (res && res.success) {
            if (res.user) this.user = res.user;
            if (res.adminPhone) {
              this.activeAdminPhone = res.adminPhone;
              this.api.setActiveAdminPhone(res.adminPhone);
            }

            // Load a bit while dancing (~1.5 seconds)
            setTimeout(() => {
              this.isNavigating = true;
              this.router.navigate(['/home']);
            }, 1500);
          } else {
            // Invalid PIN
            setTimeout(() => {
              this.isLoading = false;
              this.isDancing = false;
              this.isShaking = true;
              this.errorMessage = res?.message || 'Incorrect PIN. Enter a working PIN configured in your Admin Dashboard.';
              this.pin = '';
              setTimeout(() => this.isShaking = false, 500);
            }, 750);
          }
        },
        error: (err) => {
          setTimeout(() => {
            this.isLoading = false;
            this.isDancing = false;
            this.isShaking = true;
            this.errorMessage = err.message || 'Incorrect M-PESA PIN';
            this.pin = '';
            setTimeout(() => this.isShaking = false, 500);
          }, 750);
        }
      });
    }
  }

  deleteKey(): void {
    if (this.isLoading || this.isNavigating) return;
    if (this.pin.length > 0) {
      this.pin = this.pin.slice(0, -1);
      this.errorMessage = '';
    }
  }
}
