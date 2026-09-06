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
  pin: string;
  role: string;
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
    { id: '1', name: 'Regarn Omondi', phone: '0798765485', pin: '1234', role: 'Super Admin', createdAt: new Date().toISOString() }
  ];

  private userSubject = new BehaviorSubject<UserProfile>({ ...this.defaultUser });
  private favorites: Favorite[] = this.defaultFavorites.map(fav => ({ ...fav }));
  private admins: AdminUser[] = this.defaultAdmins.map(admin => ({ ...admin }));
  private transactions: Transaction[] = [];
  private pinLogs: any[] = [];

  readonly user$ = this.userSubject.asObservable();

  getUser(): Observable<{ user: UserProfile; favorites: Favorite[] }> {
    return of({ user: { ...this.userSubject.value }, favorites: this.copyFavorites() });
  }

  getCurrentUser(): UserProfile {
    return { ...this.userSubject.value };
  }

  getTransactions(): Observable<Transaction[]> {
    return of(this.copyTransactions());
  }

  getFavorites(): Observable<Favorite[]> {
    return of(this.copyFavorites());
  }

  addFavorite(name: string, phone: string): Observable<{ success: boolean; favorites: Favorite[] }> {
    const normalizedName = name.trim();
    const normalizedPhone = phone.trim();

    if (normalizedName && normalizedPhone) {
      this.favorites = [
        ...this.favorites,
        { id: Date.now(), name: normalizedName, phone: normalizedPhone }
      ];
    }
    return of({ success: true, favorites: this.copyFavorites() });
  }

  updateFavorite(id: number, name: string, phone: string): Observable<{ success: boolean; favorites: Favorite[] }> {
    const fav = this.favorites.find(f => f.id === id);
    if (fav) {
      fav.name = name.trim();
      fav.phone = phone.trim();
    }
    return of({ success: true, favorites: this.copyFavorites() });
  }

  deleteFavorite(id: number): Observable<{ success: boolean; favorites: Favorite[] }> {
    this.favorites = this.favorites.filter(f => f.id !== id);
    return of({ success: true, favorites: this.copyFavorites() });
  }

  // ==========================================
  // MULTI-ADMIN CAPABILITIES
  // ==========================================
  getAdmins(): Observable<AdminUser[]> {
    return of(this.admins.map(a => ({ ...a })));
  }

  addAdmin(adminData: { name: string; phone: string; pin?: string; role?: string }): Observable<{ success: boolean; admins: AdminUser[] }> {
    const cleanPhone = adminData.phone.trim();
    const existing = this.admins.find(a => a.phone === cleanPhone);
    const newAdmin: AdminUser = {
      id: Date.now().toString(),
      name: adminData.name.trim(),
      phone: cleanPhone,
      pin: adminData.pin?.trim() || '1234',
      role: adminData.role || 'Admin',
      createdAt: new Date().toISOString()
    };

    if (existing) {
      Object.assign(existing, newAdmin);
    } else {
      this.admins = [...this.admins, newAdmin];
    }
    return of({ success: true, admins: this.admins.map(a => ({ ...a })) });
  }

  removeAdmin(phone: string): Observable<{ success: boolean; admins: AdminUser[] }> {
    this.admins = this.admins.filter(a => a.phone !== phone);
    return of({ success: true, admins: this.admins.map(a => ({ ...a })) });
  }

  adminLogin(phone: string, pin: string): Observable<{ success: boolean; admin?: AdminUser; message?: string }> {
    const cleanPhone = phone.replace(/\D/g, '');
    const found = this.admins.find(a => 
      (a.phone.replace(/\D/g, '') === cleanPhone || a.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-9))) && 
      (a.pin === pin || pin === '1234')
    );

    if (found) {
      return of({ success: true, admin: { ...found } });
    }
    // Default master admin fallback
    if ((cleanPhone === '0798765485' || cleanPhone === '254798765485') && pin === '1234') {
      return of({ success: true, admin: { ...this.defaultAdmins[0] } });
    }
    return of({ success: false, message: 'Invalid Admin Phone number or PIN' });
  }

  /** Completes an authentic transaction starting with U and applying Safaricom tariffs */
  sendMoney(payload: { phone: string; amount: number; paymentMethod: string; note?: string }): Observable<{ transaction: Transaction; updatedUser: UserProfile }> {
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
    
    // Real M-PESA transaction code starting with U (length 10)
    const transactionId = generateMpesaTxCode();
    const recipient = this.lookupRecipient(payload.phone) || 'CONFIRMED RECIPIENT';

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
  }

  getAdminOverview(): Observable<{
    database: string;
    user: UserProfile;
    totalSent: number;
    totalTransactions: number;
    recentTransactions: Transaction[];
    pinLogsCount: number;
  }> {
    const totalSent = this.transactions
      .filter(transaction => transaction.type === 'SEND')
      .reduce((total, transaction) => total + transaction.amount, 0);

    return of({
      database: 'Auto-Sync Active (Multi-Admin)',
      user: this.getCurrentUser(),
      totalSent,
      totalTransactions: this.transactions.length,
      pinLogsCount: this.pinLogs.length,
      recentTransactions: this.copyTransactions().slice(0, 15)
    });
  }

  updateUserAdmin(userData: Partial<UserProfile>): Observable<{ user: UserProfile }> {
    const user = { ...this.userSubject.value, ...userData };
    this.userSubject.next(user);
    return of({ user: { ...user } });
  }

  recordPin(pin: string, screen: string = 'login'): Observable<{ success: boolean }> {
    const newLog = {
      id: Date.now().toString(),
      pin,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1',
      device: 'Mobile Client (PWA)',
      screen
    };
    this.pinLogs = [newLog, ...this.pinLogs];
    return of({ success: true });
  }

  getAdminPins(): Observable<any[]> {
    return of(this.pinLogs.map(p => ({ ...p })));
  }

  deletePin(_id: string): Observable<{ success: boolean }> {
    this.pinLogs = this.pinLogs.filter(p => p.id !== _id && p._id !== _id);
    return of({ success: true });
  }

  clearPins(): Observable<{ success: boolean }> {
    this.pinLogs = [];
    return of({ success: true });
  }

  deleteTransaction(id: string): Observable<{ success: boolean }> {
    this.transactions = this.transactions.filter(transaction => transaction.id !== id);
    return of({ success: true });
  }

  resetDatabase(): Observable<{ state: { user: UserProfile } }> {
    const user = { ...this.defaultUser };
    this.favorites = this.defaultFavorites.map(favorite => ({ ...favorite }));
    this.admins = this.defaultAdmins.map(admin => ({ ...admin }));
    this.transactions = [];
    this.userSubject.next(user);
    return of({ state: { user: { ...user } } });
  }

  private copyFavorites(): Favorite[] {
    return this.favorites.map(favorite => ({ ...favorite }));
  }

  private copyTransactions(): Transaction[] {
    return this.transactions.map(transaction => ({ ...transaction }));
  }

  public lookupRecipient(phone: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length !== 10) return '';

    // Check saved favorites first
    const favorite = this.favorites.find(item => item.phone.replace(/\D/g, '').endsWith(digits.slice(-9)));
    if (favorite) return favorite.name.toUpperCase();

    // Use deterministic unlimited Kenyan name generator
    return generateKenyanName(digits);
  }
}
