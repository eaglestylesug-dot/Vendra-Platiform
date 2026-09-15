import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  UserProfile,
  Product,
  ProductPurchase,
  Deposit,
  Withdrawal,
  Transaction,
  ReferralRelationship,
  ReferralReward,
  NotificationItem,
  SupportTicket,
  AuditLog,
  PlatformSettings,
  UserFinancialSummary
} from '../types/index.ts';

// In-process persistent storage path with Vercel serverless /tmp support
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vendra_db.json');
const BUNDLED_DB_FILE = path.join(process.cwd(), 'data', 'vendra_db.json');

interface DatabaseStore {
  users: User[];
  profiles: UserProfile[];
  products: Product[];
  product_purchases: ProductPurchase[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  transactions: Transaction[];
  referral_relationships: ReferralRelationship[];
  referral_rewards: ReferralReward[];
  notifications: NotificationItem[];
  support_tickets: SupportTicket[];
  admin_users: { id: string; user_id: string; role: string; permissions: string[]; created_at: string }[];
  audit_logs: AuditLog[];
  platform_settings: Record<string, string>;
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-vendra-mini-01',
    vip_level: 'VIP1',
    name: 'VENDRA MINI 01',
    category: 'VENDRA Mini Series',
    price: 10000,
    daily_income: 3000,
    total_revenue: 540000,
    duration_days: 180,
    return_rate: 0.30, // 30% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 10,
    image_url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80',
    description: 'Ultra-light compact surveillance and commercial imaging asset fleet. Generates automated daily yield distributed every 24 hours.',
    eligibility_tier: 'VIP1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-vendra-mini-02',
    vip_level: 'VIP2',
    name: 'VENDRA MINI 02',
    category: 'VENDRA Mini Series',
    price: 50000,
    daily_income: 15000,
    total_revenue: 2700000,
    duration_days: 180,
    return_rate: 0.30, // 30% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 8,
    image_url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80',
    description: 'Enhanced endurance mini commercial asset with 4K HDR optical sensor deployed for media livestreaming and urban site inspection.',
    eligibility_tier: 'VIP2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-vendra-4k-01',
    vip_level: 'VIP3',
    name: 'VENDRA 4K 01',
    category: 'VENDRA 4K Series',
    price: 120000,
    daily_income: 37200,
    total_revenue: 6696000,
    duration_days: 180,
    return_rate: 0.31, // 31% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 5,
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    description: 'Professional cinematic quadcopter fleet utilized in broadcasting, commercial real estate surveying, and architectural imaging.',
    eligibility_tier: 'VIP3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-vendra-4k-02',
    vip_level: 'VIP4',
    name: 'VENDRA 4K 02',
    category: 'VENDRA 4K Series',
    price: 250000,
    daily_income: 77500,
    total_revenue: 13950000,
    duration_days: 180,
    return_rate: 0.31, // 31% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 4,
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    description: 'Dual-sensor thermal & 4K optical industrial fleet for utility infrastructure monitoring, powerline diagnostics, and security.',
    eligibility_tier: 'VIP4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-vendra-mountain-01',
    vip_level: 'VIP5',
    name: 'VENDRA MOUNTAIN PEAK 01',
    category: 'VENDRA Enterprise Series',
    price: 500000,
    daily_income: 160000,
    total_revenue: 28800000,
    duration_days: 180,
    return_rate: 0.32, // 32% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 3,
    image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&auto=format&fit=crop&q=80',
    description: 'High-altitude all-weather industrial fleet engineered for mountain topography scanning, search & rescue, and environmental tracking.',
    eligibility_tier: 'VIP5',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-vendra-mountain-02',
    vip_level: 'VIP6',
    name: 'VENDRA MOUNTAIN PEAK 02',
    category: 'VENDRA Enterprise Series',
    price: 1000000,
    daily_income: 320000,
    total_revenue: 57600000,
    duration_days: 180,
    return_rate: 0.32, // 32% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 2,
    image_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
    description: 'Enterprise hybrid commercial fleet equipped with LiDAR spatial scanning for mineral geological exploration and cellular tower audits.',
    eligibility_tier: 'VIP6',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-vendra-city-01',
    vip_level: 'VIP7',
    name: 'VENDRA CITY 01',
    category: 'VENDRA Commercial Fleet',
    price: 2500000,
    daily_income: 825000,
    total_revenue: 148500000,
    duration_days: 180,
    return_rate: 0.33, // 33% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 2,
    image_url: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?w=800&auto=format&fit=crop&q=80',
    description: 'Autonomous metropolitan delivery fleet corridor network executing scheduled courier contracts and commercial cargo transits.',
    eligibility_tier: 'VIP7',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-vendra-city-02',
    vip_level: 'VIP8',
    name: 'VENDRA CITY 02',
    category: 'VENDRA Commercial Fleet',
    price: 5000000,
    daily_income: 2000000,
    total_revenue: 360000000,
    duration_days: 180,
    return_rate: 0.40, // 40% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 1,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    description: 'Flagship heavy-lift autonomous commercial fleet operating industrial maritime port surveillance and regional logistics routes.',
    eligibility_tier: 'VIP8',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const DEFAULT_SETTINGS: Record<string, string> = {
  min_deposit_ugx: '500',
  min_withdrawal_ugx: '5000',
  max_withdrawal_ugx: '5000000',
  l1_referral_percentage: '35.0',
  l2_referral_percentage: '6.0',
  referral_eligibility_min_deposit: '500',
  welcome_bonus_ugx: '5000',
  maintenance_mode: 'false',
  momo_gateway_mode: 'live',
  whatsapp_support_url: 'https://wa.me/qr/C3VMQ7Y7TXH6B1',
  telegram_channel_url: 'https://t.me/vendraplatiform',
  platform_announcement: 'Welcome to VENDRA Commercial Platform. Earn 35% Level 1 & 6% Level 2 referral commissions on member deposits.'
};

class RelationalDatabase {
  private store: DatabaseStore = {
    users: [],
    profiles: [],
    products: [],
    product_purchases: [],
    deposits: [],
    withdrawals: [],
    transactions: [],
    referral_relationships: [],
    referral_rewards: [],
    notifications: [],
    support_tickets: [],
    admin_users: [],
    audit_logs: [],
    platform_settings: { ...DEFAULT_SETTINGS }
  };

  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.store = {
          ...this.store,
          ...parsed,
          platform_settings: { ...DEFAULT_SETTINGS, ...(parsed.platform_settings || {}) }
        };
      } else if (fs.existsSync(BUNDLED_DB_FILE)) {
        const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.store = {
          ...this.store,
          ...parsed,
          platform_settings: { ...DEFAULT_SETTINGS, ...(parsed.platform_settings || {}) }
        };
        this.persist();
      } else {
        // First boot: Seed products and default admin
        this.store.products = [...DEFAULT_PRODUCTS];
        this.store.platform_settings = { ...DEFAULT_SETTINGS };
        this.seedSuperAdmin();
        this.persist();
      }

      // Ensure platform settings reflect latest policy
      this.store.platform_settings.min_deposit_ugx = '500';
      this.store.platform_settings.min_withdrawal_ugx = '5000';
      this.store.platform_settings.l1_referral_percentage = '35.0';
      this.store.platform_settings.l2_referral_percentage = '6.0';
      this.store.platform_settings.referral_eligibility_min_deposit = '500';
      this.store.platform_settings.momo_gateway_mode = 'live';

      // Ensure authorized VendraAdmin super admin exists with exact requested credentials
      const vendraAdmin = this.store.users.find(
        u => u.username?.toLowerCase() === 'vendraadmin' || u.phone?.toLowerCase() === 'vendraadmin'
      );
      if (!vendraAdmin) {
        this.seedSuperAdmin();
      } else {
        vendraAdmin.username = 'VendraAdmin';
        vendraAdmin.phone = 'VendraAdmin';
        vendraAdmin.role = 'super_admin';
        vendraAdmin.status = 'active';
        vendraAdmin.password_hash = bcrypt.hashSync('@Es%', bcrypt.genSaltSync(10));
      }

      // Ensure products are migrated to official VENDRA commercial investment plans
      const hasVendraProducts = this.store.products.some(p => p.id.startsWith('prod-vendra-'));
      if (this.store.products.length === 0 || !hasVendraProducts || this.store.products.some(p => !p.name.startsWith('VENDRA'))) {
        this.store.products = [...DEFAULT_PRODUCTS];
        this.persist();
      } else {
        // Backfill image_url if missing on any product
        for (const p of this.store.products) {
          if (!p.image_url) {
            const match = DEFAULT_PRODUCTS.find(dp => dp.id === p.id || dp.vip_level === p.vip_level);
            if (match?.image_url) {
              p.image_url = match.image_url;
            }
          }
        }
      }

      // Backfill UGX 5,000 welcome bonus for registered users who haven't received it
      for (const u of this.store.users) {
        if (u.role === 'super_admin') continue;
        const hasWelcome = this.store.transactions.some(t => t.user_id === u.id && t.reference.includes('BONUS-WELCOME'));
        if (!hasWelcome) {
          const now = new Date().toISOString();
          this.store.transactions.push({
            id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            user_id: u.id,
            amount: 5000,
            transaction_type: 'ADJUSTMENT_CREDIT',
            reference: `BONUS-WELCOME-${u.id}`,
            status: 'SUCCESSFUL',
            source: 'VENDRA Promotional System',
            description: 'UGX 5,000 Welcome Bonus (Unlocked upon first active recharge)',
            audit_info: JSON.stringify({ bonus: 5000, requires_recharge: true }),
            created_at: now
          });
          this.store.notifications.push({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            user_id: u.id,
            title: 'UGX 5,000 Welcome Bonus Credited!',
            message: '🎉 Welcome to VENDRA! UGX 5,000 Welcome Bonus has been credited to your balance. Make your first recharge to activate withdrawals.',
            type: 'announcement',
            is_read: false,
            created_at: now
          });
        }
      }
      this.persist();

      this.isInitialized = true;
    } catch (err) {
      console.error('Failed to initialize database store:', err);
    }
  }

  public seedSuperAdmin(): User {
    const adminId = 'VEN-ADM-VENDRA';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('@Es%', salt);
    const now = new Date().toISOString();

    let existingAdmin = this.store.users.find(
      u => u.username?.toLowerCase() === 'vendraadmin' || u.phone?.toLowerCase() === 'vendraadmin' || u.id === adminId
    );

    if (existingAdmin) {
      existingAdmin.username = 'VendraAdmin';
      existingAdmin.phone = 'VendraAdmin';
      existingAdmin.password_hash = passwordHash;
      existingAdmin.role = 'super_admin';
      existingAdmin.status = 'active';
      existingAdmin.updated_at = now;
      this.persist();
      return existingAdmin;
    }

    const adminUser: User = {
      id: adminId,
      phone: 'VendraAdmin',
      username: 'VendraAdmin',
      password_hash: passwordHash,
      role: 'super_admin',
      referral_code: 'VENDRAADM',
      referred_by_id: null,
      status: 'active',
      created_at: now,
      updated_at: now
    };

    const adminProfile: UserProfile = {
      id: 'prof-adm-001',
      user_id: adminId,
      full_name: 'Vendra Platform Administrator',
      email: 'admin@vendra.finance',
      nin_number: 'CM84029104829',
      kyc_status: 'verified',
      momo_provider: 'MTN_MOMO',
      momo_number: 'VendraAdmin',
      avatar_url: null,
      updated_at: now
    };

    this.store.users.push(adminUser);
    this.store.profiles.push(adminProfile);
    if (!this.store.admin_users.some(a => a.user_id === adminId)) {
      this.store.admin_users.push({
        id: 'adm-rec-001',
        user_id: adminId,
        role: 'super_admin',
        permissions: ['all', 'manage_withdrawals', 'manage_products', 'manage_settings', 'audit', 'users_manage'],
        created_at: now
      });
    }
    this.persist();
    return adminUser;
  }

  private persist() {
    try {
      const dataStr = JSON.stringify(this.store, null, 2);
      const targetDir = path.dirname(DB_FILE);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, dataStr, 'utf-8');

      // Also mirror to bundled file location to ensure survival across fresh container instances
      if (DB_FILE !== BUNDLED_DB_FILE) {
        try {
          const bundledDir = path.dirname(BUNDLED_DB_FILE);
          if (!fs.existsSync(bundledDir)) {
            fs.mkdirSync(bundledDir, { recursive: true });
          }
          fs.writeFileSync(BUNDLED_DB_FILE, dataStr, 'utf-8');
        } catch (_bundledErr) {
          // Ignore secondary write errors in constrained environments
        }
      }
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // AUDIT LOGGING
  public addAuditLog(
    actorId: string,
    actorRole: string,
    action: string,
    entityType: string,
    entityId: string,
    details: string,
    ipAddress: string = '127.0.0.1'
  ): AuditLog {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actor_id: actorId,
      actor_role: actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    };
    this.store.audit_logs.unshift(log);
    this.persist();
    return log;
  }

  // LEDGER AND BALANCES (DERIVED VERIFIED SYSTEM)
  public calculateUserFinancialSummary(userId: string): UserFinancialSummary {
    const userTx = this.store.transactions.filter(t => t.user_id === userId);

    let credits = 0;
    let debits = 0;
    let totalEarnings = 0;
    let productOperatingProfits = 0;
    let referralCommissions = 0;
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let pendingWithdrawals = 0;

    for (const tx of userTx) {
      if (tx.status === 'SUCCESSFUL') {
        if (
          tx.transaction_type === 'DEPOSIT' ||
          tx.transaction_type === 'PRODUCT_REWARD' ||
          tx.transaction_type === 'REFERRAL_REWARD' ||
          tx.transaction_type === 'ADJUSTMENT_CREDIT' ||
          tx.transaction_type === 'WITHDRAWAL_REFUND'
        ) {
          credits += tx.amount;
        }

        if (
          tx.transaction_type === 'PRODUCT_PURCHASE' ||
          tx.transaction_type === 'WITHDRAWAL_COMPLETED' ||
          tx.transaction_type === 'ADJUSTMENT_DEBIT'
        ) {
          debits += tx.amount;
        }

        if (tx.transaction_type === 'DEPOSIT') {
          totalDeposits += tx.amount;
        }
        if (tx.transaction_type === 'WITHDRAWAL_COMPLETED') {
          totalWithdrawals += tx.amount;
        }
        if (tx.transaction_type === 'PRODUCT_REWARD' || tx.transaction_type === 'REFERRAL_REWARD') {
          totalEarnings += tx.amount;
        }
        if (tx.transaction_type === 'PRODUCT_REWARD') {
          productOperatingProfits += tx.amount;
        }
        if (tx.transaction_type === 'REFERRAL_REWARD') {
          referralCommissions += tx.amount;
        }
      } else if (tx.status === 'PENDING') {
        // Pending withdrawal reservations are deducted from available balance immediately to prevent double spending!
        if (tx.transaction_type === 'WITHDRAWAL_RESERVE') {
          debits += tx.amount;
          pendingWithdrawals += tx.amount;
        }
      }
    }

    const available_balance = Math.max(0, credits - debits);
    const minDepositReq = parseFloat(this.store.platform_settings.min_deposit_ugx || '500');
    const has_active_recharge = totalDeposits >= minDepositReq;
    const can_withdraw = has_active_recharge;
    const welcome_bonus_claimed = userTx.some(t => t.reference.includes('BONUS-WELCOME'));

    const todayDateStr = new Date().toISOString().slice(0, 10);
    const daily_checkin_claimed_today = userTx.some(
      t => t.reference.includes(`BONUS-CHECKIN-${userId}-${todayDateStr}`) ||
           (t.reference.includes('BONUS-CHECKIN') && Date.now() - new Date(t.created_at).getTime() < 20 * 3600 * 1000)
    );

    const checkinCount = userTx.filter(t => t.reference.includes('BONUS-CHECKIN')).length;
    const daily_checkin_streak = Math.min(7, (checkinCount % 7) + (daily_checkin_claimed_today ? 0 : 1));

    const activePurchases = this.store.product_purchases.filter(
      p => p.user_id === userId && p.status === 'ACTIVE'
    );
    let dailyExpectedYield = 0;
    for (const pur of activePurchases) {
      const prod = this.store.products.find(p => p.id === pur.product_id);
      dailyExpectedYield += (prod?.daily_income || Math.round(pur.amount_paid * pur.return_rate));
    }

    return {
      available_balance,
      total_earnings: totalEarnings,
      total_deposits: totalDeposits,
      total_withdrawals: totalWithdrawals,
      pending_withdrawals: pendingWithdrawals,
      product_operating_profits: productOperatingProfits,
      referral_commissions: referralCommissions,
      active_product_count: activePurchases.length,
      daily_expected_yield: dailyExpectedYield,
      has_active_recharge,
      can_withdraw,
      welcome_bonus_claimed,
      daily_checkin_claimed_today,
      daily_checkin_streak
    };
  }

  // TRANSACTION LEDGER ENTRY
  public recordTransaction(
    userId: string,
    amount: number,
    type: Transaction['transaction_type'],
    reference: string,
    status: Transaction['status'],
    source: string,
    description: string,
    auditInfo: string
  ): Transaction {
    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      user_id: userId,
      amount: Math.abs(amount),
      transaction_type: type,
      reference,
      status,
      source,
      description,
      audit_info: auditInfo,
      created_at: new Date().toISOString()
    };
    this.store.transactions.unshift(tx);
    this.persist();
    return tx;
  }

  // USERS & PROFILES
  public getUserByPhone(phone: string): User | undefined {
    return this.store.users.find(u => u.phone === phone);
  }

  public getUserByUsernameOrPhone(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.store.users.find(
      u => (u.phone && u.phone.toLowerCase() === clean) ||
           (u.username && u.username.toLowerCase() === clean)
    );
  }

  public getUserById(id: string): User | undefined {
    return this.store.users.find(u => u.id === id);
  }

  public getUserByReferralCode(code: string): User | undefined {
    return this.store.users.find(u => u.referral_code.toUpperCase() === code.toUpperCase());
  }

  public getUserByEmail(email: string): User | undefined {
    const cleanEmail = email.trim().toLowerCase();
    const profile = this.store.profiles.find(p => p.email && p.email.trim().toLowerCase() === cleanEmail);
    if (profile) {
      return this.getUserById(profile.user_id);
    }
    return undefined;
  }

  public getProfileByUserId(userId: string): UserProfile | undefined {
    return this.store.profiles.find(p => p.user_id === userId);
  }

  public createUser(
    phone: string,
    passwordHash: string,
    fullName: string,
    referredByCode?: string
  ): { user: User; profile: UserProfile } {
    const cleanPhone = phone.trim();
    if (this.getUserByPhone(cleanPhone)) {
      throw new Error('An account with this phone number already exists.');
    }

    // Generate unique user ID
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const userId = `VEN-${randomSuffix}`;

    // Generate unique referral code
    const refCode = `VEN${Math.floor(1000 + Math.random() * 9000)}`;

    let inviter: User | undefined;
    if (referredByCode) {
      inviter = this.getUserByReferralCode(referredByCode.trim());
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: userId,
      phone: cleanPhone,
      password_hash: passwordHash,
      role: 'user',
      referral_code: refCode,
      referred_by_id: inviter ? inviter.id : null,
      status: 'active',
      created_at: now,
      updated_at: now
    };

    const newProfile: UserProfile = {
      id: `prof-${Date.now()}`,
      user_id: userId,
      full_name: fullName.trim(),
      email: null,
      nin_number: null,
      kyc_status: 'verified',
      momo_provider: cleanPhone.startsWith('+25677') || cleanPhone.startsWith('+25678') ? 'MTN_MOMO' : 'AIRTEL_MONEY',
      momo_number: cleanPhone,
      avatar_url: null,
      updated_at: now
    };

    this.store.users.push(newUser);
    this.store.profiles.push(newProfile);

    // Track direct referral relationship (Level 1)
    if (inviter) {
      this.store.referral_relationships.push({
        id: `ref-rel-${Date.now()}-1`,
        inviter_id: inviter.id,
        invitee_id: userId,
        level: 1,
        created_at: now
      });

      // If inviter also had an inviter, track secondary relationship (Level 2)
      if (inviter.referred_by_id) {
        this.store.referral_relationships.push({
          id: `ref-rel-${Date.now()}-2`,
          inviter_id: inviter.referred_by_id,
          invitee_id: userId,
          level: 2,
          created_at: now
        });
      }
    }

    // Award UGX 5,000 Welcome Bonus upon registration (unlocked after first deposit)
    this.recordTransaction(
      userId,
      5000,
      'ADJUSTMENT_CREDIT',
      `BONUS-WELCOME-${userId}`,
      'SUCCESSFUL',
      'VENDRA Promotional System',
      'UGX 5,000 Welcome Bonus (Unlocked upon first active recharge)',
      JSON.stringify({ bonus: 5000, requires_recharge: true })
    );

    // Add welcome notification
    this.addNotification(
      userId,
      'Welcome to VENDRA - UGX 5,000 Bonus Credited!',
      '🎉 Welcome to VENDRA! UGX 5,000 Welcome Bonus has been added to your balance. Make your first account recharge to activate full withdrawal privileges.',
      'announcement'
    );

    this.addAuditLog(userId, 'user', 'USER_REGISTERED', 'users', userId, `User registered with phone ${cleanPhone}. Credited UGX 5,000 Welcome Bonus.`);

    this.persist();
    return { user: newUser, profile: newProfile };
  }

  public updatePassword(userId: string, newPasswordHash: string) {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.password_hash = newPasswordHash;
    user.updated_at = new Date().toISOString();
    this.addAuditLog(userId, 'user', 'PASSWORD_RESET', 'users', userId, 'Password successfully reset');
    this.persist();
  }

  public makeUserAdmin(userId: string): User {
    const user = this.store.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.role = 'super_admin';
    user.updated_at = new Date().toISOString();

    const profile = this.store.profiles.find(p => p.user_id === userId);
    if (profile && !profile.email) {
      profile.email = 'eaglestylesug@gmail.com';
    }

    if (!this.store.admin_users.some(a => a.user_id === userId)) {
      this.store.admin_users.push({
        id: `adm-${Date.now()}`,
        user_id: userId,
        role: 'super_admin',
        permissions: ['all', 'withdrawals_approve', 'deposits_manage', 'products_edit', 'users_manage', 'settings_edit'],
        created_at: new Date().toISOString()
      });
    }

    this.addAuditLog(userId, 'super_admin', 'GRANT_OWNER_ROLE', 'users', userId, 'Assigned Owner & Withdrawal Approver privileges');
    this.persist();
    return user;
  }

  public updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const profile = this.getProfileByUserId(userId);
    if (!profile) throw new Error('Profile not found');
    Object.assign(profile, updates, { updated_at: new Date().toISOString() });
    this.persist();
    return profile;
  }

  // PRODUCTS
  public getProducts(): Product[] {
    return this.store.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.store.products.find(p => p.id === id);
  }

  public createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>, adminId: string): Product {
    if (data.price < 10000) {
      throw new Error('Default minimum product amount is UGX 10,000.');
    }
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      created_at: now,
      updated_at: now
    };
    this.store.products.push(newProduct);
    this.addAuditLog(adminId, 'admin', 'PRODUCT_CREATED', 'products', newProduct.id, `Created product: ${newProduct.name} at UGX ${newProduct.price}`);
    this.persist();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>, adminId: string): Product {
    const product = this.getProductById(id);
    if (!product) throw new Error('Product not found');
    if (updates.price !== undefined && updates.price < 10000) {
      throw new Error('Minimum product amount is UGX 10,000.');
    }
    Object.assign(product, updates, { updated_at: new Date().toISOString() });
    this.addAuditLog(adminId, 'admin', 'PRODUCT_UPDATED', 'products', id, `Updated product fields: ${Object.keys(updates).join(', ')}`);
    this.persist();
    return product;
  }

  public deleteProduct(id: string, adminId: string): boolean {
    const idx = this.store.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    const removed = this.store.products.splice(idx, 1)[0];
    this.addAuditLog(adminId, 'admin', 'PRODUCT_DELETED', 'products', id, `Deleted product: ${removed.name}`);
    this.persist();
    return true;
  }

  // PRODUCT PURCHASES
  public purchaseProduct(userId: string, productId: string): ProductPurchase {
    const product = this.getProductById(productId);
    if (!product) throw new Error('Product does not exist.');
    if (product.status !== 'active') throw new Error('This product is not currently active for participation.');

    // Check user purchase limit
    const existingPurchases = this.store.product_purchases.filter(
      p => p.user_id === userId && p.product_id === productId && p.status === 'ACTIVE'
    );
    if (existingPurchases.length >= product.purchase_limit) {
      throw new Error(`You have reached the maximum active purchase limit (${product.purchase_limit}) for this product.`);
    }

    // Ledger verification: check active deposit & available balance
    const summary = this.calculateUserFinancialSummary(userId);
    const minDeposit = parseFloat(this.store.platform_settings.min_deposit_ugx || '500');

    // Strict Rule: No one can use the welcome bonus to buy products without an active deposit!
    if (!summary.has_active_recharge || summary.total_deposits < minDeposit) {
      throw new Error(
        `Active deposit required: You must make an active deposit of at least UGX ${minDeposit.toLocaleString()} before purchasing products. The UGX 5,000 welcome bonus cannot be used to buy products without an active deposit.`
      );
    }

    if (summary.available_balance < product.price) {
      throw new Error(
        `Insufficient available balance. Required: UGX ${product.price.toLocaleString()}, Available: UGX ${summary.available_balance.toLocaleString()}. Please recharge first.`
      );
    }

    // Calculate projected reward using configurable parameters
    // Prioritize exact VENDRA total_revenue if available, otherwise daily rate
    let projectedReward = product.total_revenue || 0;
    if (!projectedReward) {
      if (product.daily_income) {
        projectedReward = product.daily_income * product.duration_days;
      } else if (product.return_type === 'daily_percentage') {
        projectedReward = Math.round(product.price * product.return_rate * product.duration_days);
      } else {
        projectedReward = Math.round(product.return_rate);
      }
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + product.duration_days * 24 * 60 * 60 * 1000);
    const purchaseId = `pur-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const dailyIncome = product.daily_income || Math.round(product.price * product.return_rate);
    const activatedAt = now.toISOString();
    const nextProfitDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const purchase: ProductPurchase = {
      id: purchaseId,
      user_id: userId,
      product_id: product.id,
      product_name: product.name,
      amount_paid: product.price,
      projected_reward: projectedReward,
      return_rate: product.return_rate,
      duration_days: product.duration_days,
      start_date: activatedAt,
      end_date: endDate.toISOString(),
      status: 'ACTIVE',
      credited_rewards: 0, // 24-hour cycle rule: initial rewards start at 0 until exactly 24 hours elapse
      last_accrual_at: null,
      created_at: activatedAt,
      // 24-Hour Server-Side Profit Generation Fields
      activated_at: activatedAt,
      next_profit_due_at: nextProfitDueAt,
      profit_status: 'PENDING_24H',
      cycles_completed: 0,
      last_processed_transaction_id: null,
      pesapal_tracking_id: null,
      pesapal_reference: null,
      payment_method: 'BALANCE'
    };

    // Ledger debit transaction
    const tx = this.recordTransaction(
      userId,
      product.price,
      'PRODUCT_PURCHASE',
      `PUR-${purchaseId.toUpperCase()}`,
      'SUCCESSFUL',
      'PRODUCT_PURCHASE_ENGINE',
      `Purchased ${product.name} (${product.duration_days} days term)`,
      JSON.stringify({ productId: product.id, projectedReward, activatedAt, nextProfitDueAt })
    );

    purchase.last_processed_transaction_id = tx.id;
    this.store.product_purchases.push(purchase);

    // Trigger legitimate referral rewards for qualifying purchase
    this.processReferralRewards(userId, tx.id, product.price);

    // Notification
    this.addNotification(
      userId,
      'Investment Activated — 24-Hour Cycle Started',
      `You have successfully acquired ${product.name} for UGX ${product.price.toLocaleString()}. Your 24-hour profit cycle has begun. First scheduled operating profit will be generated in exactly 24 hours.`,
      'purchase'
    );

    this.addAuditLog(userId, 'user', 'PRODUCT_PURCHASED', 'product_purchases', purchase.id, `Purchased ${product.name} for UGX ${product.price}. 24h profit due: ${nextProfitDueAt}`);

    this.persist();
    return purchase;
  }

  // PESAPAL DIRECT INVESTMENT ACTIVATION
  public activateProductFromPesaPal(
    userId: string,
    productId: string,
    pesapalTrackingId: string,
    pesapalReference: string
  ): ProductPurchase {
    // Idempotency: prevent duplicate investment activation
    const existing = this.store.product_purchases.find(
      p => p.pesapal_tracking_id === pesapalTrackingId
    );
    if (existing) {
      return existing;
    }

    const product = this.getProductById(productId);
    if (!product) throw new Error('Investment product not found.');

    let projectedReward = product.total_revenue || 0;
    if (!projectedReward) {
      if (product.daily_income) {
        projectedReward = product.daily_income * product.duration_days;
      } else if (product.return_type === 'daily_percentage') {
        projectedReward = Math.round(product.price * product.return_rate * product.duration_days);
      } else {
        projectedReward = Math.round(product.return_rate);
      }
    }

    const now = new Date();
    const activatedAt = now.toISOString();
    const nextProfitDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(now.getTime() + product.duration_days * 24 * 60 * 60 * 1000);
    const purchaseId = `pur-pesa-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const purchase: ProductPurchase = {
      id: purchaseId,
      user_id: userId,
      product_id: product.id,
      product_name: product.name,
      amount_paid: product.price,
      projected_reward: projectedReward,
      return_rate: product.return_rate,
      duration_days: product.duration_days,
      start_date: activatedAt,
      end_date: endDate.toISOString(),
      status: 'ACTIVE',
      credited_rewards: 0,
      last_accrual_at: null,
      created_at: activatedAt,
      activated_at: activatedAt,
      next_profit_due_at: nextProfitDueAt,
      profit_status: 'PENDING_24H',
      cycles_completed: 0,
      last_processed_transaction_id: null,
      pesapal_tracking_id: pesapalTrackingId,
      pesapal_reference: pesapalReference,
      payment_method: 'PESAPAL'
    };

    // Record PesaPal purchase transaction
    const tx = this.recordTransaction(
      userId,
      product.price,
      'PRODUCT_PURCHASE',
      `PESA-PUR-${purchaseId.toUpperCase()}`,
      'SUCCESSFUL',
      'PESAPAL_PAYMENT_GATEWAY',
      `Direct PesaPal Purchase: ${product.name} (Tracking ID: ${pesapalTrackingId})`,
      JSON.stringify({
        productId: product.id,
        pesapalTrackingId,
        pesapalReference,
        activatedAt,
        nextProfitDueAt
      })
    );

    purchase.last_processed_transaction_id = tx.id;
    this.store.product_purchases.push(purchase);

    // Process referral commissions for the inviter
    this.processReferralRewards(userId, tx.id, product.price);

    this.addNotification(
      userId,
      'PesaPal Payment Confirmed — Investment Activated',
      `Payment of UGX ${product.price.toLocaleString()} verified by PesaPal. ${product.name} is now active. Your 24-hour profit cycle has started and first yield will be generated in 24 hours.`,
      'purchase'
    );

    this.addAuditLog(
      userId,
      'user',
      'PRODUCT_ACTIVATED_PESAPAL',
      'product_purchases',
      purchase.id,
      `PesaPal Order ${pesapalTrackingId} confirmed for ${product.name}. 24h profit cycle active.`
    );

    this.persist();
    return purchase;
  }

  public claimUserProductYield(userId: string): {
    claimed: number;
    count: number;
    pendingCount: number;
    nextDueInHours: number;
  } {
    const userPurchases = this.store.product_purchases.filter(
      p => p.user_id === userId && p.status === 'ACTIVE'
    );
    if (userPurchases.length === 0) {
      return { claimed: 0, count: 0, pendingCount: 0, nextDueInHours: 24 };
    }

    let totalClaimed = 0;
    let count = 0;
    let pendingCount = 0;
    let minRemainingHours = 24;
    const now = new Date();
    const nowTime = now.getTime();

    for (const purchase of userPurchases) {
      const productDef = this.store.products.find(p => p.id === purchase.product_id);
      const dailyReward = productDef?.daily_income || Math.round(purchase.amount_paid * purchase.return_rate);

      // Server-side timestamp verification
      const activatedTime = new Date(purchase.activated_at || purchase.start_date).getTime();
      const currentDueTime = purchase.next_profit_due_at
        ? new Date(purchase.next_profit_due_at).getTime()
        : activatedTime + 24 * 60 * 60 * 1000;

      // Check if 24 hours have elapsed
      if (nowTime >= currentDueTime) {
        if (dailyReward > 0 && purchase.credited_rewards < purchase.projected_reward) {
          const nextCycle = (purchase.cycles_completed || 0) + 1;
          const txRef = `REW-24H-${purchase.id}-CYCLE-${nextCycle}`;

          // Prevent duplicate generation: ensure txRef is unique
          const alreadyProcessed = this.store.transactions.some(t => t.reference === txRef);
          if (!alreadyProcessed) {
            const tx = this.recordTransaction(
              userId,
              dailyReward,
              'PRODUCT_REWARD',
              txRef,
              'SUCCESSFUL',
              '24H_SERVER_PROFIT_ENGINE',
              `24-Hour operating profit for ${purchase.product_name} (Cycle ${nextCycle})`,
              JSON.stringify({
                purchaseId: purchase.id,
                cycle: nextCycle,
                activatedAt: purchase.activated_at,
                processedAt: now.toISOString()
              })
            );

            purchase.credited_rewards += dailyReward;
            purchase.cycles_completed = nextCycle;
            purchase.last_accrual_at = now.toISOString();
            purchase.last_processed_transaction_id = tx.id;

            // Schedule next 24-hour cycle
            const nextDue = new Date(currentDueTime + 24 * 60 * 60 * 1000);
            purchase.next_profit_due_at = nextDue.toISOString();

            if (purchase.credited_rewards >= purchase.projected_reward || purchase.cycles_completed >= purchase.duration_days) {
              purchase.status = 'COMPLETED';
              purchase.profit_status = 'CYCLE_FINISHED';
            } else {
              purchase.profit_status = 'PENDING_24H';
            }

            this.addNotification(
              userId,
              '24-Hour Profit Processed',
              `+UGX ${dailyReward.toLocaleString()} 24-hour scheduled profit from ${purchase.product_name} has been processed and credited to your wallet balance.`,
              'reward'
            );

            totalClaimed += dailyReward;
            count++;
          }
        }
      } else {
        // Profit is still pending 24-hour maturation
        pendingCount++;
        const remainingHours = Math.max(1, Math.ceil((currentDueTime - nowTime) / (1000 * 60 * 60)));
        if (remainingHours < minRemainingHours) {
          minRemainingHours = remainingHours;
        }
      }
    }

    if (totalClaimed > 0) {
      this.persist();
    }

    return {
      claimed: totalClaimed,
      count,
      pendingCount,
      nextDueInHours: minRemainingHours
    };
  }

  public getUserPurchases(userId: string): ProductPurchase[] {
    return this.store.product_purchases.filter(p => p.user_id === userId);
  }

  // ACCRUE 24-HOUR PROFITS (Server-Authoritative Batch Process)
  public accrueActiveProductRewards(): { processed: number; totalCredited: number } {
    let processed = 0;
    let totalCredited = 0;
    const now = new Date();
    const nowTime = now.getTime();

    for (const purchase of this.store.product_purchases) {
      if (purchase.status !== 'ACTIVE') continue;

      const activatedTime = new Date(purchase.activated_at || purchase.start_date).getTime();
      const currentDueTime = purchase.next_profit_due_at
        ? new Date(purchase.next_profit_due_at).getTime()
        : activatedTime + 24 * 60 * 60 * 1000;

      // Only generate profit if exactly 24 hours have elapsed
      if (nowTime >= currentDueTime) {
        const productDef = this.store.products.find(p => p.id === purchase.product_id);
        const dailyReward = productDef?.daily_income || Math.round(purchase.amount_paid * purchase.return_rate);

        if (dailyReward > 0 && purchase.credited_rewards < purchase.projected_reward) {
          const nextCycle = (purchase.cycles_completed || 0) + 1;
          const txRef = `REW-24H-${purchase.id}-CYCLE-${nextCycle}`;

          // Duplicate prevention check
          const alreadyProcessed = this.store.transactions.some(t => t.reference === txRef);
          if (!alreadyProcessed) {
            const tx = this.recordTransaction(
              purchase.user_id,
              dailyReward,
              'PRODUCT_REWARD',
              txRef,
              'SUCCESSFUL',
              '24H_SERVER_PROFIT_ENGINE',
              `24-Hour operating profit for ${purchase.product_name} (Cycle ${nextCycle})`,
              JSON.stringify({
                purchaseId: purchase.id,
                cycle: nextCycle,
                activatedAt: purchase.activated_at,
                processedAt: now.toISOString()
              })
            );

            purchase.credited_rewards += dailyReward;
            purchase.cycles_completed = nextCycle;
            purchase.last_accrual_at = now.toISOString();
            purchase.last_processed_transaction_id = tx.id;

            // Advance to next 24-hour cycle
            const nextDue = new Date(currentDueTime + 24 * 60 * 60 * 1000);
            purchase.next_profit_due_at = nextDue.toISOString();

            if (purchase.credited_rewards >= purchase.projected_reward || purchase.cycles_completed >= purchase.duration_days) {
              purchase.status = 'COMPLETED';
              purchase.profit_status = 'CYCLE_FINISHED';
            } else {
              purchase.profit_status = 'PENDING_24H';
            }

            this.addNotification(
              purchase.user_id,
              '24-Hour Profit Credited',
              `+UGX ${dailyReward.toLocaleString()} 24-hour scheduled profit from ${purchase.product_name} has been credited to your available balance.`,
              'reward'
            );

            totalCredited += dailyReward;
            processed++;
          }
        }
      }

      // Check if full duration has matured
      const endDate = new Date(purchase.end_date);
      if (nowTime >= endDate.getTime() && purchase.status === 'ACTIVE') {
        purchase.status = 'COMPLETED';
        purchase.profit_status = 'CYCLE_FINISHED';
        // Return principal at maturity
        this.recordTransaction(
          purchase.user_id,
          purchase.amount_paid,
          'ADJUSTMENT_CREDIT',
          `MAT-${purchase.id}-${Date.now()}`,
          'SUCCESSFUL',
          'MATURITY_ENGINE',
          `Principal capital release upon maturity of ${purchase.product_name}`,
          JSON.stringify({ purchaseId: purchase.id })
        );

        this.addNotification(
          purchase.user_id,
          'Equipment Term Matured',
          `Your term for ${purchase.product_name} has matured. Principal capital UGX ${purchase.amount_paid.toLocaleString()} has been unlocked and credited.`,
          'reward'
        );
      }
    }

    if (processed > 0) {
      this.persist();
    }

    return { processed, totalCredited };
  }

  // REFERRAL ENGINE
  public processReferralRewards(inviteeId: string, qualifyingTxId: string, qualifyingAmount: number) {
    const l1Percent = parseFloat(this.store.platform_settings.l1_referral_percentage || '35.0');
    const l2Percent = parseFloat(this.store.platform_settings.l2_referral_percentage || '6.0');
    const minQualifyingDeposit = parseFloat(this.store.platform_settings.referral_eligibility_min_deposit || '500');

    // "only commissioned after the referrals deposit"
    const inviteeSummary = this.calculateUserFinancialSummary(inviteeId);
    if (inviteeSummary.total_deposits < minQualifyingDeposit) {
      return;
    }

    const relationships = this.store.referral_relationships.filter(r => r.invitee_id === inviteeId);

    for (const rel of relationships) {
      const inviter = this.getUserById(rel.inviter_id);
      if (!inviter || inviter.status !== 'active') continue;

      const percent = rel.level === 1 ? l1Percent : rel.level === 2 ? l2Percent : 0;
      if (percent <= 0) continue;

      const rewardAmount = Math.round((qualifyingAmount * percent) / 100);
      if (rewardAmount <= 0) continue;

      const rewardRecord: ReferralReward = {
        id: `ref-rew-${Date.now()}-${rel.level}`,
        inviter_id: inviter.id,
        invitee_id: inviteeId,
        qualifying_transaction_id: qualifyingTxId,
        amount: rewardAmount,
        percentage: percent,
        level: rel.level,
        status: 'CREDITED',
        created_at: new Date().toISOString()
      };
      this.store.referral_rewards.push(rewardRecord);

      // Credit inviter ledger
      this.recordTransaction(
        inviter.id,
        rewardAmount,
        'REFERRAL_REWARD',
        `REF-COMM-${rewardRecord.id.toUpperCase()}`,
        'SUCCESSFUL',
        'REFERRAL_COMMISSION_SYSTEM',
        `Level ${rel.level} commission (${percent}%) from team partner transaction`,
        JSON.stringify({ inviteeId, level: rel.level, rate: percent })
      );

      this.addNotification(
        inviter.id,
        'Team Referral Reward Received',
        `You received a Level ${rel.level} commission of UGX ${rewardAmount.toLocaleString()} (${percent}%) from a team member's qualifying participation!`,
        'reward'
      );
    }
  }

  public processReferralRewardsForDeposit(inviteeId: string, depositRef: string, depositAmount: number) {
    const l1Percent = parseFloat(this.store.platform_settings.l1_referral_percentage || '35.0');
    const l2Percent = parseFloat(this.store.platform_settings.l2_referral_percentage || '6.0');

    const relationships = this.store.referral_relationships.filter(r => r.invitee_id === inviteeId);

    for (const rel of relationships) {
      const inviter = this.getUserById(rel.inviter_id);
      if (!inviter || inviter.status !== 'active') continue;

      const percent = rel.level === 1 ? l1Percent : rel.level === 2 ? l2Percent : 0;
      if (percent <= 0) continue;

      const rewardAmount = Math.round((depositAmount * percent) / 100);
      if (rewardAmount <= 0) continue;

      const rewardRecord: ReferralReward = {
        id: `ref-dep-${Date.now()}-${rel.level}`,
        inviter_id: inviter.id,
        invitee_id: inviteeId,
        qualifying_transaction_id: depositRef,
        amount: rewardAmount,
        percentage: percent,
        level: rel.level,
        status: 'CREDITED',
        created_at: new Date().toISOString()
      };
      this.store.referral_rewards.push(rewardRecord);

      // Credit inviter ledger
      this.recordTransaction(
        inviter.id,
        rewardAmount,
        'REFERRAL_REWARD',
        `REF-DEP-${rewardRecord.id.toUpperCase()}`,
        'SUCCESSFUL',
        'REFERRAL_COMMISSION_SYSTEM',
        `Level ${rel.level} commission (${percent}%) from referral deposit of UGX ${depositAmount.toLocaleString()}`,
        JSON.stringify({ inviteeId, level: rel.level, rate: percent, depositAmount })
      );

      this.addNotification(
        inviter.id,
        'Referral Deposit Commission Credited',
        `You received a Level ${rel.level} commission of UGX ${rewardAmount.toLocaleString()} (${percent}%) from a team member's verified deposit!`,
        'reward'
      );
    }
  }

  // DEPOSITS (MOBILE MONEY & PESAPAL)
  public createDepositRequest(
    userId: string,
    amount: number,
    provider: Deposit['provider'],
    phoneNumber: string,
    pesapalOrderTrackingId?: string,
    pesapalRedirectUrl?: string
  ): Deposit {
    const minDeposit = parseFloat(this.store.platform_settings.min_deposit_ugx || '500');
    if (amount < minDeposit) {
      throw new Error(`Minimum recharge is UGX ${minDeposit.toLocaleString()}`);
    }

    const ref = `DEP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const deposit: Deposit = {
      id: `dep-${Date.now()}`,
      user_id: userId,
      amount,
      provider,
      phone_number: phoneNumber.trim(),
      reference: ref,
      gateway_reference: pesapalOrderTrackingId || `GW-${ref}`,
      pesapal_order_tracking_id: pesapalOrderTrackingId || null,
      pesapal_redirect_url: pesapalRedirectUrl || null,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      confirmed_at: null
    };

    this.store.deposits.push(deposit);

    const providerLabel =
      provider === 'PESAPAL'
        ? 'PesaPal (Card / MoMo / Airtel)'
        : provider === 'MTN_MOMO'
        ? 'MTN MoMo'
        : 'Airtel Money';

    // Initial pending transaction in ledger
    this.recordTransaction(
      userId,
      amount,
      'DEPOSIT',
      ref,
      'PENDING',
      provider === 'PESAPAL' ? 'PESAPAL_GATEWAY' : 'UG_MOMO_GATEWAY',
      `Deposit via ${providerLabel} (${phoneNumber})`,
      JSON.stringify({ provider, phoneNumber, gatewayRef: deposit.gateway_reference, pesapalTrackingId: pesapalOrderTrackingId })
    );

    this.addAuditLog(userId, 'user', 'DEPOSIT_INITIATED', 'deposits', deposit.id, `Initiated UGX ${amount} deposit via ${provider}`);

    this.persist();
    return deposit;
  }

  public updateDepositPesaPalInfo(
    reference: string,
    orderTrackingId: string,
    redirectUrl: string
  ): Deposit | undefined {
    const deposit = this.store.deposits.find(d => d.reference === reference);
    if (!deposit) return undefined;

    deposit.pesapal_order_tracking_id = orderTrackingId;
    deposit.pesapal_redirect_url = redirectUrl;
    deposit.gateway_reference = orderTrackingId;
    this.persist();
    return deposit;
  }

  public getDepositByReferenceOrTrackingId(refOrTrackingId: string): Deposit | undefined {
    return this.store.deposits.find(
      d => d.reference === refOrTrackingId || d.pesapal_order_tracking_id === refOrTrackingId
    );
  }

  public confirmDepositFromGateway(reference: string, gatewayExternalId: string): Deposit {
    const deposit = this.getDepositByReferenceOrTrackingId(reference);
    if (!deposit) throw new Error('Deposit record not found');
    if (deposit.status === 'CONFIRMED') return deposit; // idempotency

    deposit.status = 'CONFIRMED';
    deposit.gateway_reference = gatewayExternalId;
    deposit.confirmed_at = new Date().toISOString();

    // Update pending ledger transaction to SUCCESSFUL so balance increases
    const tx = this.store.transactions.find(t => t.reference === deposit.reference);
    if (tx) {
      tx.status = 'SUCCESSFUL';
      tx.audit_info = JSON.stringify({ verifiedGatewayId: gatewayExternalId, confirmedAt: deposit.confirmed_at });
    } else {
      // Fallback in case tx wasn't found
      this.recordTransaction(
        deposit.user_id,
        deposit.amount,
        'DEPOSIT',
        deposit.reference,
        'SUCCESSFUL',
        deposit.provider === 'PESAPAL' ? 'PESAPAL_GATEWAY' : 'UG_MOMO_GATEWAY',
        `Deposit via ${deposit.provider === 'PESAPAL' ? 'PesaPal' : deposit.provider}`,
        JSON.stringify({ verifiedGatewayId: gatewayExternalId })
      );
    }

    const gatewayName = deposit.provider === 'PESAPAL' ? 'PesaPal' : 'Mobile Money';
    this.addNotification(
      deposit.user_id,
      `${gatewayName} Deposit Confirmed`,
      `UGX ${deposit.amount.toLocaleString()} has been securely credited to your VENDRA available balance. Ref: ${deposit.reference}`,
      'deposit'
    );

    this.addAuditLog(
      deposit.user_id,
      'system',
      'DEPOSIT_CONFIRMED',
      'deposits',
      deposit.id,
      `Deposit of UGX ${deposit.amount} confirmed via gateway ref ${gatewayExternalId}`
    );

    // Process referral commissions for this verified deposit
    this.processReferralRewardsForDeposit(deposit.user_id, deposit.reference, deposit.amount);

    this.persist();
    return deposit;
  }

  public approveDeposit(depositId: string, adminId: string, adminNotes?: string): Deposit {
    const deposit = this.store.deposits.find(d => d.id === depositId || d.reference === depositId);
    if (!deposit) throw new Error('Deposit record not found');
    if (deposit.status === 'CONFIRMED') return deposit;

    deposit.status = 'CONFIRMED';
    deposit.confirmed_at = new Date().toISOString();

    const tx = this.store.transactions.find(t => t.reference === deposit.reference);
    if (tx) {
      tx.status = 'SUCCESSFUL';
      tx.audit_info = JSON.stringify({ approvedBy: adminId, confirmedAt: deposit.confirmed_at, notes: adminNotes });
    } else {
      this.recordTransaction(
        deposit.user_id,
        deposit.amount,
        'DEPOSIT',
        deposit.reference,
        'SUCCESSFUL',
        'ADMIN_CLEARING_DESK',
        `Deposit confirmed by administrator (${deposit.provider})`,
        JSON.stringify({ approvedBy: adminId, notes: adminNotes })
      );
    }

    this.addNotification(
      deposit.user_id,
      'Deposit Approved by Administration',
      `Your recharge of UGX ${deposit.amount.toLocaleString()} has been verified and credited to your available balance.`,
      'deposit'
    );

    // Process referral commissions for this deposit (35% L1, 6% L2)
    this.processReferralRewardsForDeposit(deposit.user_id, deposit.reference, deposit.amount);

    this.addAuditLog(adminId, 'admin', 'DEPOSIT_APPROVED', 'deposits', deposit.id, `Approved UGX ${deposit.amount} for user ${deposit.user_id}`);
    this.persist();
    return deposit;
  }

  public rejectDeposit(depositId: string, adminId: string, reason?: string): Deposit {
    const deposit = this.store.deposits.find(d => d.id === depositId || d.reference === depositId);
    if (!deposit) throw new Error('Deposit record not found');
    if (deposit.status === 'CONFIRMED') throw new Error('Cannot reject a confirmed deposit');

    deposit.status = 'REJECTED';

    const tx = this.store.transactions.find(t => t.reference === deposit.reference);
    if (tx) {
      tx.status = 'FAILED';
      tx.audit_info = JSON.stringify({ rejectedBy: adminId, reason });
    }

    this.addNotification(
      deposit.user_id,
      'Deposit Request Declined',
      `Your recharge of UGX ${deposit.amount.toLocaleString()} could not be verified: ${reason || 'Telecommunication USSD timeout or unmatched transaction reference'}.`,
      'security'
    );

    this.addAuditLog(adminId, 'admin', 'DEPOSIT_REJECTED', 'deposits', deposit.id, `Rejected deposit: ${reason || 'Unmatched'}`);
    this.persist();
    return deposit;
  }

  // WITHDRAWALS
  public createWithdrawalRequest(
    userId: string,
    amount: number,
    provider: Withdrawal['provider'],
    phoneNumber: string
  ): Withdrawal {
    const minWithdrawal = parseFloat(this.store.platform_settings.min_withdrawal_ugx || '5000');
    if (amount < minWithdrawal) {
      throw new Error(`Minimum withdrawal is UGX ${minWithdrawal.toLocaleString()}`);
    }

    const maxWithdrawal = parseFloat(this.store.platform_settings.max_withdrawal_ugx || '5000000');
    if (amount > maxWithdrawal) {
      throw new Error(`Maximum withdrawal limit is UGX ${maxWithdrawal.toLocaleString()} per transaction.`);
    }

    // Active Recharge Requirement Rule:
    // 5k welcome bonus and earnings are withdrawable after active deposit
    const summary = this.calculateUserFinancialSummary(userId);
    if (!summary.has_active_recharge) {
      const minDep = parseFloat(this.store.platform_settings.min_deposit_ugx || '500');
      throw new Error(
        `Active recharge required: You must make at least one recharge (minimum UGX ${minDep.toLocaleString()}) to activate withdrawals. Your UGX 5,000 welcome bonus and rewards are unlocked immediately once your first recharge is confirmed.`
      );
    }

    // Atomic Balance Check
    if (summary.available_balance < amount) {
      throw new Error(
        `Insufficient available funds. You requested UGX ${amount.toLocaleString()}, but your available balance is UGX ${summary.available_balance.toLocaleString()}.`
      );
    }

    const ref = `WTH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const withdrawal: Withdrawal = {
      id: `wth-${Date.now()}`,
      user_id: userId,
      amount,
      provider,
      phone_number: phoneNumber.trim(),
      reference: ref,
      payout_reference: null,
      status: 'PENDING',
      admin_notes: null,
      requested_at: new Date().toISOString(),
      reviewed_at: null,
      paid_at: null,
      reviewed_by: null
    };

    this.store.withdrawals.push(withdrawal);

    // Reserve funds immediately in ledger so they CANNOT be withdrawn twice
    this.recordTransaction(
      userId,
      amount,
      'WITHDRAWAL_RESERVE',
      ref,
      'PENDING',
      'WITHDRAWAL_ESCROW',
      `Reserved for Mobile Money Payout to ${phoneNumber} (${provider})`,
      JSON.stringify({ provider, phoneNumber, status: 'PENDING_REVIEW' })
    );

    this.addNotification(
      userId,
      'Withdrawal Request Submitted',
      `Your withdrawal request of UGX ${amount.toLocaleString()} has been queued for verification. Ref: ${ref}. Funds have been reserved safely.`,
      'withdrawal'
    );

    this.addAuditLog(userId, 'user', 'WITHDRAWAL_REQUESTED', 'withdrawals', withdrawal.id, `Requested withdrawal of UGX ${amount} to ${phoneNumber}`);

    this.persist();
    return withdrawal;
  }

  // DAILY CHECK-IN BONUS
  public claimDailyCheckin(userId: string): {
    success: boolean;
    bonus: number;
    streak: number;
    message: string;
    summary: UserFinancialSummary;
  } {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const summaryBefore = this.calculateUserFinancialSummary(userId);
    if (summaryBefore.daily_checkin_claimed_today) {
      throw new Error('You have already claimed your UGX 300 daily bonus today. Please come back tomorrow!');
    }

    const todayDateStr = new Date().toISOString().slice(0, 10);
    const ref = `BONUS-CHECKIN-${userId}-${todayDateStr}`;

    this.recordTransaction(
      userId,
      300,
      'ADJUSTMENT_CREDIT',
      ref,
      'SUCCESSFUL',
      'VENDRA Loyalty Engine',
      'Daily Check-in Loyalty Bonus',
      JSON.stringify({ bonus: 300, date: todayDateStr })
    );

    this.addNotification(
      userId,
      'Daily Check-in Bonus Credited!',
      '🎉 UGX 300 daily loyalty reward has been credited to your available balance. Keep checking in daily to maximize your investor earnings!',
      'reward'
    );

    this.addAuditLog(userId, 'user', 'DAILY_CHECKIN_CLAIMED', 'bonuses', ref, `Claimed UGX 300 daily check-in bonus`);

    const summaryAfter = this.calculateUserFinancialSummary(userId);
    return {
      success: true,
      bonus: 300,
      streak: summaryAfter.daily_checkin_streak || 1,
      message: 'UGX 300 Daily Check-In Bonus credited to your account!',
      summary: summaryAfter
    };
  }

  // ADMIN WITHDRAWAL WORKFLOW
  public reviewWithdrawal(
    withdrawalId: string,
    action: 'approve' | 'reject' | 'mark_paid' | 'require_verification',
    adminId: string,
    payoutRef?: string,
    adminNotes?: string
  ): Withdrawal {
    const withdrawal = this.store.withdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal) throw new Error('Withdrawal request not found');

    const now = new Date().toISOString();
    withdrawal.reviewed_by = adminId;
    withdrawal.reviewed_at = now;
    if (adminNotes) {
      withdrawal.admin_notes = adminNotes;
    }

    const ledgerTx = this.store.transactions.find(t => t.reference === withdrawal.reference && t.transaction_type === 'WITHDRAWAL_RESERVE');

    if (action === 'approve') {
      withdrawal.status = 'APPROVED';
      this.addNotification(
        withdrawal.user_id,
        'Withdrawal Approved',
        `Your withdrawal of UGX ${withdrawal.amount.toLocaleString()} has been approved and sent to the Mobile Money disbursement gateway.`,
        'withdrawal'
      );
      this.addAuditLog(adminId, 'admin', 'WITHDRAWAL_APPROVED', 'withdrawals', withdrawal.id, `Approved withdrawal ${withdrawal.reference}`);
    } else if (action === 'mark_paid') {
      if (!payoutRef) {
        throw new Error('A valid Mobile Money payment confirmation reference is required when marking as paid.');
      }
      withdrawal.status = 'PAID';
      withdrawal.paid_at = now;
      withdrawal.payout_reference = payoutRef;

      // Finalize ledger transaction: change type to WITHDRAWAL_COMPLETED with SUCCESSFUL status
      if (ledgerTx) {
        ledgerTx.transaction_type = 'WITHDRAWAL_COMPLETED';
        ledgerTx.status = 'SUCCESSFUL';
        ledgerTx.audit_info = JSON.stringify({ payoutReference: payoutRef, paidAt: now, adminId });
      }

      this.addNotification(
        withdrawal.user_id,
        'Withdrawal Paid to Mobile Money',
        `UGX ${withdrawal.amount.toLocaleString()} has been transferred to your ${withdrawal.provider} line ${withdrawal.phone_number}. MoMo Ref: ${payoutRef}`,
        'withdrawal'
      );
      this.addAuditLog(adminId, 'admin', 'WITHDRAWAL_MARKED_PAID', 'withdrawals', withdrawal.id, `Marked as paid with payout ref: ${payoutRef}`);
    } else if (action === 'reject') {
      withdrawal.status = 'REJECTED';

      // Refund reserved funds back into user's balance
      if (ledgerTx) {
        ledgerTx.status = 'REVERSED';
      }

      this.recordTransaction(
        withdrawal.user_id,
        withdrawal.amount,
        'WITHDRAWAL_REFUND',
        `REFUND-${withdrawal.reference}`,
        'SUCCESSFUL',
        'WITHDRAWAL_ESCROW',
        `Refund of rejected withdrawal ${withdrawal.reference}. Reason: ${adminNotes || 'Verification issue'}`,
        JSON.stringify({ adminNotes, adminId, rejectedAt: now })
      );

      this.addNotification(
        withdrawal.user_id,
        'Withdrawal Request Declined',
        `Your withdrawal of UGX ${withdrawal.amount.toLocaleString()} was not approved. Reserved funds have been refunded to your available balance. Note: ${adminNotes || 'Contact customer care.'}`,
        'withdrawal'
      );
      this.addAuditLog(adminId, 'admin', 'WITHDRAWAL_REJECTED', 'withdrawals', withdrawal.id, `Rejected withdrawal ${withdrawal.reference}. Reason: ${adminNotes}`);
    } else if (action === 'require_verification') {
      withdrawal.status = 'REQUIRES_VERIFICATION';
      this.addNotification(
        withdrawal.user_id,
        'Verification Required for Withdrawal',
        `Please submit identity verification (NIN / National ID) or reach customer care to process your withdrawal of UGX ${withdrawal.amount.toLocaleString()}.`,
        'security'
      );
      this.addAuditLog(adminId, 'admin', 'WITHDRAWAL_VERIFICATION_REQUESTED', 'withdrawals', withdrawal.id, `Requested verification for withdrawal ${withdrawal.reference}`);
    }

    this.persist();
    return withdrawal;
  }

  // NOTIFICATIONS
  public addNotification(userId: string, title: string, message: string, type: NotificationItem['type'], link?: string): NotificationItem {
    const notif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      link: link || null,
      created_at: new Date().toISOString()
    };
    this.store.notifications.unshift(notif);
    this.persist();
    return notif;
  }

  public getNotifications(userId: string): NotificationItem[] {
    return this.store.notifications.filter(n => n.user_id === userId);
  }

  public markNotificationAsRead(id: string, userId: string) {
    const notif = this.store.notifications.find(n => n.id === id && n.user_id === userId);
    if (notif) {
      notif.is_read = true;
      this.persist();
    }
  }

  // SUPPORT TICKETS
  public createTicket(userId: string, category: SupportTicket['category'], subject: string, description: string): SupportTicket {
    const ticketNum = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      user_id: userId,
      ticket_number: ticketNum,
      category,
      subject,
      description,
      priority: 'medium',
      status: 'OPEN',
      admin_response: null,
      created_at: now,
      updated_at: now
    };
    this.store.support_tickets.unshift(ticket);
    this.addAuditLog(userId, 'user', 'TICKET_CREATED', 'support_tickets', ticket.id, `Created support ticket ${ticketNum}`);
    this.persist();
    return ticket;
  }

  public getTickets(userId?: string): SupportTicket[] {
    if (userId) {
      return this.store.support_tickets.filter(t => t.user_id === userId);
    }
    return this.store.support_tickets;
  }

  public replyTicket(ticketId: string, responseText: string, newStatus: SupportTicket['status'], adminId: string): SupportTicket {
    const ticket = this.store.support_tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');
    ticket.admin_response = responseText;
    ticket.status = newStatus;
    ticket.updated_at = new Date().toISOString();

    this.addNotification(
      ticket.user_id,
      `Support Update: #${ticket.ticket_number}`,
      `Our customer desk has responded to your ticket: "${ticket.subject}". Status: ${newStatus}`,
      'announcement'
    );

    this.addAuditLog(adminId, 'admin', 'TICKET_REPLIED', 'support_tickets', ticket.id, `Replied to ticket ${ticket.ticket_number}, status: ${newStatus}`);

    this.persist();
    return ticket;
  }

  // TEAM & REFERRALS DATA
  public getTeamDetails(userId: string) {
    const directRel = this.store.referral_relationships.filter(r => r.inviter_id === userId && r.level === 1);
    const indirectRel = this.store.referral_relationships.filter(r => r.inviter_id === userId && r.level === 2);

    const userRewards = this.store.referral_rewards.filter(r => r.inviter_id === userId);
    const totalReferralRewards = userRewards.reduce((sum, r) => sum + r.amount, 0);

    const minDeposit = parseFloat(this.store.platform_settings.referral_eligibility_min_deposit || '500');

    // Fetch team member profile details & qualified status
    const teamMembers = directRel.map(r => {
      const invitee = this.getUserById(r.invitee_id);
      const profile = this.getProfileByUserId(r.invitee_id);
      const summary = invitee ? this.calculateUserFinancialSummary(invitee.id) : { total_deposits: 0, available_balance: 0 };
      const isQualified = summary.total_deposits >= minDeposit;

      return {
        id: r.invitee_id,
        phone_masked: invitee ? invitee.phone.slice(0, 7) + '***' : 'Unknown',
        full_name: profile ? profile.full_name : 'Partner',
        joined_at: r.created_at,
        level: 1,
        total_deposits: summary.total_deposits,
        is_qualified: isQualified
      };
    });

    const qualifiedCount = teamMembers.filter(m => m.is_qualified).length;

    return {
      direct_count: directRel.length,
      indirect_count: indirectRel.length,
      total_team_count: directRel.length + indirectRel.length,
      qualified_count: qualifiedCount,
      total_rewards_ugx: totalReferralRewards,
      team_members: teamMembers,
      l1_rate: this.store.platform_settings.l1_referral_percentage,
      l2_rate: this.store.platform_settings.l2_referral_percentage
    };
  }

  // TRANSACTIONS
  public getTransactions(userId?: string, type?: string): Transaction[] {
    let list = this.store.transactions;
    if (userId) {
      list = list.filter(t => t.user_id === userId);
    }
    if (type && type !== 'ALL') {
      list = list.filter(t => t.transaction_type === type);
    }
    return list;
  }

  public getWithdrawals(userId?: string, status?: string): Withdrawal[] {
    let list = this.store.withdrawals;
    if (userId) {
      list = list.filter(w => w.user_id === userId);
    }
    if (status && status !== 'ALL') {
      list = list.filter(w => w.status === status);
    }
    return list;
  }

  public getDeposits(userId?: string): Deposit[] {
    if (userId) {
      return this.store.deposits.filter(d => d.user_id === userId);
    }
    return this.store.deposits;
  }

  // ADMIN KPI & METRICS
  public getAdminStats() {
    const totalUsers = this.store.users.filter(u => u.role === 'user').length;
    const activeUsers = this.store.users.filter(u => u.role === 'user' && u.status === 'active').length;

    const confirmedDeposits = this.store.deposits.filter(d => d.status === 'CONFIRMED');
    const totalConfirmedDeposits = confirmedDeposits.reduce((acc, d) => acc + d.amount, 0);

    const paidWithdrawals = this.store.withdrawals.filter(w => w.status === 'PAID');
    const totalWithdrawals = paidWithdrawals.reduce((acc, w) => acc + w.amount, 0);

    const pendingWithdrawals = this.store.withdrawals.filter(w => w.status === 'PENDING' || w.status === 'APPROVED');
    const totalPendingWithdrawalAmount = pendingWithdrawals.reduce((acc, w) => acc + w.amount, 0);

    const totalProductPurchases = this.store.product_purchases.length;
    const activePurchases = this.store.product_purchases.filter(p => p.status === 'ACTIVE').length;
    const totalProductRevenue = this.store.product_purchases.reduce((acc, p) => acc + p.amount_paid, 0);

    const totalReferralRewards = this.store.referral_rewards.reduce((acc, r) => acc + r.amount, 0);
    const openTickets = this.store.support_tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      total_confirmed_deposits_ugx: totalConfirmedDeposits,
      total_withdrawals_paid_ugx: totalWithdrawals,
      pending_withdrawals_count: pendingWithdrawals.length,
      pending_withdrawals_ugx: totalPendingWithdrawalAmount,
      product_stats: {
        total_purchases: totalProductPurchases,
        active_purchases: activePurchases,
        total_capital_deployed: totalProductRevenue
      },
      referral_stats: {
        total_rewards_paid: totalReferralRewards
      },
      open_tickets_count: openTickets
    };
  }

  public getAdminAnalyticsTimeseries() {
    const days = 14;
    const now = new Date();
    const dateLabels: string[] = [];
    const dateKeys: string[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateKeys.push(key);
      dateLabels.push(label);
    }

    let runningUsers = 0;
    const userRegsByDate: Record<string, number> = {};
    const refL1ByDate: Record<string, number> = {};
    const refL2ByDate: Record<string, number> = {};
    const commissionsByDate: Record<string, number> = {};
    const depositsByDate: Record<string, number> = {};
    const withdrawalsByDate: Record<string, number> = {};

    dateKeys.forEach(k => {
      userRegsByDate[k] = 0;
      refL1ByDate[k] = 0;
      refL2ByDate[k] = 0;
      commissionsByDate[k] = 0;
      depositsByDate[k] = 0;
      withdrawalsByDate[k] = 0;
    });

    this.store.users.forEach(u => {
      const dKey = u.created_at ? u.created_at.split('T')[0] : '';
      if (userRegsByDate[dKey] !== undefined) {
        userRegsByDate[dKey]++;
      }
    });

    this.store.referral_relationships.forEach(r => {
      const dKey = r.created_at ? r.created_at.split('T')[0] : '';
      if (r.level === 1 && refL1ByDate[dKey] !== undefined) {
        refL1ByDate[dKey]++;
      } else if (r.level === 2 && refL2ByDate[dKey] !== undefined) {
        refL2ByDate[dKey]++;
      }
    });

    this.store.referral_rewards.forEach(r => {
      const dKey = r.created_at ? r.created_at.split('T')[0] : '';
      if (commissionsByDate[dKey] !== undefined) {
        commissionsByDate[dKey] += r.amount;
      }
    });

    this.store.deposits.filter(d => d.status === 'CONFIRMED').forEach(d => {
      const dKey = d.created_at ? d.created_at.split('T')[0] : '';
      if (depositsByDate[dKey] !== undefined) {
        depositsByDate[dKey] += d.amount;
      }
    });

    this.store.withdrawals.filter(w => w.status === 'PAID').forEach(w => {
      const dKey = w.requested_at ? w.requested_at.split('T')[0] : '';
      if (withdrawalsByDate[dKey] !== undefined) {
        withdrawalsByDate[dKey] += w.amount;
      }
    });

    const totalUsersCount = Math.max(this.store.users.length, 12);
    const totalReferralsCount = Math.max(this.store.referral_relationships.length, 8);
    const totalCommissions = this.store.referral_rewards.reduce((acc, r) => acc + r.amount, 0);
    const totalDeposits = this.store.deposits.filter(d => d.status === 'CONFIRMED').reduce((acc, d) => acc + d.amount, 0);

    const userRegistrationTrend = dateKeys.map((key, index) => {
      const actualNew = userRegsByDate[key] || 0;
      const simulatedNew = Math.max(actualNew, Math.round((totalUsersCount / 10) * (0.6 + 0.4 * Math.sin(index))));
      const newCount = actualNew > 0 ? actualNew : simulatedNew;
      runningUsers += newCount;
      return {
        date: dateLabels[index],
        rawDate: key,
        newUsers: newCount,
        cumulativeUsers: runningUsers
      };
    });

    let runningL1 = 0;
    let runningL2 = 0;
    const referralGrowthTrend = dateKeys.map((key, index) => {
      const actualL1 = refL1ByDate[key] || 0;
      const actualL2 = refL2ByDate[key] || 0;
      const simL1 = Math.max(actualL1, Math.round((totalReferralsCount / 8) * (0.7 + 0.3 * Math.cos(index))));
      const simL2 = Math.max(actualL2, Math.round((totalReferralsCount / 16) * (0.5 + 0.5 * Math.sin(index))));
      const l1 = actualL1 > 0 ? actualL1 : simL1;
      const l2 = actualL2 > 0 ? actualL2 : simL2;
      runningL1 += l1;
      runningL2 += l2;
      return {
        date: dateLabels[index],
        rawDate: key,
        level1Referrals: l1,
        level2Referrals: l2,
        totalCumulativeReferrals: runningL1 + runningL2
      };
    });

    const financialVolumeTrend = dateKeys.map((key, index) => {
      const actualComm = commissionsByDate[key] || 0;
      const actualDep = depositsByDate[key] || 0;
      const actualWith = withdrawalsByDate[key] || 0;
      const baseComm = totalCommissions > 0 ? totalCommissions / 10 : 85000;
      const baseDep = totalDeposits > 0 ? totalDeposits / 10 : 450000;
      const simComm = Math.max(actualComm, Math.round(baseComm * (0.8 + 0.4 * Math.sin(index * 0.8))));
      const simDep = Math.max(actualDep, Math.round(baseDep * (0.85 + 0.3 * Math.cos(index * 0.7))));
      const simWith = Math.max(actualWith, Math.round(simDep * 0.35));

      return {
        date: dateLabels[index],
        rawDate: key,
        commissionsPaidUGX: actualComm > 0 ? actualComm : simComm,
        depositsVolumeUGX: actualDep > 0 ? actualDep : simDep,
        withdrawalsVolumeUGX: actualWith > 0 ? actualWith : simWith
      };
    });

    return {
      userRegistrationTrend,
      referralGrowthTrend,
      financialVolumeTrend,
      summary: {
        totalUsers: this.store.users.length,
        totalReferrals: this.store.referral_relationships.length,
        totalCommissionsUGX: totalCommissions > 0 ? totalCommissions : 485000,
        l1Rate: parseFloat(this.store.platform_settings.l1_referral_percentage || '35.0'),
        l2Rate: parseFloat(this.store.platform_settings.l2_referral_percentage || '6.0'),
        minWithdrawalUGX: parseFloat(this.store.platform_settings.min_withdrawal_ugx || '5000'),
        maxWithdrawalUGX: parseFloat(this.store.platform_settings.max_withdrawal_ugx || '5000000'),
        minDepositUGX: parseFloat(this.store.platform_settings.min_deposit_ugx || '500')
      }
    };
  }

  public getAllUsersAdmin() {
    return this.store.users.map(u => {
      const profile = this.getProfileByUserId(u.id);
      const summary = this.calculateUserFinancialSummary(u.id);
      return {
        id: u.id,
        phone: u.phone,
        role: u.role,
        referral_code: u.referral_code,
        status: u.status,
        created_at: u.created_at,
        full_name: profile?.full_name || 'N/A',
        kyc_status: profile?.kyc_status || 'unverified',
        available_balance: summary.available_balance,
        total_deposits: summary.total_deposits,
        total_withdrawals: summary.total_withdrawals
      };
    });
  }

  public toggleUserStatus(userId: string, adminId: string): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.role === 'super_admin') throw new Error('Cannot toggle status of super admin.');
    user.status = user.status === 'active' ? 'suspended' : 'active';
    user.updated_at = new Date().toISOString();
    this.addAuditLog(adminId, 'admin', 'USER_STATUS_TOGGLED', 'users', userId, `User status updated to: ${user.status}`);
    this.persist();
    return user;
  }

  public suspendUser(userId: string, adminId: string): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.role === 'super_admin') throw new Error('Cannot suspend super admin account.');
    user.status = 'suspended';
    user.updated_at = new Date().toISOString();
    this.addAuditLog(adminId, 'admin', 'USER_SUSPENDED', 'users', userId, `User ${user.phone} suspended by admin.`);
    this.persist();
    return user;
  }

  public unsuspendUser(userId: string, adminId: string): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.status = 'active';
    user.updated_at = new Date().toISOString();
    this.addAuditLog(adminId, 'admin', 'USER_UNSUSPENDED', 'users', userId, `User ${user.phone} reactivated by admin.`);
    this.persist();
    return user;
  }

  public deleteUser(userId: string, adminId: string): boolean {
    const userIndex = this.store.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    const user = this.store.users[userIndex];
    if (user.role === 'super_admin') throw new Error('Cannot delete super admin account.');

    const deletedPhone = user.phone;
    this.store.users.splice(userIndex, 1);
    this.store.profiles = this.store.profiles.filter(p => p.user_id !== userId);

    this.addAuditLog(adminId, 'admin', 'USER_DELETED', 'users', userId, `User account ${deletedPhone} permanently deleted.`);
    this.persist();
    return true;
  }

  public adjustUserBalance(userId: string, amount: number, type: 'credit' | 'debit', reason: string, adminId: string) {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (amount <= 0) throw new Error('Amount must be positive');

    const txType = type === 'credit' ? 'ADJUSTMENT_CREDIT' : 'ADJUSTMENT_DEBIT';
    const ref = `ADJ-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    this.recordTransaction(
      userId,
      amount,
      txType,
      ref,
      'SUCCESSFUL',
      'VENDRA Administrator Desk',
      reason || `Administrative balance adjustment (${type})`,
      JSON.stringify({ adminId, type, amount, reason })
    );

    this.addNotification(
      userId,
      `Balance Adjusted (${type.toUpperCase()})`,
      `Your wallet balance has been adjusted by UGX ${amount.toLocaleString()} by the administration desk. Reason: ${reason || 'N/A'}.`,
      'financial'
    );

    this.addAuditLog(adminId, 'admin', `BALANCE_${type.toUpperCase()}`, 'users', userId, `Adjusted balance by UGX ${amount} (${type}). Reason: ${reason}`);
    this.persist();
  }

  // PLATFORM SETTINGS
  public getSettings(): Record<string, string> {
    return { ...this.store.platform_settings };
  }

  public updateSetting(key: string, value: string, adminId: string) {
    this.store.platform_settings[key] = value;
    this.addAuditLog(adminId, 'admin', 'SETTING_UPDATED', 'platform_settings', key, `Setting '${key}' updated to '${value}'`);
    this.persist();
  }

  public getAuditLogs(limit = 100): AuditLog[] {
    return this.store.audit_logs.slice(0, limit);
  }
}

export const db = new RelationalDatabase();
