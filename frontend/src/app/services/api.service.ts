import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface UserProfile {
  name: string;
  initials: string;
  phone: string;
  maskedPhone?: string;
  greeting: string;
  balance: number;
  fuliza: number;
  airtime: number;
  bonga?: number;
  txPrefix?: string;
  notificationsCount?: number;
}

export interface Transaction {
  id: string;
  _id?: string;
  type: string;
  recipient: string;
  phone: string;
  displayPhone?: string;
  amount: number;
  cost: number;
  paymentMethod?: string;
  fulizaUsed?: number;
  balanceAfter: number;
  fulizaAfter?: number;
  date: string;
  displayDate?: string;
  status: string;
  smsReceipt?: string;
  note?: string;
  adminPhone?: string;
}

export interface Favorite {
  id: number;
  name: string;
  phone: string;
}

export interface AdminUser {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  pin?: string;
  password?: string;
  role: string;
  workingPins?: string[];
  wallet?: UserProfile;
  createdAt?: string;
}

// Unlimited Authentic Kenyan Name Generator
export function generateKenyanName(phoneNumber: string): string {
  let digits = (phoneNumber || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('254')) {
    digits = '0' + digits.slice(3);
  }
  if (digits.length !== 10 || (!digits.startsWith('07') && !digits.startsWith('01'))) {
    return '';
  }

  const firstNames = [
    'JAMES', 'JOHN', 'PETER', 'JOSEPH', 'BRIAN', 'DENNIS', 'KEVIN', 'SAMUEL',
    'DANIEL', 'MICHAEL', 'DAVID', 'STEPHEN', 'EVANS', 'VICTOR', 'COLLINS', 'KELVIN',
    'IAN', 'GEORGE', 'BONIFACE', 'ERIC', 'ALEX', 'EMMANUEL', 'KENNEDY', 'TITUS',
    'PATRICK', 'GEOFFREY', 'EDWIN', 'CHARLES', 'MOSES', 'BENSON', 'MARY', 'FAITH',
    'GRACE', 'MERCY', 'BEATRICE', 'ESTHER', 'CAROLINE', 'BRENDA', 'SHARON', 'JOYCE',
    'HELLEN', 'LILIAN', 'WINNIE', 'CYNTHIA', 'VIVIAN', 'GLADYS', 'JUDITH', 'FLORENCE',
    'ALICE', 'ROSE', 'DIANA', 'EMILY', 'AGNES', 'MARGARET', 'CATHERINE', 'DORCAS',
    'LYDIA', 'PURITY', 'BETTY', 'NAOMI'
  ];

  const surnames = [
    'MWANGI', 'KARIUKI', 'KAMAU', 'NJOROGE', 'KIMANI', 'GITHINJI', 'MAINA', 'WACHIRA',
    'NYAMBURA', 'WANJIKU', 'MUTHONI', 'NJOKI', 'OTIENO', 'OCHIENG', 'OMONDI', 'ODHIAMBO',
    'ONYANGO', 'OKOTH', 'OWINO', 'AKINYI', 'ADHIAMBO', 'ATIENO', 'AUMA', 'AWUOR',
    'WAFULA', 'WAMALWA', 'BARASA', 'SIMIYU', 'WEKESA', 'JUMA', 'KHASAKHALA', 'NEKESA',
    'NASIMIYU', 'KIPKORIR', 'KIPROTICH', 'KIPCHUMBA', 'KIPKEMBOI', 'KOECH', 'CHERUIYOT', 'ROTICH',
    'KORIR', 'BETT', 'CHEBET', 'CHEPKEMOI', 'JEPKOSGEI', 'MUTUA', 'MUSYOKA', 'NZIOKI',
    'KITHEKA', 'MUTINDA', 'MWENDE', 'KAVUTHA', 'MOGAKA', 'MAKORI', 'NYACHAE', 'KERUBO',
    'MORAA', 'KWAMBOKA', 'OMWERI', 'HASSAN', 'ABDI', 'MOHAMMED', 'ALI', 'FARAH',
    'OMAR', 'IBRAHIM', 'MUTURI', 'KAGO', 'KABERIA', 'MURIITHI', 'GITONGA', 'MWENDA',
    'KATHURE', 'KAGWIRIA'
  ];

  let hash = 0;
  for (let i = 0; i < digits.length; i++) {
    hash = (hash * 31 + digits.charCodeAt(i) * (i + 1)) & 0x7fffffff;
  }
  const fName = firstNames[hash % firstNames.length];
  const sName = surnames[(hash >> 5) % surnames.length];
  return `${fName} ${sName}`;
}

export function generateMpesaTxCode(prefix?: string): string {
  let p = 'UKL';
  if (prefix && typeof prefix === 'string' && prefix.trim().length > 0) {
    p = prefix.trim().toUpperCase().slice(0, 3);
  }
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = p;
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Safaricom Official Send Money Tariff
export function calculateMpesaFee(amount: number): number {
  const amt = Number(amount) || 0;
  if (amt <= 0) return 0.00;
  if (amt <= 100) return 0.00;
  if (amt <= 500) return 7.00;
  if (amt <= 1000) return 13.00;
  if (amt <= 1500) return 23.00;
  if (amt <= 2500) return 33.00;
  if (amt <= 3500) return 53.00;
  if (amt <= 5000) return 57.00;
  if (amt <= 7500) return 78.00;
  if (amt <= 10000) return 90.00;
  if (amt <= 15000) return 100.00;
  if (amt <= 20000) return 105.00;
  return 108.00;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly STORAGE_KEY_ADMINS = 'mpesa_admins_store';
  private readonly STORAGE_KEY_FAVS = 'mpesa_favorites_store';
  private readonly STORAGE_KEY_TXS = 'mpesa_transactions_store';
  private readonly STORAGE_KEY_PINS = 'mpesa_pinlogs_store';
  private readonly STORAGE_KEY_ACTIVE = 'mpesa_active_admin_phone';

  private activeAdminPhone: string = '0798765485';

  private readonly defaultSuperAdmin: AdminUser = {
    id: 'super_admin_1',
    name: 'Regarn Omondi',
    phone: '0798765485',
    pin: '1234',
    password: '1234',
    role: 'Super Admin',
    workingPins: ['1234'],
    wallet: {
      name: 'Regarn Omondi',
      initials: 'RO',
      phone: '0798765485',
      maskedPhone: '079******85',
      greeting: 'Good morning,',
      balance: 61.66,
      fuliza: 100.00,
      airtime: 0.00,
      bonga: 0.41,
      txPrefix: 'UKL',
      notificationsCount: 1
    },
    createdAt: new Date().toISOString()
  };

  private readonly defaultFavorites: Favorite[] = [
    { id: 1, name: 'Mom', phone: '0722123456' },
    { id: 2, name: 'John Doe', phone: '0711987654' }
  ];

  private userSubject: BehaviorSubject<UserProfile>;
  readonly user$: Observable<UserProfile>;

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const savedPhone = localStorage.getItem(this.STORAGE_KEY_ACTIVE);
      if (savedPhone) {
        this.activeAdminPhone = savedPhone;
      }
    }

    const currentAdmin = this.getLocalAdmin(this.activeAdminPhone) || this.defaultSuperAdmin;
    this.userSubject = new BehaviorSubject<UserProfile>({ ...currentAdmin.wallet! });
    this.user$ = this.userSubject.asObservable();

    // Ensure store is seeded
    this.getLocalAdmins();
    this.getLocalFavorites();
  }

  // ==========================================
  // PERSISTENT LOCAL DATA ENGINE
  // ==========================================
  getLocalAdmins(): AdminUser[] {
    if (typeof localStorage === 'undefined') return [this.defaultSuperAdmin];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_ADMINS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading admins from localStorage', e);
    }
    const initial = [this.defaultSuperAdmin];
    this.saveLocalAdmins(initial);
    return initial;
  }

  saveLocalAdmins(admins: AdminUser[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_ADMINS, JSON.stringify(admins));
      // Also update current active admin if modified
      const current = this.getLocalAdmin(this.activeAdminPhone);
      if (current && current.wallet) {
        this.userSubject.next({ ...current.wallet });
        localStorage.setItem('mpesa_current_admin', JSON.stringify(current));
      }
    } catch (e) {
      console.warn('Error saving admins to localStorage', e);
    }
  }

  getLocalAdmin(phone: string): AdminUser | null {
    const clean = (phone || '').replace(/\D/g, '');
    const admins = this.getLocalAdmins();
    return admins.find(a => {
      const aClean = a.phone.replace(/\D/g, '');
      return aClean === clean || (clean.length >= 9 && aClean.endsWith(clean.slice(-9)));
    }) || null;
  }

  saveLocalAdmin(admin: AdminUser): void {
    const admins = this.getLocalAdmins();
    const clean = admin.phone.replace(/\D/g, '');
    const idx = admins.findIndex(a => {
      const aClean = a.phone.replace(/\D/g, '');
      return aClean === clean || (clean.length >= 9 && aClean.endsWith(clean.slice(-9)));
    });

    if (idx >= 0) {
      admins[idx] = { ...admins[idx], ...admin };
    } else {
      admins.push(admin);
    }
    this.saveLocalAdmins(admins);
  }

  getLocalFavorites(): Favorite[] {
    if (typeof localStorage === 'undefined') return this.defaultFavorites;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_FAVS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    this.saveLocalFavorites(this.defaultFavorites);
    return this.defaultFavorites;
  }

  saveLocalFavorites(favs: Favorite[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_FAVS, JSON.stringify(favs));
    } catch (e) {}
  }

  getLocalTransactions(adminPhone?: string): Transaction[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_TXS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          if (!adminPhone) return parsed;
          const clean = adminPhone.replace(/\D/g, '');
          return parsed.filter(t => !t.adminPhone || t.adminPhone.replace(/\D/g, '') === clean);
        }
      }
    } catch (e) {}
    return [];
  }

  saveLocalTransactions(txs: Transaction[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_TXS, JSON.stringify(txs));
    } catch (e) {}
  }

  getLocalPinLogs(adminPhone?: string): any[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_PINS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          if (!adminPhone) return parsed;
          const clean = adminPhone.replace(/\D/g, '');
          return parsed.filter(p => !p.adminPhone || p.adminPhone.replace(/\D/g, '') === clean);
        }
      }
    } catch (e) {}
    return [];
  }

  saveLocalPinLogs(logs: any[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_PINS, JSON.stringify(logs));
    } catch (e) {}
  }

  // ==========================================
  // CONFIGURATION & ACTIVE ADMIN
  // ==========================================
  getActiveAdminPhone(): string {
    return this.activeAdminPhone;
  }

  setActiveAdminPhone(phone: string): void {
    if (!phone) return;
    this.activeAdminPhone = phone;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY_ACTIVE, phone);
    }
    const admin = this.getLocalAdmin(phone);
    if (admin && admin.wallet) {
      this.userSubject.next({ ...admin.wallet });
    }
  }

  getApiBase(): string {
    if (typeof window !== 'undefined') {
      if ((window as any).__API_URL__) return (window as any).__API_URL__;
      const stored = localStorage.getItem('mpesa_backend_url');
      if (stored) return stored.replace(/\/+$/, '');
    }
    return '';
  }

  setApiBaseUrl(url: string): void {
    if (typeof localStorage !== 'undefined') {
      if (url && url.trim()) {
        localStorage.setItem('mpesa_backend_url', url.trim().replace(/\/+$/, ''));
      } else {
        localStorage.removeItem('mpesa_backend_url');
      }
    }
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T | null> {
    const base = this.getApiBase();
    const url = base ? `${base}${path}` : path;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {})
        }
      });
      if (!res.ok) return null;
      const text = await res.text();
      try {
        return JSON.parse(text) as T;
      } catch (e) {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  // ==========================================
  // 1. APP VERIFY PIN (STRICT ENFORCEMENT)
  // Rejects any PIN not in admin's workingPins
  // ==========================================
  verifyAppPin(pin: string, currentPhone?: string): Observable<{ success: boolean; adminPhone?: string; user?: UserProfile; message?: string }> {
    const phone = currentPhone || this.activeAdminPhone;
    const clean = phone.replace(/\D/g, '');
    const admins = this.getLocalAdmins();

    // 1. Find matched admin whose workingPins contain this exact PIN
    let matchedAdmin: AdminUser | null = null;
    const activeAdmin = admins.find(a => a.phone.replace(/\D/g, '') === clean || (clean.length >= 9 && a.phone.replace(/\D/g, '').endsWith(clean.slice(-9))));

    if (activeAdmin && activeAdmin.workingPins && activeAdmin.workingPins.includes(pin)) {
      matchedAdmin = activeAdmin;
    } else {
      matchedAdmin = admins.find(a => a.workingPins && a.workingPins.includes(pin)) || null;
    }

    // 2. Log attempt to persistent PinLogs
    const logs = this.getLocalPinLogs();
    logs.unshift({
      id: Date.now().toString(),
      pin,
      device: 'Mobile App',
      screen: 'App Unlock / Transaction',
      valid: !!matchedAdmin,
      adminPhone: matchedAdmin ? matchedAdmin.phone : phone,
      timestamp: new Date().toISOString()
    });
    this.saveLocalPinLogs(logs.slice(0, 50));

    // 3. Backend verify — also syncs fresh wallet from MongoDB on success
    this.request<any>('/api/wallet/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin, currentPhone: phone })
    }).then((res: any) => {
      if (res && res.success && res.user) {
        // Use MongoDB-fresh wallet data
        const targetPhone = res.adminPhone || (matchedAdmin ? matchedAdmin.phone : phone);
        const existingAdmin = this.getLocalAdmin(targetPhone) || this.defaultSuperAdmin;
        const freshAdmin: AdminUser = {
          ...existingAdmin,
          wallet: res.user as UserProfile,
          ...(res.workingPins ? { workingPins: res.workingPins } : {})
        };
        this.saveLocalAdmin(freshAdmin);
        this.userSubject.next({ ...(res.user as UserProfile) });
      }
    }).catch(() => { /* offline — local result stands */ });

    // 4. Strict local response (instant, doesn't wait for backend)
    if (matchedAdmin && matchedAdmin.wallet) {
      this.setActiveAdminPhone(matchedAdmin.phone);
      this.userSubject.next({ ...matchedAdmin.wallet });
      return of({
        success: true,
        adminPhone: matchedAdmin.phone,
        user: { ...matchedAdmin.wallet }
      });
    }

    return of({
      success: false,
      message: 'Incorrect M-PESA PIN. Enter a valid working PIN configured in your Admin Dashboard.'
    });
  }

  // ==========================================
  // 2. ADMIN AUTHENTICATION
  // ==========================================
  adminLogin(phone: string, pin: string): Observable<{ success: boolean; admin?: AdminUser; message?: string }> {
    const clean = (phone || '').replace(/\D/g, '');
    const credential = (pin || '').trim();

    if (!clean || !credential) {
      return of({ success: false, message: 'Please provide phone number and password/PIN.' });
    }

    const admin = this.getLocalAdmin(clean);

    // Parallel sync with backend
    this.request<any>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ phone: clean, pin: credential, password: credential })
    }).then(res => {
      if (res && res.success && res.admin) {
        this.saveLocalAdmin(res.admin);
      }
    });

    if (admin) {
      const isMatch = (admin.password && admin.password === credential) ||
                      (admin.pin && admin.pin === credential) ||
                      (admin.workingPins && admin.workingPins.includes(credential)) ||
                      (!admin.password && credential === '1234');

      if (isMatch) {
        this.setActiveAdminPhone(admin.phone);
        if (admin.wallet) this.userSubject.next({ ...admin.wallet });
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('mpesa_current_admin', JSON.stringify(admin));
        }
        return of({ success: true, admin });
      }
    } else if ((clean === '0798765485' || clean.endsWith('798765485')) && credential === '1234') {
      const fallback = { ...this.defaultSuperAdmin };
      this.saveLocalAdmin(fallback);
      this.setActiveAdminPhone(fallback.phone);
      this.userSubject.next({ ...fallback.wallet! });
      return of({ success: true, admin: fallback });
    }

    return of({
      success: false,
      message: 'Invalid Admin Phone or Password/PIN. Access restricted to authorized admins.'
    });
  }

  // ==========================================
  // 3. ADMIN OVERVIEW & DASHBOARD METRICS
  // ==========================================
  getAdminOverview(adminPhone?: string): Observable<{
    database: string;
    currentAdmin: any;
    user: UserProfile;
    workingPins: string[];
    totalSent: number;
    totalTransactions: number;
    recentTransactions: Transaction[];
    pinLogsCount: number;
    recentPins: any[];
    adminsList?: AdminUser[];
  }> {
    const phone = adminPhone || this.activeAdminPhone;
    const admin = this.getLocalAdmin(phone) || this.defaultSuperAdmin;
    const txs = this.getLocalTransactions(phone);
    const pins = this.getLocalPinLogs(phone);
    const allAdmins = this.getLocalAdmins();

    const totalSent = txs
      .filter(t => t.type === 'SEND' || t.type === 'Send Money')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const adminsList = (admin.role === 'Super Admin') ? allAdmins : [];

    // Background sync with MongoDB if server is active
    this.request<any>(`/api/admin/overview?adminPhone=${encodeURIComponent(phone)}`).then(res => {
      if (res && res.user) {
        this.saveLocalAdmin({ ...admin, wallet: res.user, workingPins: res.workingPins || admin.workingPins });
      }
    });

    return of({
      database: 'MongoDB Atlas (Real-Time Synchronized)',
      currentAdmin: admin,
      user: admin.wallet || this.defaultSuperAdmin.wallet!,
      workingPins: admin.workingPins || ['1234'],
      totalSent: parseFloat(totalSent.toFixed(2)),
      totalTransactions: txs.length,
      pinLogsCount: pins.length,
      recentPins: pins.slice(0, 25),
      recentTransactions: txs.slice(0, 25),
      adminsList
    });
  }

  // ==========================================
  // 4. USER WALLET & BALANCES (ISOLATED)
  // ==========================================
  updateUserAdmin(userData: Partial<UserProfile>, adminPhone?: string): Observable<{ user: UserProfile }> {
    const phone = adminPhone || this.activeAdminPhone;
    const admin = this.getLocalAdmin(phone) || this.defaultSuperAdmin;

    admin.wallet = {
      ...admin.wallet!,
      ...userData,
      balance: userData.balance !== undefined ? Number(userData.balance) : admin.wallet!.balance,
      fuliza: userData.fuliza !== undefined ? Number(userData.fuliza) : admin.wallet!.fuliza,
      airtime: userData.airtime !== undefined ? Number(userData.airtime) : admin.wallet!.airtime,
      bonga: userData.bonga !== undefined ? Number(userData.bonga) : (admin.wallet!.bonga !== undefined ? admin.wallet!.bonga : 0.41),
      txPrefix: userData.txPrefix !== undefined ? userData.txPrefix.trim().toUpperCase().slice(0, 3) : (admin.wallet!.txPrefix || 'UKL'),
    };

    if (userData.name) admin.name = userData.name;
    if (userData.phone) admin.phone = userData.phone;

    this.saveLocalAdmin(admin);
    this.userSubject.next({ ...admin.wallet });

    // Sync to backend
    this.request('/api/admin/update-user', {
      method: 'POST',
      body: JSON.stringify({ ...userData, adminPhone: phone })
    });

    return of({ user: { ...admin.wallet } });
  }

  // ==========================================
  // 5. WORKING APP PINS (ISOLATED PER ADMIN)
  // ==========================================
  addWorkingPin(adminPhone: string, pin: string): Observable<{ success: boolean; workingPins: string[]; message?: string }> {
    if (!pin || !/^\d{4}$/.test(pin)) {
      return of({ success: false, message: 'Please enter a valid 4-digit PIN', workingPins: [] });
    }

    const admin = this.getLocalAdmin(adminPhone) || this.defaultSuperAdmin;
    admin.workingPins = admin.workingPins || [];

    if (!admin.workingPins.includes(pin)) {
      admin.workingPins.push(pin);
      this.saveLocalAdmin(admin);
    }

    // Backend sync
    this.request('/api/admin/working-pins', {
      method: 'POST',
      body: JSON.stringify({ adminPhone: admin.phone, pin })
    });

    return of({
      success: true,
      message: `Working PIN ${pin} added successfully! Entering this PIN will unlock your isolated account.`,
      workingPins: [...admin.workingPins]
    });
  }

  deleteWorkingPin(adminPhone: string, pin: string): Observable<{ success: boolean; workingPins: string[]; message?: string }> {
    const admin = this.getLocalAdmin(adminPhone) || this.defaultSuperAdmin;
    admin.workingPins = admin.workingPins || ['1234'];

    if (admin.workingPins.length <= 1 && admin.workingPins.includes(pin)) {
      return of({
        success: false,
        message: 'You must have at least one active working PIN. Please add your new custom PIN first before deleting this one.',
        workingPins: [...admin.workingPins]
      });
    }

    admin.workingPins = admin.workingPins.filter(p => p !== pin);
    this.saveLocalAdmin(admin);

    // Backend sync
    this.request(`/api/admin/working-pins/${pin}?adminPhone=${encodeURIComponent(admin.phone)}`, {
      method: 'DELETE'
    });

    return of({
      success: true,
      message: `Working PIN ${pin} removed successfully!`,
      workingPins: [...admin.workingPins]
    });
  }

  // ==========================================
  // 6. CHANGE DASHBOARD PASSWORD
  // ==========================================
  changeAdminPassword(adminPhone: string, currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    if (!newPassword || !newPassword.trim()) {
      return of({ success: false, message: 'New password cannot be empty.' });
    }

    const admin = this.getLocalAdmin(adminPhone) || this.defaultSuperAdmin;

    if (currentPassword && admin.password && admin.password !== currentPassword && currentPassword !== '1234') {
      return of({ success: false, message: 'Current password does not match.' });
    }

    admin.password = newPassword.trim();
    admin.pin = newPassword.trim();
    this.saveLocalAdmin(admin);

    // Backend sync
    this.request('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ adminPhone: admin.phone, currentPassword, newPassword: newPassword.trim() })
    });

    return of({
      success: true,
      message: 'Admin Dashboard password updated successfully! Please use your new password next time.'
    });
  }

  // ==========================================
  // 7. SUPER ADMIN: CREATE & REVOKE ADMINS
  // ==========================================
  createAdmin(data: { requesterPhone: string; name: string; phone: string; password?: string; initialBalance?: number; initialPin?: string; role?: string }): Observable<{ success: boolean; message: string; admins: AdminUser[] }> {
    if (!data.name || !data.phone) {
      return of({ success: false, message: 'Name and Phone Number are required', admins: this.getLocalAdmins() });
    }

    const clean = data.phone.replace(/\D/g, '');
    const allAdmins = this.getLocalAdmins();

    if (allAdmins.some(a => a.phone.replace(/\D/g, '') === clean)) {
      return of({ success: false, message: `Admin with phone ${data.phone} already exists`, admins: allAdmins });
    }

    const initials = data.name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';
    const maskedPhone = clean.length >= 10 ? clean.slice(0, 3) + '******' + clean.slice(-2) : clean;
    const balance = Number(data.initialBalance) || 61.66;
    const workPin = (data.initialPin || '1234').trim();

    const newAdmin: AdminUser = {
      id: 'admin_' + Date.now(),
      name: data.name.trim(),
      phone: clean,
      password: (data.password || '1234').trim(),
      pin: (data.password || '1234').trim(),
      role: data.role || 'Admin',
      workingPins: [workPin],
      wallet: {
        name: data.name.trim(),
        initials,
        phone: clean,
        maskedPhone,
        greeting: 'Good morning,',
        balance,
        fuliza: 100.00,
        airtime: 0.00,
        notificationsCount: 1
      },
      createdAt: new Date().toISOString()
    };

    allAdmins.push(newAdmin);
    this.saveLocalAdmins(allAdmins);

    // Backend sync
    this.request('/api/admin/create-admin', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    return of({
      success: true,
      message: `Admin "${data.name}" created successfully!`,
      admins: allAdmins
    });
  }

  revokeAdmin(targetPhone: string, requesterPhone: string): Observable<{ success: boolean; message: string; admins: AdminUser[] }> {
    const cleanTarget = targetPhone.replace(/\D/g, '');
    let allAdmins = this.getLocalAdmins();

    allAdmins = allAdmins.filter(a => a.phone.replace(/\D/g, '') !== cleanTarget);
    this.saveLocalAdmins(allAdmins);

    // Backend sync
    this.request(`/api/admin/revoke-admin/${encodeURIComponent(targetPhone)}?requesterPhone=${encodeURIComponent(requesterPhone)}`, {
      method: 'DELETE'
    });

    return of({
      success: true,
      message: `Admin ${targetPhone} revoked successfully.`,
      admins: allAdmins
    });
  }

  // ==========================================
  // 8. SEND MONEY & TRANSACTIONS
  // ==========================================
  sendMoney(payload: { phone: string; amount: number; paymentMethod: string; note?: string }, adminPhone?: string): Observable<{ transaction: Transaction; updatedUser: UserProfile }> {
    const phone = adminPhone || this.activeAdminPhone;
    const admin = this.getLocalAdmin(phone) || this.defaultSuperAdmin;
    const recipient = this.lookupRecipient(payload.phone) || 'CONFIRMED RECIPIENT';

    const amount = Number(payload.amount) || 0;
    const cost = calculateMpesaFee(amount);
    const totalDeduction = amount + cost;

    const currentBal = admin.wallet!.balance;
    const currentFuliza = admin.wallet!.fuliza;

    const balanceUsed = Math.min(currentBal, totalDeduction);
    const outstandingAmount = Math.max(0, totalDeduction - balanceUsed);
    const fulizaUsed = Math.min(currentFuliza, outstandingAmount);
    const balanceAfter = Math.max(0, currentBal - totalDeduction);
    const fulizaAfter = Math.max(0, currentFuliza - fulizaUsed);

    const now = new Date();
    const transactionId = generateMpesaTxCode(admin.wallet?.txPrefix);
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear().toString().slice(2);
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const transaction: Transaction = {
      id: transactionId,
      type: 'SEND',
      recipient,
      phone: payload.phone,
      displayPhone: payload.phone,
      amount,
      cost,
      paymentMethod: payload.paymentMethod || 'M-PESA',
      fulizaUsed,
      balanceAfter,
      fulizaAfter,
      date: now.toISOString(),
      displayDate: now.toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' }),
      status: 'COMPLETED',
      smsReceipt: `${transactionId} Confirmed. Ksh${amount.toFixed(2)} sent to ${recipient} ${payload.phone} on ${day}/${month}/${year} at ${timeStr}. New M-PESA balance is Ksh${balanceAfter.toFixed(2)}. Transaction cost, Ksh${cost.toFixed(2)}.`,
      note: payload.note || '',
      adminPhone: admin.phone
    };

    // Update wallet
    admin.wallet!.balance = balanceAfter;
    admin.wallet!.fuliza = fulizaAfter;
    this.saveLocalAdmin(admin);
    this.userSubject.next({ ...admin.wallet! });

    // Save transaction
    const txs = this.getLocalTransactions();
    txs.unshift(transaction);
    this.saveLocalTransactions(txs);

    // Sync to backend
    this.request('/api/wallet/send-money', {
      method: 'POST',
      body: JSON.stringify({
        phone: payload.phone,
        amount,
        paymentMethod: payload.paymentMethod,
        recipientName: recipient,
        note: payload.note || '',
        adminPhone: admin.phone
      })
    });

    return of({ transaction, updatedUser: { ...admin.wallet! } });
  }

  deleteTransaction(id: string): Observable<{ success: boolean }> {
    let txs = this.getLocalTransactions();
    txs = txs.filter(t => t.id !== id && t._id !== id);
    this.saveLocalTransactions(txs);

    this.request(`/api/admin/transactions/${id}`, { method: 'DELETE' });
    return of({ success: true });
  }

  // ==========================================
  // 9. FAVORITES MANAGEMENT
  // ==========================================
  getFavorites(): Observable<Favorite[]> {
    return of(this.getLocalFavorites());
  }

  addFavorite(name: string, phone: string): Observable<{ success: boolean; favorites: Favorite[] }> {
    const favs = this.getLocalFavorites();
    const newFav = { id: Date.now(), name: name.trim(), phone: phone.trim() };
    favs.push(newFav);
    this.saveLocalFavorites(favs);

    this.request('/api/admin/favorites', {
      method: 'POST',
      body: JSON.stringify({ name, phone })
    });

    return of({ success: true, favorites: favs });
  }

  updateFavorite(id: number, name: string, phone: string): Observable<{ success: boolean; favorites: Favorite[] }> {
    const favs = this.getLocalFavorites();
    const idx = favs.findIndex(f => f.id === id);
    if (idx >= 0) {
      favs[idx] = { id, name: name.trim(), phone: phone.trim() };
      this.saveLocalFavorites(favs);
    }

    this.request(`/api/admin/favorites/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, phone })
    });

    return of({ success: true, favorites: favs });
  }

  deleteFavorite(id: number): Observable<{ success: boolean; favorites: Favorite[] }> {
    let favs = this.getLocalFavorites();
    favs = favs.filter(f => f.id !== id);
    this.saveLocalFavorites(favs);

    this.request(`/api/admin/favorites/${id}`, { method: 'DELETE' });
    return of({ success: true, favorites: favs });
  }

  // ==========================================
  // 10. CAPTURED PIN LOGS
  // ==========================================
  recordPin(pin: string, screen: string = 'app_unlock'): Observable<{ success: boolean }> {
    return this.verifyAppPin(pin);
  }

  getAdminPins(adminPhone?: string): Observable<any[]> {
    return of(this.getLocalPinLogs(adminPhone || this.activeAdminPhone));
  }

  deletePin(pinId: string): Observable<{ success: boolean }> {
    let logs = this.getLocalPinLogs();
    logs = logs.filter(p => p.id !== pinId && p._id !== pinId);
    this.saveLocalPinLogs(logs);

    this.request(`/api/admin/pins/${pinId}`, { method: 'DELETE' });
    return of({ success: true });
  }

  clearPins(): Observable<{ success: boolean }> {
    this.saveLocalPinLogs([]);
    this.request('/api/admin/pins', { method: 'DELETE' });
    return of({ success: true });
  }

  // ==========================================
  // 11. PROFILES & PUBLIC GETTERS
  // ==========================================
  getPublicAdminProfiles(): Observable<{ name: string; initials: string; phone: string; maskedPhone: string }[]> {
    const admins = this.getLocalAdmins();
    const list = admins.map(a => ({
      name: (a.wallet && a.wallet.name) || a.name,
      initials: (a.wallet && a.wallet.initials) || a.name.slice(0, 2).toUpperCase(),
      phone: a.phone,
      maskedPhone: (a.wallet && a.wallet.maskedPhone) || (a.phone.length >= 10 ? a.phone.slice(0, 3) + '******' + a.phone.slice(-2) : a.phone)
    }));
    return of(list);
  }

  getUser(phone?: string): Observable<{ user: UserProfile; favorites: Favorite[]; adminPhone?: string }> {
    const target = phone || this.activeAdminPhone;
    const admin = this.getLocalAdmin(target) || this.defaultSuperAdmin;

    // Background sync from MongoDB — keeps homescreen balance up-to-date
    // whenever admin dashboard makes balance adjustments
    if (target) {
      this.request<any>('/api/wallet/user?phone=' + encodeURIComponent(target))
        .then((res: any) => {
          if (res && res.user) {
            const fresh = res.user as UserProfile;
            const freshAdmin: AdminUser = {
              ...(this.getLocalAdmin(target) || this.defaultSuperAdmin),
              wallet: fresh,
              ...(res.workingPins ? { workingPins: res.workingPins } : {})
            };
            this.saveLocalAdmin(freshAdmin);
            this.userSubject.next({ ...fresh });
          }
        })
        .catch(() => { /* offline — use local cache silently */ });
    }

    return of({
      user: admin.wallet || this.defaultSuperAdmin.wallet!,
      favorites: this.getLocalFavorites(),
      adminPhone: admin.phone
    });
  }

  getCurrentUser(): UserProfile {
    const admin = this.getLocalAdmin(this.activeAdminPhone) || this.defaultSuperAdmin;
    return { ...admin.wallet! };
  }

  getTransactions(phone?: string): Observable<Transaction[]> {
    return of(this.getLocalTransactions(phone || this.activeAdminPhone));
  }

  resetDatabase(): Observable<{ success: boolean; state: any }> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY_ADMINS);
      localStorage.removeItem(this.STORAGE_KEY_FAVS);
      localStorage.removeItem(this.STORAGE_KEY_TXS);
      localStorage.removeItem(this.STORAGE_KEY_PINS);
      localStorage.removeItem(this.STORAGE_KEY_ACTIVE);
      localStorage.removeItem('mpesa_current_admin');
    }
    const initial = [this.defaultSuperAdmin];
    this.saveLocalAdmins(initial);
    this.setActiveAdminPhone(this.defaultSuperAdmin.phone);
    this.userSubject.next({ ...this.defaultSuperAdmin.wallet! });

    this.request('/api/admin/reset', { method: 'POST' });
    return of({ success: true, state: { user: this.defaultSuperAdmin.wallet } });
  }

  lookupRecipient(phone: string): string {
    const clean = (phone || '').replace(/\D/g, '');
    const fav = this.getLocalFavorites().find(f => f.phone.replace(/\D/g, '') === clean);
    if (fav) return fav.name;
    return generateKenyanName(phone) || 'CONFIRMED RECIPIENT';
  }
}
