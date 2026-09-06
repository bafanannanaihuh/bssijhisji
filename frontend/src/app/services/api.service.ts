import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface UserProfile {
  name: string;
  initials: string;
  phone: string;
  maskedPhone?: string;
  greeting: string;
  balance: number;
  fuliza: number;
  airtime: number;
  notificationsCount?: number;
}

export interface Transaction {
  id: string;
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

export function generateMpesaTxCode(): string {
  const secondChars = 'IJKLMNOPQRSTUVWXYZABCDEFGH';
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'U';
  code += secondChars.charAt(Math.floor(Math.random() * secondChars.length));
  for (let i = 0; i < 8; i++) {
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
  // Configurable base URL for Vercel deployment
  private readonly API_BASE = (typeof window !== 'undefined' && (window as any).__API_URL__) || '';

  private activeAdminPhone: string = typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('mpesa_active_admin_phone') || '0798765485') 
    : '0798765485';

  private readonly defaultUser: UserProfile = {
    name: 'Regarn Omondi',
    initials: 'RO',
    phone: '0798765485',
    maskedPhone: '079******85',
    greeting: 'Good morning,',
    balance: 61.66,
    fuliza: 100.00,
    airtime: 0.00,
    notificationsCount: 1
  };

  private readonly defaultFavorites: Favorite[] = [
    { id: 1, name: 'Mom', phone: '0722123456' },
    { id: 2, name: 'John Doe', phone: '0711987654' }
  ];

  private readonly defaultAdmins: AdminUser[] = [
    { 
      id: '1', 
      name: 'Regarn Omondi', 
      phone: '0798765485', 
      pin: '1234', 
      password: '1234',
      role: 'Super Admin', 
      workingPins: ['1234'],
      createdAt: new Date().toISOString() 
    }
  ];

  private userSubject = new BehaviorSubject<UserProfile>({ ...this.defaultUser });
  private favorites: Favorite[] = this.defaultFavorites.map(fav => ({ ...fav }));
  private admins: AdminUser[] = this.defaultAdmins.map(admin => ({ ...admin }));
  private transactions: Transaction[] = [];
  private pinLogs: any[] = [];

  readonly user$ = this.userSubject.asObservable();

  getActiveAdminPhone(): string {
    return this.activeAdminPhone;
  }

  setActiveAdminPhone(phone: string): void {
    if (!phone) return;
    this.activeAdminPhone = phone;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mpesa_active_admin_phone', phone);
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

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const base = this.getApiBase();
    const url = base ? `${base}${path}` : path;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `HTTP error ${res.status}`);
    }
    return res.json();
  }

  // ==========================================
  // APP VERIFY PIN (NO LOGIN SCREEN)
  // Matches working PIN created on admin dashboard
  // ==========================================
  verifyAppPin(pin: string, currentPhone?: string): Observable<{ success: boolean; adminPhone?: string; user?: UserProfile; message?: string }> {
    const phone = currentPhone || this.activeAdminPhone;
    return from(this.request<{ success: boolean; adminPhone?: string; user?: UserProfile; message?: string }>('/api/wallet/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin, currentPhone: phone })
    })).pipe(
      map(res => {
        if (res && res.success && res.adminPhone) {
          this.setActiveAdminPhone(res.adminPhone);
          if (res.user) this.userSubject.next(res.user);
        }
        return res;
      }),
      catchError(err => {
        const storedAdmin = typeof localStorage !== 'undefined' ? localStorage.getItem('mpesa_current_admin') : null;
        let validPins: string[] = [];
        if (storedAdmin) {
          try {
            const parsed = JSON.parse(storedAdmin);
            if (parsed.workingPins && Array.isArray(parsed.workingPins)) {
              validPins = parsed.workingPins;
            }
          } catch(e) {}
        }
        if (validPins.length === 0) {
          validPins = ['1234'];
        }
        if (validPins.includes(pin)) {
          return of({ success: true, adminPhone: this.activeAdminPhone, user: this.userSubject.value });
        }
        return of({ success: false, message: err.message || 'Incorrect M-PESA PIN' });
      })
    );
  }

  getPublicAdminProfiles(): Observable<{ name: string; initials: string; phone: string; maskedPhone: string }[]> {
    return from(this.request<{ name: string; initials: string; phone: string; maskedPhone: string }[]>('/api/wallet/admins-list')).pipe(
      catchError(() => of([
        { name: 'Regarn Omondi', initials: 'RO', phone: '0798765485', maskedPhone: '079******85' }
      ]))
    );
  }

  getUser(phone?: string): Observable<{ user: UserProfile; favorites: Favorite[]; adminPhone?: string }> {
    const targetPhone = phone || this.activeAdminPhone;
    return from(this.request<{ user: UserProfile; favorites: Favorite[]; adminPhone?: string }>(`/api/wallet/user?phone=${encodeURIComponent(targetPhone)}`)).pipe(
      map(res => {
        if (res && res.user) {
          this.userSubject.next(res.user);
          if (res.favorites) this.favorites = res.favorites;
          if (res.adminPhone) this.setActiveAdminPhone(res.adminPhone);
        }
        return res;
      }),
      catchError(() => of({ user: { ...this.userSubject.value }, favorites: this.copyFavorites(), adminPhone: this.activeAdminPhone }))
    );
  }

  getCurrentUser(): UserProfile {
    return { ...this.userSubject.value };
  }

  getTransactions(phone?: string): Observable<Transaction[]> {
    const targetPhone = phone || this.activeAdminPhone;
    return from(this.request<Transaction[]>(`/api/wallet/transactions?phone=${encodeURIComponent(targetPhone)}`)).pipe(
      map(txs => {
        if (Array.isArray(txs)) {
          this.transactions = txs;
        }
        return this.transactions;
      }),
      catchError(() => of(this.copyTransactions()))
    );
  }

  getFavorites(): Observable<Favorite[]> {
    return from(this.request<Favorite[]>('/api/admin/favorites')).pipe(
      map(favs => {
        if (Array.isArray(favs)) {
          this.favorites = favs;
        }
        return this.favorites;
      }),
      catchError(() => of(this.copyFavorites()))
    );
  }

  addFavorite(name: string, phone: string): Observable<{ success: boolean; favorites: Favorite[] }> {
    return from(this.request<{ success: boolean; favorites: Favorite[] }>('/api/admin/favorites', {
      method: 'POST',
      body: JSON.stringify({ name, phone })
    })).pipe(
      map(res => {
        if (res && res.favorites) this.favorites = res.favorites;
        return res;
      }),
      catchError(() => {
        this.favorites = [...this.favorites, { id: Date.now(), name: name.trim(), phone: phone.trim() }];
        return of({ success: true, favorites: this.copyFavorites() });
      })
    );
  }

  updateFavorite(id: number, name: string, phone: string): Observable<{ success: boolean; favorites: Favorite[] }> {
    return from(this.request<{ success: boolean; favorites: Favorite[] }>(`/api/admin/favorites/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, phone })
    })).pipe(
      map(res => {
        if (res && res.favorites) this.favorites = res.favorites;
        return res;
      }),
      catchError(() => {
        const fav = this.favorites.find(f => f.id === id);
        if (fav) { fav.name = name.trim(); fav.phone = phone.trim(); }
        return of({ success: true, favorites: this.copyFavorites() });
      })
    );
  }

  deleteFavorite(id: number): Observable<{ success: boolean; favorites: Favorite[] }> {
    return from(this.request<{ success: boolean; favorites: Favorite[] }>(`/api/admin/favorites/${id}`, {
      method: 'DELETE'
    })).pipe(
      map(res => {
        if (res && res.favorites) this.favorites = res.favorites;
        return res;
      }),
      catchError(() => {
        this.favorites = this.favorites.filter(f => f.id !== id);
        return of({ success: true, favorites: this.copyFavorites() });
      })
    );
  }

  adminLogin(phone: string, pin: string): Observable<{ success: boolean; admin?: AdminUser; message?: string }> {
    return from(this.request<{ success: boolean; admin?: AdminUser; message?: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ phone, pin, password: pin })
    })).pipe(
      map(res => {
        if (res && res.success && res.admin) {
          this.setActiveAdminPhone(res.admin.phone);
          if (res.admin.wallet) this.userSubject.next(res.admin.wallet);
        }
        return res;
      }),
      catchError(err => {
        const clean = (phone || '').replace(/\D/g, '');
        if ((clean === '0798765485' || clean.endsWith('798765485')) && (pin === '1234')) {
          const fallbackAdmin: AdminUser = {
            id: '1',
            name: 'Regarn Omondi',
            phone: '0798765485',
            role: 'Super Admin',
            workingPins: ['1234'],
            wallet: { ...this.defaultUser }
          };
          this.setActiveAdminPhone(fallbackAdmin.phone);
          this.userSubject.next(fallbackAdmin.wallet!);
          return of({ success: true, admin: fallbackAdmin });
        }
        return of({ success: false, message: err.message || 'Invalid Admin credentials' });
      })
    );
  }

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
    return from(this.request<any>(`/api/admin/overview?adminPhone=${encodeURIComponent(phone)}`)).pipe(
      map(res => {
        if (res && res.user) {
          this.userSubject.next(res.user);
        }
        return res;
      }),
      catchError(() => {
        const totalSent = this.transactions
          .filter(transaction => transaction.type === 'SEND')
          .reduce((total, transaction) => total + transaction.amount, 0);

        return of({
          database: 'Auto-Sync Active (Multi-Admin)',
          currentAdmin: { name: 'Admin', phone, role: 'Admin', workingPins: ['1234'] },
          user: this.getCurrentUser(),
          workingPins: ['1234'],
          totalSent,
          totalTransactions: this.transactions.length,
          pinLogsCount: this.pinLogs.length,
          recentPins: [],
          recentTransactions: this.copyTransactions().slice(0, 15),
          adminsList: []
        });
      })
    );
  }

  // Update isolated admin wallet
  updateUserAdmin(userData: Partial<UserProfile>, adminPhone?: string): Observable<{ user: UserProfile }> {
    const phone = adminPhone || this.activeAdminPhone;
    return from(this.request<{ success: boolean; user: UserProfile }>('/api/admin/update-user', {
      method: 'POST',
      body: JSON.stringify({ ...userData, adminPhone: phone })
    })).pipe(
      map(res => {
        if (res && res.user) {
          this.userSubject.next(res.user);
          return { user: res.user };
        }
        const fallback = { ...this.userSubject.value, ...userData };
        this.userSubject.next(fallback);
        return { user: fallback };
      }),
      catchError(() => {
        const fallback = { ...this.userSubject.value, ...userData };
        this.userSubject.next(fallback);
        return of({ user: fallback });
      })
    );
  }

  // Working App PINs
  addWorkingPin(adminPhone: string, pin: string): Observable<{ success: boolean; workingPins: string[]; message?: string }> {
    return from(this.request<any>('/api/admin/working-pins', {
      method: 'POST',
      body: JSON.stringify({ adminPhone, pin })
    })).pipe(
      map(res => {
        if (res && res.success && res.workingPins && typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem('mpesa_current_admin');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              parsed.workingPins = res.workingPins;
              localStorage.setItem('mpesa_current_admin', JSON.stringify(parsed));
            } catch(e) {}
          }
        }
        return res;
      }),
      catchError(err => of({ success: false, message: err.message || 'Failed to add working PIN', workingPins: [] }))
    );
  }

  deleteWorkingPin(adminPhone: string, pin: string): Observable<{ success: boolean; workingPins: string[]; message?: string }> {
    return from(this.request<any>(`/api/admin/working-pins/${pin}?adminPhone=${encodeURIComponent(adminPhone)}`, {
      method: 'DELETE'
    })).pipe(
      map(res => {
        if (res && res.success && res.workingPins && typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem('mpesa_current_admin');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              parsed.workingPins = res.workingPins;
              localStorage.setItem('mpesa_current_admin', JSON.stringify(parsed));
            } catch(e) {}
          }
        }
        return res;
      }),
      catchError(err => of({ success: false, message: err.message, workingPins: [] }))
    );
  }

  // Change Admin Dashboard Password
  changeAdminPassword(adminPhone: string, currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return from(this.request<any>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ adminPhone, currentPassword, newPassword })
    })).pipe(
      catchError(err => of({ success: false, message: err.message || 'Failed to update password' }))
    );
  }

  // Super Admin: Create & Revoke Admins
  createAdmin(data: { requesterPhone: string; name: string; phone: string; password?: string; initialBalance?: number; initialPin?: string; role?: string }): Observable<{ success: boolean; message: string; admins: AdminUser[] }> {
    return from(this.request<any>('/api/admin/create-admin', {
      method: 'POST',
      body: JSON.stringify(data)
    })).pipe(
      catchError(err => of({ success: false, message: err.message || 'Failed to create admin', admins: [] }))
    );
  }

  revokeAdmin(targetPhone: string, requesterPhone: string): Observable<{ success: boolean; message: string; admins: AdminUser[] }> {
    return from(this.request<any>(`/api/admin/revoke-admin/${encodeURIComponent(targetPhone)}?requesterPhone=${encodeURIComponent(requesterPhone)}`, {
      method: 'DELETE'
    })).pipe(
      catchError(err => of({ success: false, message: err.message || 'Failed to revoke admin', admins: [] }))
    );
  }

  sendMoney(payload: { phone: string; amount: number; paymentMethod: string; note?: string }, adminPhone?: string): Observable<{ transaction: Transaction; updatedUser: UserProfile }> {
    const recipient = this.lookupRecipient(payload.phone) || 'CONFIRMED RECIPIENT';
    const cleanAdminPhone = adminPhone || this.activeAdminPhone;

    return from(this.request<any>('/api/wallet/send-money', {
      method: 'POST',
      body: JSON.stringify({
        phone: payload.phone,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        recipientName: recipient,
        note: payload.note || '',
        adminPhone: cleanAdminPhone
      })
    })).pipe(
      map(res => {
        if (res && res.user) {
          this.userSubject.next(res.user);
        }
        if (res && res.transaction) {
          this.transactions = [res.transaction, ...this.transactions];
        }
        return {
          transaction: res.transaction,
          updatedUser: res.user || this.userSubject.value
        };
      }),
      catchError(err => {
        console.warn('Backend sendMoney call failed, using fallback:', err);
        const amount = Number(payload.amount) || 0;
        const cost = calculateMpesaFee(amount);
        const totalDeduction = amount + cost;
        const currentUser = this.userSubject.value;

        const balanceUsed = Math.min(currentUser.balance, totalDeduction);
        const outstandingAmount = Math.max(0, totalDeduction - balanceUsed);
        const fulizaUsed = Math.min(currentUser.fuliza, outstandingAmount);
        const balanceAfter = Math.max(0, currentUser.balance - totalDeduction);
        const fulizaAfter = Math.max(0, currentUser.fuliza - fulizaUsed);
        const now = new Date();
        const transactionId = generateMpesaTxCode();
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
          paymentMethod: payload.paymentMethod,
          fulizaUsed,
          balanceAfter,
          fulizaAfter,
          date: now.toISOString(),
          displayDate: now.toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' }),
          status: 'COMPLETED',
          smsReceipt: `${transactionId} Confirmed. Ksh${amount.toFixed(2)} sent to ${recipient} ${payload.phone} on ${day}/${month}/${year} at ${timeStr}. New M-PESA balance is Ksh${balanceAfter.toFixed(2)}. Transaction cost, Ksh${cost.toFixed(2)}.`,
          note: payload.note || ''
        };

        const updatedUser: UserProfile = { ...currentUser, balance: balanceAfter, fuliza: fulizaAfter };
        this.transactions = [transaction, ...this.transactions];
        this.userSubject.next(updatedUser);

        return of({ transaction: { ...transaction }, updatedUser: { ...updatedUser } });
      })
    );
  }

  deleteTransaction(id: string): Observable<{ success: boolean }> {
    return from(this.request<{ success: boolean }>(`/api/admin/transactions/${id}`, {
      method: 'DELETE'
    })).pipe(
      map(() => {
        this.transactions = this.transactions.filter(t => t.id !== id);
        return { success: true };
      }),
      catchError(() => {
        this.transactions = this.transactions.filter(t => t.id !== id);
        return of({ success: true });
      })
    );
  }

  recordPin(pin: string, screen: string = 'app_unlock'): Observable<{ success: boolean }> {
    return from(this.request<any>('/api/wallet/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin, currentPhone: this.activeAdminPhone })
    })).pipe(
      map(res => ({ success: !!(res && res.success) })),
      catchError(() => of({ success: true }))
    );
  }

  getAdminPins(adminPhone?: string): Observable<any[]> {
    const phone = adminPhone || this.activeAdminPhone;
    return from(this.request<any[]>(`/api/admin/pins?adminPhone=${encodeURIComponent(phone)}`)).pipe(
      catchError(() => of(this.pinLogs.map(p => ({ ...p }))))
    );
  }

  deletePin(pinId: string): Observable<{ success: boolean }> {
    return from(this.request<{ success: boolean }>(`/api/admin/pins/${pinId}`, {
      method: 'DELETE'
    })).pipe(
      catchError(() => of({ success: true }))
    );
  }

  clearPins(): Observable<{ success: boolean }> {
    return from(this.request<{ success: boolean }>('/api/admin/pins', {
      method: 'DELETE'
    })).pipe(
      catchError(() => of({ success: true }))
    );
  }

  resetDatabase(): Observable<{ success: boolean; state: any }> {
    return from(this.request<{ success: boolean; state: any }>('/api/admin/reset', {
      method: 'POST'
    })).pipe(
      map(res => {
        this.userSubject.next({ ...this.defaultUser });
        this.favorites = this.copyFavorites();
        return res;
      }),
      catchError(() => {
        this.userSubject.next({ ...this.defaultUser });
        this.favorites = this.copyFavorites();
        this.transactions = [];
        this.pinLogs = [];
        return of({ success: true, state: { user: this.defaultUser } });
      })
    );
  }

  lookupRecipient(phone: string): string {
    const clean = (phone || '').replace(/\D/g, '');
    const fav = this.favorites.find(f => f.phone.replace(/\D/g, '') === clean);
    if (fav) return fav.name;
    return generateKenyanName(phone) || 'CONFIRMED RECIPIENT';
  }

  private copyFavorites(): Favorite[] {
    return this.favorites.map(favorite => ({ ...favorite }));
  }

  private copyTransactions(): Transaction[] {
    return this.transactions.map(transaction => ({ ...transaction }));
  }
}
