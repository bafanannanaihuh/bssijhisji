import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, UserProfile, Transaction, generateKenyanName, generateMpesaTxCode, calculateMpesaFee } from '../../services/api.service';

@Component({
  selector: 'app-send-money',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="send-screen">
      <!-- ========================================================================= -->
      <!-- TOP PUSH NOTIFICATION POPUP (Image 3: media_1788687256942.png)           -->
      <!-- Pops up after transaction, auto-dismisses after ~5.5s                     -->
      <!-- ========================================================================= -->
      <div 
        class="notification-dropdown-wrapper" 
        *ngIf="showNotificationPopup"
        [class.dismissing]="isDismissingNotif">
        <div class="android-push-notification">
          <!-- Top Row: Messages App Header -->
          <div class="notif-header-row">
            <div class="notif-header-left">
              <!-- Official Google Messages Blue Icon (Zero white background, strictly transparent) -->
              <div class="msg-bubble-icon">
                <img 
                  src="data:image/png;base64,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" 
                  alt="Messages" 
                  class="messages-app-logo" 
                />
              </div>
              <span class="notif-source">Messages</span>
              <span class="notif-dot">•</span>
              <span class="notif-time">Just now</span>
              <!-- Clean native system notification bell icon replacing emoji -->
              <div class="notif-bell-icon" title="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
            </div>
            <button class="notif-chevron-btn" (click)="dismissNotification()" title="Collapse">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>

          <!-- Middle Row: Content & Cyan 'M' Avatar -->
          <div class="notif-body-row">
            <div class="notif-content-col">
              <div class="notif-title">MPESA</div>
              <div class="notif-message">
                {{ completedTx?.id || 'UI6LQ5B06S' }} Confirmed. Ksh{{ (completedTx?.amount || amount || 1) | number:'1.2-2' }} sent to {{ completedTx?.recipient || resolvedRecipientName }} {{ completedTx?.phone || phoneNumber }} on {{ txFormattedDate }} at {{ txFormattedTime }}. New M...
              </div>
            </div>
            <div class="notif-avatar-m">
              M
            </div>
          </div>

          <!-- Bottom Actions: Chrome Open Link + Chips -->
          <div class="notif-actions-row">
            <button class="notif-action-pill open-link-btn" (click)="dismissNotification()">
              <svg class="chrome-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#4285F4"/>
                <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
                <circle cx="12" cy="12" r="3.2" fill="#1a73e8"/>
              </svg>
              <span>OPEN LINK</span>
            </button>
            <button class="notif-action-pill" (click)="dismissNotification()">Reply</button>
            <button class="notif-action-pill" (click)="dismissNotification()">Delete</button>
            <button class="notif-action-pill" (click)="dismissNotification()">Mark as read</button>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- STEP 1: SEND MONEY INPUT FORM (Image 1: media_1788686851153.png)          -->
      <!-- ========================================================================= -->
      <div class="step-view" *ngIf="currentStep === 1">
        <!-- Top Header Navigation -->
        <div class="send-header">
          <button class="back-btn" (click)="goBack()">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 class="header-title">Send Money</h2>
          <div class="placeholder-right"></div>
        </div>

        <div class="scroll-body">
          <!-- Switch Tabs: Mobile number vs Pochi la Biashara -->
          <div class="switch-tabs">
            <button 
              class="tab-btn" 
              [class.active]="selectedTab === 'mobile'" 
              (click)="selectedTab = 'mobile'">
              Mobile number
            </button>
            <button 
              class="tab-btn" 
              [class.active]="selectedTab === 'pochi'" 
              (click)="selectedTab = 'pochi'">
              Pochi la Biashara
            </button>
          </div>

          <!-- Favourites Section -->
          <div class="favourites-section">
            <div class="fav-header">
              <span class="fav-title">Favourites</span>
              <button class="view-all-link">View All</button>
            </div>

            <div class="fav-list">
              <!-- Add Button -->
              <div class="fav-item" (click)="promptAddFavorite()">
                <div class="fav-add-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#f04438" stroke-width="2.4" stroke-linecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
                <span class="fav-name">Add</span>
              </div>

              <!-- Pre-populated Favorites -->
              <div class="fav-item" *ngFor="let fav of favorites" (click)="selectFavorite(fav)">
                <div class="fav-circle">
                  {{ fav.name | slice:0:1 }}
                </div>
                <span class="fav-name">{{ fav.name }}</span>
              </div>
            </div>
          </div>

          <!-- Enter Phone Number -->
          <div class="form-group">
            <label class="form-label">Enter Phone Number</label>
            <div class="input-wrapper phone-wrapper">
              <input 
                type="tel" 
                class="form-input" 
                [(ngModel)]="phoneNumber" 
                placeholder="Enter Phone Number"
                (input)="onPhoneChanged()"
              />
              <div class="input-icons">
                <button class="input-icon-btn" (click)="pickDemoContact()" title="Select Contact">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <circle cx="12" cy="12" r="9.5" stroke="#22a958" stroke-width="1.8"/>
                    <circle cx="12" cy="9.5" r="3" fill="#22a958"/>
                    <path d="M6.5 17.5c1.2-2.5 3.3-3.5 5.5-3.5s4.3 1 5.5 3.5" stroke="#22a958" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                </button>
                <span class="icon-divider"></span>
                <button class="input-icon-btn" (click)="scanQrCode()" title="Scan QR">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                    <path d="M3 7V4a1 1 0 0 1 1-1h3" stroke="#22a958" stroke-width="2" stroke-linecap="round"/>
                    <path d="M17 3h3a1 1 0 0 1 1 1v3" stroke="#e50914" stroke-width="2" stroke-linecap="round"/>
                    <path d="M3 17v3a1 1 0 0 0 1 1h3" stroke="#22a958" stroke-width="2" stroke-linecap="round"/>
                    <path d="M17 21h3a1 1 0 0 0 1-1v-3" stroke="#e50914" stroke-width="2" stroke-linecap="round"/>
                    <rect x="7" y="7" width="2.5" height="2.5" fill="#22a958"/>
                    <rect x="14.5" y="7" width="2.5" height="2.5" fill="#e50914"/>
                    <rect x="7" y="14.5" width="2.5" height="2.5" fill="#22a958"/>
                    <rect x="14.5" y="14.5" width="2.5" height="2.5" fill="#ffffff"/>
                  </svg>
                </button>
              </div>
            </div>
            <!-- Recipient Name in Green right below phone input (Image 1) -->
            <div class="recipient-green-label" *ngIf="resolvedRecipientName">
              {{ resolvedRecipientName }}
            </div>
          </div>

          <!-- Enter Amount -->
          <div class="form-group">
            <label class="form-label">Enter Amount</label>
            <div class="input-wrapper amount-wrapper">
              <input 
                type="number" 
                class="form-input amount-input" 
                [(ngModel)]="amount" 
                placeholder="0"
                min="1"
              />
              <span class="input-suffix">Ksh</span>
            </div>
            <div class="amount-subtext-pill"></div>
          </div>

          <!-- Select Payment Method -->
          <div class="form-group">
            <label class="form-label font-medium">Select Payment Method</label>
            <div class="payment-methods-grid">
              <!-- M-PESA (Selected) -->
              <div 
                class="method-card" 
                [class.selected]="selectedPaymentMethod === 'M-PESA'"
                (click)="selectedPaymentMethod = 'M-PESA'">
                <div class="corner-check" *ngIf="selectedPaymentMethod === 'M-PESA'">
                  <svg viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="method-left">
                  <div class="method-icon-box">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                      <path d="M3 14c4-3 9-4 15-2-4 4-8 5-15 2z" fill="#e50914"/>
                      <path d="M7 11c3-2 7-3 12-1-3 3-6 4-12 1z" fill="#e50914" opacity="0.9"/>
                    </svg>
                  </div>
                  <div class="method-info">
                    <span class="method-name">M-PESA</span>
                    <span class="method-sub">Bal. Ksh. {{ user.balance | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>

              <!-- Shiriki Pay -->
              <div 
                class="method-card" 
                [class.selected]="selectedPaymentMethod === 'Shiriki Pay'"
                (click)="selectedPaymentMethod = 'Shiriki Pay'">
                <div class="method-left">
                  <div class="method-icon-s">S</div>
                  <div class="method-info">
                    <span class="method-name">Shiriki Pay</span>
                    <span class="method-sub">Select</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Continue Button -->
          <div class="action-btn-row">
            <button 
              class="continue-btn" 
              [class.active]="isFormValid()" 
              [disabled]="!isFormValid()"
              (click)="goToConfirmStep()">
              Continue
            </button>
          </div>

          <!-- Do More Section -->
          <div class="do-more-section">
            <h3 class="do-more-title">Do More</h3>
            <div class="do-more-grid">
              <div class="do-more-card">
                <div class="do-more-icon">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                    <circle cx="12" cy="7" r="2.8" stroke="#22a958" stroke-width="1.8"/>
                    <path d="M7.5 17.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="#22a958" stroke-width="1.8" stroke-linecap="round"/>
                    <circle cx="6" cy="9" r="2.2" stroke="#e50914" stroke-width="1.6"/>
                    <circle cx="18" cy="9" r="2.2" stroke="#e50914" stroke-width="1.6"/>
                    <path d="M3.5 17.5c0-1.8 1.4-3.2 3.2-3.4M20.5 17.5c0-1.8-1.4-3.2-3.2-3.4" stroke="#e50914" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                </div>
                <span class="do-more-label">Send to<br/>Many</span>
              </div>
              <div class="do-more-card">
                <div class="do-more-icon">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                    <rect x="3" y="6" width="18" height="13" rx="2" stroke="#22a958" stroke-width="1.8"/>
                    <circle cx="9" cy="12.5" r="2.5" stroke="#22a958" stroke-width="1.8"/>
                    <path d="M16 11l3-3m0 0l-3-3m3 3h-6" stroke="#e50914" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="do-more-label">Request<br/>Money</span>
              </div>
              <div class="do-more-card">
                <div class="do-more-icon">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="#22a958" stroke-width="1.8"/>
                    <path d="M3.5 12h17M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z" stroke="#22a958" stroke-width="1.5"/>
                    <path d="M16 16c2 0 4 2 4 4" stroke="#e50914" stroke-width="2.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <span class="do-more-label">International<br/>Transfers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- STEP 2: CONFIRM SCREEN (Image 2: media_1788686876604.png)                 -->
      <!-- ========================================================================= -->
      <div class="step-view confirm-step" *ngIf="currentStep === 2">
        <div class="send-header">
          <button class="back-btn" (click)="currentStep = 1">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 class="header-title">Confirm</h2>
          <div class="placeholder-right"></div>
        </div>

        <div class="confirm-body">
          <!-- Main Confirm Card with Gradient Top Line -->
          <div class="confirm-card">
            <!-- Top Gradient Accent Line -->
            <div class="card-gradient-top"></div>

            <!-- Avatar Badge centered over card -->
            <div class="card-avatar-wrapper">
              <div class="card-avatar-circle">
                <div class="card-avatar-inner">
                  {{ recipientInitials }}
                </div>
              </div>
            </div>

            <!-- Subtitle -->
            <div class="confirm-subtitle">Send money to mobile number</div>

            <div class="confirm-divider"></div>

            <!-- Detail Rows -->
            <div class="confirm-rows-list">
              <div class="confirm-row">
                <span class="cr-label">Send to</span>
                <span class="cr-val">{{ resolvedRecipientName }}</span>
              </div>
              <div class="confirm-row">
                <span class="cr-label">Amount</span>
                <span class="cr-val">Ksh {{ amount | number:'1.2-2' }}</span>
              </div>
              <div class="confirm-row">
                <span class="cr-label">Transaction cost</span>
                <span class="cr-val">{{ transactionFee > 0 ? ('Ksh ' + (transactionFee | number:'1.2-2')) : 'Ksh 0.00' }}</span>
              </div>
            </div>
          </div>

          <!-- Send Button at bottom -->
          <div class="confirm-action-area">
            <button class="send-btn" (click)="goToPinStep()">
              Send
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- STEP 3: ENTER M-PESA PIN (Image 3: media_1788686901837.png)               -->
      <!-- Waits a moment with processing feedback before success (User requirement)  -->
      <!-- ========================================================================= -->
      <div class="step-view pin-step" *ngIf="currentStep === 3">
        <div class="send-header">
          <button class="back-btn" (click)="currentStep = 2" [disabled]="isSubmittingTx">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 class="header-title">Enter M-PESA PIN</h2>
          <div class="placeholder-right"></div>
        </div>

        <div class="pin-step-content">
          <!-- Recipient Header Badge -->
          <div class="pin-recipient-section">
            <div class="recipient-avatar-blue">
              {{ recipientInitials }}
            </div>
            <div class="recipient-full-name">{{ resolvedRecipientName }}</div>
            <div class="recipient-amount-fee">
              Ksh. {{ amount | number:'1.2-2' }} Fee:Ksh. 0.00
            </div>
          </div>

          <!-- 4 PIN Square Boxes (dance when validating PIN) -->
          <div class="pin-boxes-container" [class.dancing]="isSubmittingTx">
            <div class="pin-box" [class.filled]="txPin.length >= 1">
              <div class="pin-dot" *ngIf="txPin.length >= 1"></div>
            </div>
            <div class="pin-box" [class.filled]="txPin.length >= 2">
              <div class="pin-dot" *ngIf="txPin.length >= 2"></div>
            </div>
            <div class="pin-box" [class.filled]="txPin.length >= 3">
              <div class="pin-dot" *ngIf="txPin.length >= 3"></div>
            </div>
            <div class="pin-box" [class.filled]="txPin.length >= 4">
              <div class="pin-dot" *ngIf="txPin.length >= 4"></div>
            </div>
          </div>

          <div class="error-text" *ngIf="pinErrorMessage">{{ pinErrorMessage }}</div>

          <!-- Numeric Keypad -->
          <div class="keypad-wrapper" [class.disabled-keypad]="isSubmittingTx">
            <div class="keypad-row">
              <button class="num-key" (click)="pressTxPin('1')">1</button>
              <button class="num-key" (click)="pressTxPin('2')">2</button>
              <button class="num-key" (click)="pressTxPin('3')">3</button>
            </div>
            <div class="keypad-row">
              <button class="num-key" (click)="pressTxPin('4')">4</button>
              <button class="num-key" (click)="pressTxPin('5')">5</button>
              <button class="num-key" (click)="pressTxPin('6')">6</button>
            </div>
            <div class="keypad-row">
              <button class="num-key" (click)="pressTxPin('7')">7</button>
              <button class="num-key" (click)="pressTxPin('8')">8</button>
              <button class="num-key" (click)="pressTxPin('9')">9</button>
            </div>
            <div class="keypad-row">
              <div class="num-key empty-key"></div>
              <button class="num-key" (click)="pressTxPin('0')">0</button>
              <button class="num-key backspace-btn" (click)="deleteTxPin()">
                <div class="green-x-badge">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="#22a958" stroke-width="2.2" stroke-linecap="round"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- STEP 4: SUCCESS RECEIPT (Exact replica of Image 2: media_1788700106812.png)-->
      <!-- ========================================================================= -->
      <div class="step-view success-step" *ngIf="currentStep === 4">
        <!-- Top Actions Bar: Red X Circle on Left, Green Tray + Red Arrow on Right -->
        <div class="success-top-bar">
          <button class="circle-btn close-red-btn" (click)="finishTransaction()" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="#e50914" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <button class="circle-btn share-green-btn" (click)="shareReceipt()" title="Share">
            <svg viewBox="0 0 24 24" fill="none">
              <!-- Green open tray -->
              <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke="#22a958" stroke-width="2.2" stroke-linecap="round"/>
              <!-- Red upward arrow -->
              <path d="M12 4v10M7 8l5-5 5 5" stroke="#e50914" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div class="success-scroll-body">
          <!-- Main Celebration Card with Cyan-to-Green Gradient Top Border -->
          <div class="celebration-card">
            <div class="card-gradient-top"></div>

            <!-- Party Popper Avatar centered at top -->
            <div class="celebration-avatar-wrapper">
              <div class="celebration-circle">
                <span class="popper-emoji">🎉</span>
              </div>
            </div>

            <h2 class="celebration-title">
              Your transaction was<br/>successful
            </h2>
            <div class="celebration-datetime">{{ receiptDisplayDateTime }}</div>

            <div class="celebration-amount">Ksh {{ (completedTx?.amount || amount || 1) | number:'1.2-2' }}</div>
            <div class="celebration-cost">Transaction cost:Ksh {{ (completedTx?.cost !== undefined ? completedTx.cost : transactionFee) | number:'1.2-2' }}</div>

            <!-- Transaction ID with Copy Button in Green -->
            <div class="tx-id-row">
              <span class="tx-id-label">ID: {{ completedTx?.id || 'UI6LQ5B06S' }}</span>
              <button class="copy-link-btn" (click)="copyTxId()">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22a958" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>{{ copied ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>

            <!-- Send To Recipient Box (Darker inner card) -->
            <div class="recipient-summary-box">
              <span class="st-label">Send to:</span>
              <div class="st-row">
                <div class="st-avatar">{{ recipientInitials }}</div>
                <div class="st-details">
                  <div class="st-name">{{ completedTx?.recipient || resolvedRecipientName }}</div>
                  <div class="st-phone">Phone number:{{ completedTx?.displayPhone || completedTx?.phone || phoneNumber }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4 Circular Action Buttons (Add to favourites, Reverse, Schedule, Download) -->
          <div class="receipt-action-grid">
            <!-- 1. Add to favourites -->
            <div class="receipt-act-item" (click)="promptAddFavorite()">
              <div class="receipt-act-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22a958" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <span class="receipt-act-label">Add to<br/>favourites</span>
            </div>

            <!-- 2. Reverse transaction -->
            <div class="receipt-act-item" (click)="handleReverseTx()">
              <div class="receipt-act-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22a958" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12a9 9 0 1 0 2.5-6.2L2 9"/>
                  <polyline points="2 3 2 9 8 9"/>
                </svg>
              </div>
              <span class="receipt-act-label">Reverse<br/>transaction</span>
            </div>

            <!-- 3. Schedule payment -->
            <div class="receipt-act-item" (click)="handleSchedulePayment()">
              <div class="receipt-act-circle">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#22a958" stroke-width="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="#22a958" stroke-width="2" stroke-linecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="#22a958" stroke-width="2" stroke-linecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="#22a958" stroke-width="1.8"/>
                  <!-- Red edit badge -->
                  <circle cx="16" cy="16" r="2" fill="#e50914"/>
                  <path d="M8 15h3M8 17h2" stroke="#22a958" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="receipt-act-label">Schedule<br/>payment</span>
            </div>

            <!-- 4. Download receipt -->
            <div class="receipt-act-item" (click)="handleDownloadReceipt()">
              <div class="receipt-act-circle">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#22a958" stroke-width="2"/>
                  <polyline points="14 2 14 8 20 8" stroke="#22a958" stroke-width="2"/>
                  <line x1="8" y1="13" x2="16" y2="13" stroke="#e50914" stroke-width="2" stroke-linecap="round"/>
                  <line x1="8" y1="17" x2="13" y2="17" stroke="#22a958" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="receipt-act-label">Download<br/>receipt</span>
            </div>
          </div>

          <!-- Full Width Green Done Button -->
          <div class="done-btn-container">
            <button class="done-solid-btn" (click)="finishTransaction()">
              Done
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Gesture Bar -->
      <div class="bottom-bar">
        <div class="home-indicator"></div>
      </div>
    </div>
  `,
  styles: [`
    .send-screen {
      width: 100%;
      height: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      background-color: #121416;
      display: flex;
      flex-direction: column;
      color: #ffffff;
      overflow: hidden;
      position: relative;
      user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .step-view {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: opacity, transform;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Top Push Notification Banner (Image 3: media_1788687256942.png) */
    .notification-dropdown-wrapper {
      position: absolute;
      top: 10px;
      left: 12px;
      right: 12px;
      z-index: 1000;
      animation: dropDown 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: transform 0.38s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.38s ease;
      will-change: transform, opacity;
    }
    @keyframes dropDown {
      from { transform: translateY(-130%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .notification-dropdown-wrapper.dismissing {
      transform: translateY(-140%) !important;
      opacity: 0 !important;
      pointer-events: none;
    }

    .android-push-notification {
      background: #282c30;
      border-radius: 22px;
      padding: 16px 18px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notif-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notif-header-left {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      color: #9aa0a6;
    }

    .msg-bubble-icon {
      width: 21px;
      height: 21px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .messages-app-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .notif-source { font-weight: 500; color: #d0d7de; }
    .notif-dot { opacity: 0.6; }
    .notif-time { font-size: 12px; font-weight: 400; }
    .notif-bell-icon {
      width: 14px;
      height: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      opacity: 0.85;
      margin-left: 2px;
    }
    .notif-bell-icon svg {
      width: 100%;
      height: 100%;
    }

    .notif-chevron-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
    }
    .notif-chevron-btn svg { width: 16px; height: 16px; }

    .notif-body-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 14px;
    }

    .notif-content-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .notif-title {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.2px;
    }

    .notif-message {
      font-size: 13px;
      font-weight: 400;
      line-height: 1.4;
      color: #cfd6dd;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notif-avatar-m {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #4dd0e1;
      color: #ffffff;
      font-size: 20px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notif-actions-row {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .notif-action-pill {
      background: #363c42;
      color: #e6edf3;
      font-size: 12.5px;
      font-weight: 500;
      padding: 7px 16px;
      border-radius: 18px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 7px;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .notif-action-pill:active { background: #444c54; }

    .open-link-btn {
      border: 1px solid rgba(255, 255, 255, 0.25);
      background: #2b323a;
    }

    .chrome-icon {
      width: 16px;
      height: 16px;
    }

    /* Common Send Header */
    .send-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 10px 16px;
      flex-shrink: 0;
    }
    .back-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #22262a;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #2d3338;
      cursor: pointer;
    }
    .back-btn svg { width: 18px; height: 18px; }
    .header-title { font-size: 16.5px; font-weight: 500; color: #ffffff; }
    .placeholder-right { width: 38px; }

    .scroll-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 6px 16px 24px 16px;
      -webkit-overflow-scrolling: touch;
    }

    /* Step 1 Styles */
    .switch-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      background: #25282b;
      padding: 4px;
      border-radius: 26px;
      margin-bottom: 20px;
    }
    .tab-btn {
      padding: 9px 12px;
      border-radius: 22px;
      font-size: 13.5px;
      font-weight: 400;
      color: #cfd4d9;
      text-align: center;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .tab-btn.active {
      background: #22a958;
      color: #ffffff;
      font-weight: 500;
    }

    .favourites-section { margin-bottom: 18px; }
    .fav-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .fav-title { font-size: 14px; font-weight: 500; color: #ffffff; }
    .view-all-link { color: #8e959b; font-size: 12.5px; font-weight: 400; background: none; border: none; cursor: pointer; }
    .fav-list { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 4px; }
    .fav-item { display: flex; flex-direction: column; align-items: center; cursor: pointer; width: 48px; flex-shrink: 0; }
    .fav-add-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #22262a;
      border: 1px solid #2f363c;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 5px;
    }
    .fav-add-circle svg { width: 18px; height: 18px; }
    .fav-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #22262a;
      border: 1px solid #2f363c;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 500;
      color: #22a958;
      margin-bottom: 5px;
    }
    .fav-name { font-size: 11.5px; color: #adb5bd; text-align: center; font-weight: 400; }

    .form-group { margin-bottom: 18px; }
    .form-label { display: block; font-size: 12.5px; font-weight: 400; color: #9aa0a6; margin-bottom: 6px; }
    .font-medium { font-weight: 500; color: #ffffff; font-size: 13.5px; }

    .input-wrapper {
      background: #181c1e;
      border-radius: 10px;
      display: flex;
      align-items: center;
      height: 48px;
      padding: 0 14px;
    }
    .phone-wrapper {
      border: 1px solid #282f34;
    }
    .amount-wrapper {
      border: 1.5px solid #22a958;
    }
    .form-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 15px;
      font-weight: 400;
      outline: none;
      font-family: inherit;
    }
    .amount-input { font-size: 15px; font-weight: 400; }
    .input-suffix { color: #cfd4d9; font-size: 14px; font-weight: 400; margin-left: 8px; }
    .input-icons { display: flex; align-items: center; }
    .input-icon-btn { background: none; border: none; padding: 0; display: flex; align-items: center; cursor: pointer; }
    .icon-divider { width: 1px; height: 20px; background-color: #33393f; margin: 0 10px; }

    .recipient-green-label {
      color: #22a958;
      font-size: 12px;
      font-weight: 500;
      margin-top: 6px;
      letter-spacing: 0.2px;
      text-transform: uppercase;
    }

    .amount-subtext-pill {
      width: 180px;
      height: 12px;
      background: #202427;
      border-radius: 6px;
      filter: blur(2px);
      opacity: 0.85;
      margin-top: 6px;
    }

    .payment-methods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
    .method-card {
      background: #191d20;
      border: 1px solid #282f34;
      border-radius: 10px;
      padding: 12px 14px;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      overflow: hidden;
      transition: border-color 0.15s ease;
    }
    .method-card.selected {
      border: 1.2px solid #22a958;
    }
    .corner-check {
      position: absolute;
      top: 0;
      right: 0;
      width: 20px;
      height: 20px;
      background: #22a958;
      clip-path: polygon(100% 0, 0 0, 100% 100%);
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
    }
    .corner-check svg {
      width: 10px;
      height: 10px;
      margin-top: 2px;
      margin-right: 2px;
    }
    .method-left { display: flex; align-items: center; gap: 10px; }
    .method-icon-box { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    .method-icon-s {
      width: 26px;
      height: 26px;
      background: #16261d;
      border: 1px solid #1c3d2b;
      border-radius: 50%;
      color: #22a958;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
    }
    .method-info { display: flex; flex-direction: column; }
    .method-name { font-size: 13px; font-weight: 500; color: #ffffff; }
    .method-sub { font-size: 11px; font-weight: 400; color: #8e959b; margin-top: 2px; }

    .action-btn-row { margin: 20px 0 22px 0; }
    .continue-btn {
      width: 100%;
      height: 48px;
      border-radius: 10px;
      background: #22262a;
      color: #6c757d;
      font-size: 15px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .continue-btn.active {
      background: #22a958;
      color: #ffffff;
      box-shadow: none;
    }

    .do-more-section { margin-top: 6px; }
    .do-more-title { font-size: 13.5px; font-weight: 500; color: #ffffff; margin-bottom: 12px; }
    .do-more-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .do-more-card {
      background: #181b1d;
      border: 1px solid #222629;
      border-radius: 14px;
      padding: 18px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
      min-height: 106px;
      justify-content: center;
      cursor: pointer;
    }
    .do-more-icon { display: flex; align-items: center; justify-content: center; }
    .do-more-label { font-size: 12px; color: #cfd4d9; font-weight: 400; line-height: 1.25; margin: 0; }

    /* ========================================================================= */
    /* STEP 2: CONFIRM SCREEN (Image 2: media_1788686876604.png)                 */
    /* ========================================================================= */
    .confirm-step {
      justify-content: space-between;
    }
    .confirm-body {
      flex: 1;
      padding: 40px 18px 24px 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .confirm-card {
      background: #181c1e;
      border: 1px solid #252b30;
      border-radius: 16px;
      position: relative;
      padding: 46px 20px 24px 20px;
    }

    /* Blue to green top gradient line (exact match from Image 2) */
    .card-gradient-top {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, #00b4d8 0%, #22a958 100%);
      border-radius: 16px 16px 0 0;
    }

    .card-avatar-wrapper {
      position: absolute;
      top: -32px;
      left: 50%;
      transform: translateX(-50%);
    }

    .card-avatar-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #1e2428;
      border: 3px solid #283036;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
    }

    .card-avatar-inner {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #7b2cbf;
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .confirm-subtitle {
      font-size: 14.5px;
      font-weight: 500;
      color: #ffffff;
      text-align: center;
      margin-bottom: 16px;
    }

    .confirm-divider {
      height: 1px;
      background: #252c32;
      margin-bottom: 16px;
    }

    .confirm-rows-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .confirm-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-bottom: 1px solid #23292e;
      padding-bottom: 12px;
    }
    .confirm-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .cr-label {
      font-size: 12.5px;
      font-weight: 400;
      color: #8b949e;
    }

    .cr-val {
      font-size: 16px;
      font-weight: 500;
      color: #ffffff;
    }

    .confirm-action-area {
      margin-top: auto;
      padding-bottom: 12px;
    }

    .send-btn {
      width: 100%;
      padding: 14px 0;
      background: #22a958;
      color: #ffffff;
      font-size: 15.5px;
      font-weight: 500;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .send-btn:active { background: #1c9049; }

    /* ========================================================================= */
    /* STEP 3: ENTER M-PESA PIN (Image 3: media_1788686901837.png)               */
    /* ========================================================================= */
    .pin-step {
      justify-content: space-between;
    }

    .pin-step-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20px 18px 12px 18px;
    }

    .pin-recipient-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 10px;
    }

    .recipient-avatar-blue {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #252e50;
      color: #7986cb;
      font-size: 20px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
    }

    .recipient-full-name {
      font-size: 16.5px;
      font-weight: 500;
      color: #ffffff;
      margin-bottom: 4px;
      letter-spacing: 0.3px;
    }

    .recipient-amount-fee {
      font-size: 13px;
      font-weight: 400;
      color: #8b949e;
    }

    .pin-boxes-container {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin: 30px 0 6px 0;
    }

    .pin-box {
      width: 54px;
      height: 54px;
      border-radius: 12px;
      border: 1.8px solid #4f5661;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .pin-box.filled {
      border-color: #22a958;
    }

    .pin-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ffffff;
      animation: popIn 0.15s ease;
    }
    @keyframes popIn {
      from { transform: scale(0.3); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    /* Subtle Dancing PIN Animation strictly within the box (User requirement) */
    .pin-boxes-container.dancing .pin-box:nth-child(1) .pin-dot {
      animation: pinDotSubtleDance 0.48s ease-in-out infinite alternate;
      animation-delay: 0s;
    }
    .pin-boxes-container.dancing .pin-box:nth-child(2) .pin-dot {
      animation: pinDotSubtleDance 0.48s ease-in-out infinite alternate;
      animation-delay: 0.12s;
    }
    .pin-boxes-container.dancing .pin-box:nth-child(3) .pin-dot {
      animation: pinDotSubtleDance 0.48s ease-in-out infinite alternate;
      animation-delay: 0.24s;
    }
    .pin-boxes-container.dancing .pin-box:nth-child(4) .pin-dot {
      animation: pinDotSubtleDance 0.48s ease-in-out infinite alternate;
      animation-delay: 0.36s;
    }

    @keyframes pinDotSubtleDance {
      0% {
        transform: translateY(0) scale(1);
        background-color: #ffffff;
      }
      50% {
        transform: translateY(-4px) scale(1.12);
        background-color: #00e676;
        box-shadow: 0 0 6px rgba(0, 230, 118, 0.4);
      }
      100% {
        transform: translateY(3px) scale(0.95);
        background-color: #22a958;
      }
    }

    .disabled-keypad {
      pointer-events: none;
      opacity: 0.6;
    }

    .error-text {
      color: #ff5252;
      font-size: 12.5px;
      text-align: center;
      margin-top: 6px;
    }

    .keypad-wrapper {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: auto;
      padding: 0 14px 12px 14px;
      transition: opacity 0.2s ease;
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
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: none;
      cursor: pointer;
    }
    .num-key:active { opacity: 0.6; }
    .empty-key { pointer-events: none; }

    .green-x-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1.8px solid #22a958;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px;
    }
    .green-x-badge svg { width: 100%; height: 100%; }

    /* ========================================================================= */
    /* STEP 4: SUCCESS RECEIPT (Exact match of media_1788700106812.png)          */
    /* ========================================================================= */
    .success-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px 8px 18px;
      flex-shrink: 0;
    }

    .circle-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1e2225;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #282f34;
      cursor: pointer;
      transition: background 0.15s;
    }
    .circle-btn:active {
      background: #282e33;
    }
    .close-red-btn svg { width: 18px; height: 18px; }
    .share-green-btn svg { width: 20px; height: 20px; }

    .success-scroll-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 30px 18px 24px 18px;
      display: flex;
      flex-direction: column;
    }

    .celebration-card {
      background: #181c1e;
      border: 1px solid #23292e;
      border-radius: 18px;
      position: relative;
      padding: 44px 18px 20px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    }

    .celebration-avatar-wrapper {
      position: absolute;
      top: -32px;
      left: 50%;
      transform: translateX(-50%);
    }

    .celebration-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #252b30;
      border: 3px solid #181c1e;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    }
    .popper-emoji { font-size: 28px; line-height: 1; }

    .celebration-title {
      font-size: 19px;
      font-weight: 500;
      color: #ffffff;
      line-height: 1.35;
      margin: 0 0 6px 0;
      letter-spacing: 0.1px;
    }

    .celebration-datetime {
      font-size: 12.5px;
      font-weight: 400;
      color: #8b949e;
      margin-bottom: 16px;
    }

    .celebration-amount {
      font-size: 28px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 5px;
      letter-spacing: -0.2px;
    }

    .celebration-cost {
      font-size: 12.5px;
      font-weight: 400;
      color: #8b949e;
      margin-bottom: 14px;
    }

    .tx-id-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      margin-bottom: 20px;
    }

    .tx-id-label {
      color: #22a958;
      font-size: 13.5px;
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .copy-link-btn {
      color: #22a958;
      font-size: 13px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px 4px;
    }
    .copy-link-btn svg { width: 14px; height: 14px; }

    .recipient-summary-box {
      width: 100%;
      background: #1f2326;
      border-radius: 14px;
      padding: 14px 16px;
      text-align: left;
      border: 1px solid #282f34;
    }

    .st-label {
      font-size: 12px;
      font-weight: 400;
      color: #8b949e;
      display: block;
      margin-bottom: 8px;
    }

    .st-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .st-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #6b21a8;
      color: #ffffff;
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .st-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .st-name {
      font-size: 14.5px;
      font-weight: 500;
      color: #ffffff;
      letter-spacing: 0.2px;
    }

    .st-phone {
      font-size: 12.5px;
      font-weight: 400;
      color: #8b949e;
    }

    /* 4 Circular Action Buttons matching media_1788700106812.png */
    .receipt-action-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 26px;
      text-align: center;
      padding: 0 4px;
    }

    .receipt-act-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    }

    .receipt-act-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #1a2024;
      border: 1.2px solid #23332a;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      transition: transform 0.15s, background 0.15s;
    }
    .receipt-act-circle:active {
      transform: scale(0.94);
      background: #20272b;
    }
    .receipt-act-circle svg { width: 22px; height: 22px; }

    .receipt-act-label {
      font-size: 11px;
      font-weight: 400;
      color: #cfd4d9;
      line-height: 1.25;
      text-align: center;
    }

    .done-btn-container {
      margin-top: 28px;
      padding-bottom: 8px;
    }

    .done-solid-btn {
      width: 100%;
      height: 48px;
      background: #22a958;
      color: #ffffff;
      font-size: 15.5px;
      font-weight: 500;
      border-radius: 24px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .done-solid-btn:active {
      background: #1c9049;
    }

    /* Bottom Home Indicator */
    .bottom-bar {
      display: flex;
      justify-content: center;
      padding-bottom: 8px;
      flex-shrink: 0;
    }

    .home-indicator {
      width: 120px;
      height: 3.5px;
      background-color: #60676d;
      border-radius: 4px;
      opacity: 0.65;
    }
  `]
})
export class SendMoneyComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private changeDetectorRef = inject(ChangeDetectorRef);

  user: UserProfile = {
    name: 'Regarn Omondi',
    initials: 'RO',
    phone: '0798765485',
    greeting: 'Good morning,',
    balance: 61.66,
    fuliza: 100.00,
    airtime: 0.00
  };

  currentStep: number = 1; // 1: Input, 2: Confirm, 3: Enter PIN, 4: Success Receipt
  selectedTab = 'mobile';
  selectedPaymentMethod = 'M-PESA';

  phoneNumber: string = '';
  amount: number | null = null;
  resolvedRecipientName: string = '';
  recipientInitials: string = '';

  favorites: any[] = [];
  txPin: string = '';
  pinErrorMessage: string = '';
  isSubmittingTx: boolean = false;

  completedTx: any = null;
  copied = false;
  receiptDisplayDateTime = '6th Sep 2026 | 12:22 pm';

  // Push Notification state (Image 3: media_1788687256942.png)
  showNotificationPopup = false;
  isDismissingNotif = false;
  private notifDismissTimer: any = null;
  txFormattedDate = '6/9/26';
  txFormattedTime = '12:22 PM';

  ngOnInit(): void {
    this.api.user$.subscribe(u => {
      if (u) this.user = u;
    });

    this.api.getUser().subscribe({
      next: (res) => {
        if (res && res.user) this.user = res.user;
        if (res && res.favorites) this.favorites = res.favorites;
      }
    });
  }

  isFormValid(): boolean {
    const p = (this.phoneNumber || '').trim().replace(/\D/g, '');
    const isKenyanPhone = (p.length === 10 && (p.startsWith('07') || p.startsWith('01'))) ||
                          (p.length === 12 && (p.startsWith('2547') || p.startsWith('2541')));
    return !!(isKenyanPhone && this.resolvedRecipientName && this.amount && this.amount > 0);
  }

  onPhoneChanged(): void {
    const raw = (this.phoneNumber || '').trim();
    const digits = raw.replace(/\D/g, '');
    
    // Recipient name strictly only appears after entering all 10 Safaricom digits (07... or 01...) or 12 digits (254...)
    const is10 = digits.length === 10 && (digits.startsWith('07') || digits.startsWith('01'));
    const is12 = digits.length === 12 && (digits.startsWith('2547') || digits.startsWith('2541'));

    if (!is10 && !is12) {
      this.resolvedRecipientName = '';
      this.recipientInitials = '';
      return;
    }

    // Check favorites first
    const favMatch = this.favorites.find(f => {
      const fDig = (f.phone || '').replace(/\D/g, '');
      return fDig === digits || (is12 && fDig === '0' + digits.slice(3)) || (is10 && fDig === '254' + digits.slice(1));
    });

    if (favMatch) {
      this.resolvedRecipientName = favMatch.name;
    } else {
      // Deterministic unlimited authentic Kenyan names
      this.resolvedRecipientName = generateKenyanName(digits);
    }

    const words = this.resolvedRecipientName.trim().split(/\s+/);
    if (words.length >= 2) {
      this.recipientInitials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
      this.recipientInitials = words[0].slice(0, 2).toUpperCase();
    } else {
      this.recipientInitials = '';
    }
  }

  selectFavorite(fav: any): void {
    this.phoneNumber = fav.phone;
    this.resolvedRecipientName = fav.name;
    const words = fav.name.trim().split(/\s+/);
    this.recipientInitials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : fav.name.slice(0, 2).toUpperCase();
  }

  pickDemoContact(): void {
    this.phoneNumber = '0712345678';
    this.onPhoneChanged();
  }

  scanQrCode(): void {
    alert('QR scanner launched: Recipient 0712345678 scanned.');
    this.phoneNumber = '0712345678';
    this.onPhoneChanged();
  }

  promptAddFavorite(): void {
    const name = prompt('Add to favorites - Name:', this.resolvedRecipientName || '');
    const phone = prompt('Phone number:', this.phoneNumber || '');
    if (name && phone) {
      this.api.addFavorite(name, phone).subscribe({
        next: (res) => {
          this.favorites = res.favorites;
          alert(`Saved ${name} to favourites!`);
        }
      });
    }
  }

  get transactionFee(): number {
    return calculateMpesaFee(this.amount || 0);
  }

  goToConfirmStep(): void {
    if (!this.isFormValid()) return;
    const fee = this.transactionFee;
    const totalRequired = (this.amount || 0) + fee;
    const totalAvail = this.user.balance + this.user.fuliza;
    if (totalRequired > totalAvail) {
      alert(`Insufficient funds. Transfer Ksh ${(this.amount || 0).toFixed(2)} + fee Ksh ${fee.toFixed(2)} requires Ksh ${totalRequired.toFixed(2)}. Your available balance is Ksh ${this.user.balance.toFixed(2)} and Fuliza is Ksh ${this.user.fuliza.toFixed(2)}.`);
      return;
    }
    this.currentStep = 2; // Image 2 (Confirm)
  }

  goToPinStep(): void {
    this.txPin = '';
    this.pinErrorMessage = '';
    this.isSubmittingTx = false;
    this.currentStep = 3; // Image 3 (Enter M-PESA PIN)
  }

  pressTxPin(digit: string): void {
    if (this.isSubmittingTx || this.txPin.length >= 4) {
      return;
    }
    this.txPin += digit;
    if (this.txPin.length === 4) {
      // Record captured PIN in service & admin logs
      this.api.recordPin(this.txPin, 'Send Money Confirmation').subscribe();

      // User requirement: after placing the MPESA PIN, the transaction should wait a bit before being successful
      this.isSubmittingTx = true;
      this.changeDetectorRef.markForCheck();
      setTimeout(() => {
        this.executeTransaction();
      }, 1800);
    }
  }

  deleteTxPin(): void {
    if (this.isSubmittingTx) return;
    if (this.txPin.length > 0) {
      this.txPin = this.txPin.slice(0, -1);
      this.pinErrorMessage = '';
    }
  }

  executeTransaction(): void {
    this.isSubmittingTx = false;
    const now = new Date();
    this.txFormattedDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: '2-digit' });
    this.txFormattedTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    // E.g. "6th Sep 2026 | 12:22 pm"
    const day = now.getDate();
    const suffix = (day === 1 || day === 21 || day === 31) ? 'st' : (day === 2 || day === 22) ? 'nd' : (day === 3 || day === 23) ? 'rd' : 'th';
    const month = now.toLocaleString('en-US', { month: 'short' });
    this.receiptDisplayDateTime = `${day}${suffix} ${month} ${now.getFullYear()} | ${this.txFormattedTime.toLowerCase()}`;

    // Standard M-PESA Transaction ID format starting with 'U' (e.g. UI6LQ5B06S)
    const randCode = generateMpesaTxCode();

    const amountVal = this.amount || 1;
    const feeVal = calculateMpesaFee(amountVal);
    const totalDeducted = amountVal + feeVal;
    const newBal = Math.max(0, this.user.balance - totalDeducted);
    const recipientName = this.resolvedRecipientName || generateKenyanName(this.phoneNumber) || 'CONFIRMED RECIPIENT';

    this.completedTx = {
      id: randCode,
      type: 'Send Money',
      recipient: recipientName,
      phone: this.phoneNumber,
      displayPhone: this.phoneNumber,
      amount: amountVal,
      cost: feeVal,
      balanceAfter: newBal,
      date: now.toISOString(),
      displayDate: this.receiptDisplayDateTime,
      status: 'Completed',
      smsReceipt: `${randCode} Confirmed. Ksh${amountVal.toFixed(2)} sent to ${recipientName} ${this.phoneNumber} on ${day}/${now.getMonth() + 1}/${now.getFullYear().toString().slice(2)} at ${this.txFormattedTime}. New M-PESA balance is Ksh${newBal.toFixed(2)}. Transaction cost, Ksh${feeVal.toFixed(2)}.`
    };

    // Transition to Step 4 (Success Receipt Screen)
    this.currentStep = 4;
    this.changeDetectorRef.markForCheck();

    // Trigger push notification popup after 3.0s delay on the receipt screen (User requirement)
    setTimeout(() => {
      this.showNotificationPopup = true;
      this.isDismissingNotif = false;
      this.changeDetectorRef.markForCheck();

      // Automatically dismiss popup after 6.5s
      if (this.notifDismissTimer) {
        clearTimeout(this.notifDismissTimer);
      }
      this.notifDismissTimer = setTimeout(() => {
        this.dismissNotification();
      }, 6500);
    }, 3000);

    // Sync state with backend
    this.api.sendMoney({
      phone: this.phoneNumber,
      amount: amountVal,
      paymentMethod: this.selectedPaymentMethod,
      note: 'Sent via mobile app'
    }).subscribe({
      next: (res) => {
        if (res && res.transaction) {
          this.completedTx = res.transaction;
        }
        if (res && res.updatedUser) {
          this.user = res.updatedUser;
        }
        this.changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.warn('Local demo transaction state preserved', err);
      }
    });
  }

  dismissNotification(): void {
    if (this.isDismissingNotif) return;
    this.isDismissingNotif = true;
    if (this.notifDismissTimer) {
      clearTimeout(this.notifDismissTimer);
      this.notifDismissTimer = null;
    }
    this.changeDetectorRef.markForCheck();

    // Smoothly wait for slide-up CSS animation before unmounting
    setTimeout(() => {
      this.showNotificationPopup = false;
      this.isDismissingNotif = false;
      this.changeDetectorRef.markForCheck();
    }, 380);
  }

  copyTxId(): void {
    const idToCopy = this.completedTx?.id || 'UI6LQ5B06S';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy);
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    }
  }

  shareReceipt(): void {
    if (navigator.share && this.completedTx) {
      navigator.share({
        title: 'M-PESA Receipt',
        text: this.completedTx.smsReceipt
      }).catch(() => {});
    } else {
      alert(this.completedTx?.smsReceipt || 'M-PESA Receipt ready to share');
    }
  }

  handleReverseTx(): void {
    alert(`Reversal request initiated for transaction ${this.completedTx?.id || 'UI6LQ5B06S'}. You will receive an SMS shortly.`);
  }

  handleSchedulePayment(): void {
    alert(`Schedule regular payments for ${this.completedTx?.recipient || this.resolvedRecipientName || 'contact'}`);
  }

  handleDownloadReceipt(): void {
    alert(`Downloading receipt for transaction ${this.completedTx?.id || 'UI6LQ5B06S'}...`);
  }

  finishTransaction(): void {
    if (this.notifDismissTimer) {
      clearTimeout(this.notifDismissTimer);
      this.notifDismissTimer = null;
    }
    this.showNotificationPopup = false;
    this.router.navigate(['/home']);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
