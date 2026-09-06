import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-screen" (click)="advanceStage()">
      <!-- Stage 1: Official App Squircle Icon from User Screenshot -->
      <div class="stage-container fade-in" *ngIf="stage === 1">
        <div class="app-icon-wrapper">
          <img src="/icons/app-icon.png" alt="My OneApp" class="splash-app-icon" />
        </div>
      </div>

      <!-- Stage 2: Horizontal Safaricom | m-pesa Loading Screen from User Screenshot -->
      <div class="stage-container fade-in" *ngIf="stage === 2">
        <div class="horizontal-logo-wrapper">
          <img src="/icons/stage2-logo-transparent.png" alt="Safaricom | m-pesa" class="stage2-logo-img" />
        </div>
      </div>

      <!-- Bottom Android Gesture Bar -->
      <div class="bottom-bar">
        <div class="home-indicator"></div>
      </div>
    </div>
  `,
  styles: [`
    .splash-screen {
      width: 100%;
      height: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      background-color: #0b0c0e;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      cursor: pointer;
      user-select: none;
    }

    .stage-container {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      width: 100%;
    }

    /* Stage 1: App Squircle Icon */
    .app-icon-wrapper {
      width: 145px;
      height: 145px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: zoomIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .splash-app-icon {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 34px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    }

    /* Stage 2: Horizontal Logo from User Screenshot */
    .horizontal-logo-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 24px;
      animation: fadeIn 0.4s ease;
    }

    .stage2-logo-img {
      width: 240px;
      max-width: 80vw;
      height: auto;
      object-fit: contain;
    }

    /* Bottom Home Indicator */
    .bottom-bar {
      display: flex;
      justify-content: center;
      padding-bottom: 12px;
      flex-shrink: 0;
    }

    .home-indicator {
      width: 110px;
      height: 4px;
      background-color: #636b72;
      border-radius: 4px;
      opacity: 0.65;
    }

    @keyframes zoomIn {
      from { transform: scale(0.85); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class SplashComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  stage: number = 1;
  private timer1: any;
  private timer2: any;

  ngOnInit(): void {
    // Stage 1 (Squircle App Icon) -> 1.3s -> Stage 2 (Horizontal Logo) -> 1.3s -> PIN Entry
    this.timer1 = setTimeout(() => {
      this.stage = 2;
      this.timer2 = setTimeout(() => {
        this.goToPin();
      }, 1300);
    }, 1300);
  }

  ngOnDestroy(): void {
    if (this.timer1) clearTimeout(this.timer1);
    if (this.timer2) clearTimeout(this.timer2);
  }

  advanceStage(): void {
    if (this.stage === 1) {
      if (this.timer1) clearTimeout(this.timer1);
      this.stage = 2;
      this.timer2 = setTimeout(() => {
        this.goToPin();
      }, 1300);
    } else {
      this.goToPin();
    }
  }

  goToPin(): void {
    if (this.timer1) clearTimeout(this.timer1);
    if (this.timer2) clearTimeout(this.timer2);
    this.router.navigate(['/pin']);
  }
}
