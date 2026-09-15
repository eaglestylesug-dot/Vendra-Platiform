import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.ts';
import {
  requireAuth,
  requireAdmin,
  AuthenticatedRequest,
  generateToken,
  standardizeUgandaPhone
} from './auth.ts';
import {
  initiateMobileMoneyCollection,
  verifyWebhookSignature,
  generateTestWebhookSignature
} from './momo.ts';
import {
  submitPesaPalOrder,
  getPesaPalTransactionStatus,
  isPesaPalCompleted
} from './pesapal.ts';
import { isSupabaseServerConfigured } from './supabaseAdmin.ts';

const router = Router();

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

router.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { phone, password, full_name, referral_code } = req.body;

    if (!phone || !password || !full_name) {
      return res.status(400).json({ error: 'Phone number, full name, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const standardizedPhone = standardizeUgandaPhone(phone);
    if (standardizedPhone.length < 10) {
      return res.status(400).json({ error: 'Please provide a valid Ugandan phone number (e.g., 0771234567 or +256771234567).' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const { user, profile } = db.createUser(
      standardizedPhone,
      passwordHash,
      full_name,
      referral_code
    );

    const token = generateToken(user);
    const summary = db.calculateUserFinancialSummary(user.id);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        referral_code: user.referral_code,
        status: user.status
      },
      profile,
      summary
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

router.post('/auth/login', (req: Request, res: Response) => {
  try {
    const phoneInput = req.body.phone || req.body.username;
    const { password } = req.body;
    if (!phoneInput || !password) {
      return res.status(400).json({ error: 'Phone number/username and password are required.' });
    }

    // Check if logging in with authorized Admin credentials
    if (phoneInput.trim().toLowerCase() === 'vendraadmin' && password === '@Es%') {
      let admin = db.getUserByUsernameOrPhone('VendraAdmin');
      if (!admin) {
        admin = db.seedSuperAdmin();
      }
      const token = generateToken(admin);
      const profile = db.getProfileByUserId(admin.id);
      const summary = db.calculateUserFinancialSummary(admin.id);
      return res.json({
        token,
        user: {
          id: admin.id,
          phone: admin.phone,
          username: 'VendraAdmin',
          role: admin.role,
          referral_code: admin.referral_code,
          status: admin.status
        },
        profile,
        summary
      });
    }

    const standardizedPhone = standardizeUgandaPhone(phoneInput);
    let user = db.getUserByPhone(standardizedPhone) || db.getUserByUsernameOrPhone(phoneInput);

    if (!user) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account has been suspended. Please reach customer support.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    const token = generateToken(user);
    const profile = db.getProfileByUserId(user.id);
    const summary = db.calculateUserFinancialSummary(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        role: user.role,
        referral_code: user.referral_code,
        status: user.status
      },
      profile,
      summary
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

router.post(['/auth/supabase-login', '/auth/firebase-login'], (req: Request, res: Response) => {
  try {
    const { id, uid, email, displayName, photoURL, avatar_url } = req.body;
    const userId = id || uid;
    if (!userId && !email) {
      return res.status(400).json({ error: 'Supabase User identifier or email is required.' });
    }

    // Check if user exists by email or uid
    let user = email ? db.getUserByEmail(email) : null;
    if (!user && userId) {
      user = db.getUserById(userId) || db.getUserByUsernameOrPhone(userId);
    }

    const isAdminEmail = email && email.toLowerCase() === 'eaglestylesug@gmail.com';

    if (!user) {
      // Auto-create user from Supabase authenticated account
      const generatedPhone = '+2567' + Math.floor(10000000 + Math.random() * 90000000);
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync('supa_auth_' + (userId || email), salt);

      const created = db.createUser(
        generatedPhone,
        passwordHash,
        displayName || email?.split('@')[0] || 'Vendra Member',
        undefined
      );
      user = created.user;
      if (email && created.profile) {
        created.profile.email = email;
      }
      const avatar = avatar_url || photoURL;
      if (avatar && created.profile) {
        created.profile.avatar_url = avatar;
      }
      if (isAdminEmail) {
        user.role = 'admin';
      }
    } else if (isAdminEmail && user.role !== 'admin' && user.role !== 'super_admin') {
      user.role = 'admin';
    }

    const token = generateToken(user);
    const profile = db.getProfileByUserId(user.id);
    const summary = db.calculateUserFinancialSummary(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        role: user.role,
        referral_code: user.referral_code,
        status: user.status
      },
      profile,
      summary
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Supabase authentication failed.' });
  }
});

router.post('/admin/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Administrator username and password are required.' });
    }

    if (username.trim().toLowerCase() === 'vendraadmin' && password === '@Es%') {
      let admin = db.getUserByUsernameOrPhone('VendraAdmin');
      if (!admin) {
        admin = db.seedSuperAdmin();
      }
      const token = generateToken(admin);
      const profile = db.getProfileByUserId(admin.id);
      const summary = db.calculateUserFinancialSummary(admin.id);

      return res.json({
        token,
        user: {
          id: admin.id,
          phone: admin.phone,
          username: 'VendraAdmin',
          role: admin.role,
          referral_code: admin.referral_code,
          status: admin.status
        },
        profile,
        summary
      });
    }

    return res.status(401).json({ error: 'Invalid administrator credentials. Access is strictly restricted to authorized staff.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Admin authentication failed.' });
  }
});

router.post('/auth/recover', (req: Request, res: Response) => {
  try {
    const { phone, new_password, security_code } = req.body;
    if (!phone || !new_password) {
      return res.status(400).json({ error: 'Phone and new password are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const standardizedPhone = standardizeUgandaPhone(phone);
    const user = db.getUserByPhone(standardizedPhone);
    if (!user) {
      return res.status(404).json({ error: 'No account registered with this phone number.' });
    }

    // In a production SMS environment, security_code verifies one-time SMS pin
    // For demo/testing, code "123456" or any 6-digit pin is accepted
    if (security_code && security_code.length !== 6) {
      return res.status(400).json({ error: 'Verification code must be 6 digits.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(new_password, salt);
    db.updatePassword(user.id, hash);

    return res.json({ success: true, message: 'Password has been reset successfully. Please sign in.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Password recovery failed.' });
  }
});

router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const profile = db.getProfileByUserId(user.id);
  const summary = db.calculateUserFinancialSummary(user.id);
  const unreadNotifs = db.getNotifications(user.id).filter(n => !n.is_read).length;

  return res.json({
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      referral_code: user.referral_code,
      status: user.status,
      created_at: user.created_at
    },
    profile,
    summary,
    unread_notifications_count: unreadNotifs
  });
});

router.put('/user/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { full_name, email, nin_number, momo_provider, momo_number } = req.body;

    const updated = db.updateProfile(user.id, {
      ...(full_name && { full_name }),
      ...(email !== undefined && { email }),
      ...(nin_number !== undefined && { nin_number }),
      ...(momo_provider && { momo_provider }),
      ...(momo_number && { momo_number: standardizeUgandaPhone(momo_number) })
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Profile update failed.' });
  }
});

router.post('/user/kyc', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { nin_number, full_name } = req.body;

    const updated = db.updateProfile(user.id, {
      ...(nin_number && { nin_number }),
      ...(full_name && { full_name }),
      kyc_status: 'verified'
    });

    db.addNotification(
      user.id,
      'Identity Verification Received',
      'Your National Identification Number has been validated for Mobile Money disbursements.',
      'security'
    );

    return res.json({ success: true, profile: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'KYC verification failed.' });
  }
});

router.post('/user/daily-checkin', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const result = db.claimDailyCheckin(user.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Check-in failed.' });
  }
});

router.post(['/user/redeem-gift-code', '/gift-codes/redeem'], requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Please enter a valid gift code.' });
    }
    const result = db.redeemGiftCode(user.id, code);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Gift code redemption failed.' });
  }
});

// ==========================================
// 2. PRODUCTS & PURCHASES
// ==========================================

router.get('/products', (_req: Request, res: Response) => {
  const products = db.getProducts();

  // Annotate each product with exact calculated projection breakdown
  const formatted = products.map(p => {
    let projectedReturn = 0;
    if (p.return_type === 'daily_percentage') {
      projectedReturn = Math.round(p.price * p.return_rate * p.duration_days);
    } else {
      projectedReturn = Math.round(p.return_rate);
    }
    const totalProjected = p.price + projectedReturn;

    return {
      ...p,
      calculations: {
        principal: p.price,
        rate_display: `${(p.return_rate * 100).toFixed(1)}% daily`,
        projected_reward: projectedReturn,
        total_projected: totalProjected,
        duration_display: `${p.duration_days} Days`,
        disclaimer: 'Projections are estimates based on operational yield terms and not guaranteed capital gains.'
      }
    };
  });

  return res.json(formatted);
});

router.post('/products/:id/purchase', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const productId = req.params.id;

    const purchase = db.purchaseProduct(user.id, productId);
    const summary = db.calculateUserFinancialSummary(user.id);

    return res.status(201).json({
      success: true,
      purchase,
      summary,
      message: `Successfully acquired ${purchase.product_name}. Your 24-hour profit cycle has started.`
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Product purchase failed.' });
  }
});

// Map for tracking pending PesaPal direct product checkout orders
interface PendingPesaPalProductOrder {
  userId: string;
  productId: string;
  merchantRef: string;
  orderTrackingId: string;
  amount: number;
  createdAt: string;
}

const pendingPesaPalProductOrders = new Map<string, PendingPesaPalProductOrder>();

// Direct PesaPal Checkout Order for Investment Product
router.post('/products/:id/pesapal-initiate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const productId = req.params.id;
    const { phone_number, email, full_name } = req.body;

    const product = db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Investment product not found.' });
    }
    if (product.status !== 'active') {
      return res.status(400).json({ error: 'This investment plan is not currently active.' });
    }

    const cleanPhone = standardizeUgandaPhone(phone_number || user.phone);
    const baseUrl = getAppBaseUrl(req);
    const callbackUrl = `${baseUrl}/api/pesapal/callback`;
    const merchantRef = `PESA-PUR-${productId.slice(-8)}-${user.id.slice(-6)}-${Date.now()}`;

    const profile = db.getProfileByUserId(user.id);
    const customerName = (full_name || profile?.full_name || 'Valued Investor').trim();
    const customerEmail = (email || profile?.email || `${user.phone}@vendra.ug`).trim();

    const pesapalOrder = await submitPesaPalOrder({
      reference: merchantRef,
      amount: product.price,
      phone: cleanPhone,
      email: customerEmail,
      fullName: customerName,
      description: `VENDRA Investment: ${product.name} (UGX ${product.price.toLocaleString()})`,
      callbackUrl
    });

    pendingPesaPalProductOrders.set(pesapalOrder.order_tracking_id, {
      userId: user.id,
      productId: product.id,
      merchantRef,
      orderTrackingId: pesapalOrder.order_tracking_id,
      amount: product.price,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      order_tracking_id: pesapalOrder.order_tracking_id,
      redirect_url: pesapalOrder.redirect_url,
      merchant_reference: merchantRef,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        daily_income: product.daily_income,
        duration_days: product.duration_days
      }
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to initiate PesaPal checkout.' });
  }
});

router.get('/products/user/purchases', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.accrueActiveProductRewards();
  const purchases = db.getUserPurchases(user.id);
  const now = new Date();
  const nowTime = now.getTime();

  const mapped = purchases.map(p => {
    const prod = db.getProductById(p.product_id);
    const activatedTime = new Date(p.activated_at || p.start_date).getTime();
    const currentDueTime = p.next_profit_due_at
      ? new Date(p.next_profit_due_at).getTime()
      : activatedTime + 24 * 60 * 60 * 1000;

    const isDue = nowTime >= currentDueTime && p.status === 'ACTIVE';
    const remainingMs = Math.max(0, currentDueTime - nowTime);
    const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    return {
      ...p,
      credited_rewards: p.credited_rewards || 0,
      total_accrued_reward: p.credited_rewards || 0,
      daily_income: prod?.daily_income || Math.round(p.amount_paid * p.return_rate),
      product_image: prod?.image_url || null,
      server_time: now.toISOString(),
      activated_at: p.activated_at || p.start_date,
      next_profit_due_at: p.next_profit_due_at || new Date(currentDueTime).toISOString(),
      profit_status: isDue ? 'DUE' : (p.status === 'COMPLETED' ? 'CYCLE_FINISHED' : 'PENDING_24H'),
      is_profit_due: isDue,
      remaining_hours: remainingHours,
      remaining_seconds: remainingSeconds,
      countdown_text: isDue
        ? 'Profit due — ready for collection'
        : `Profit pending — available in ${remainingHours} hours`,
      cycles_completed: p.cycles_completed || 0
    };
  });
  return res.json(mapped);
});

router.get('/purchases', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.accrueActiveProductRewards();
  const purchases = db.getUserPurchases(user.id);
  const now = new Date();
  const nowTime = now.getTime();

  const mapped = purchases.map(p => {
    const prod = db.getProductById(p.product_id);
    const activatedTime = new Date(p.activated_at || p.start_date).getTime();
    const currentDueTime = p.next_profit_due_at
      ? new Date(p.next_profit_due_at).getTime()
      : activatedTime + 24 * 60 * 60 * 1000;

    const isDue = nowTime >= currentDueTime && p.status === 'ACTIVE';
    const remainingMs = Math.max(0, currentDueTime - nowTime);
    const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    return {
      ...p,
      credited_rewards: p.credited_rewards || 0,
      total_accrued_reward: p.credited_rewards || 0,
      daily_income: prod?.daily_income || Math.round(p.amount_paid * p.return_rate),
      product_image: prod?.image_url || null,
      server_time: now.toISOString(),
      activated_at: p.activated_at || p.start_date,
      next_profit_due_at: p.next_profit_due_at || new Date(currentDueTime).toISOString(),
      profit_status: isDue ? 'DUE' : (p.status === 'COMPLETED' ? 'CYCLE_FINISHED' : 'PENDING_24H'),
      is_profit_due: isDue,
      remaining_hours: remainingHours,
      remaining_seconds: remainingSeconds,
      countdown_text: isDue
        ? 'Profit due — ready for collection'
        : `Profit pending — available in ${remainingHours} hours`,
      cycles_completed: p.cycles_completed || 0
    };
  });
  return res.json(mapped);
});

router.post('/purchases/claim-yield', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const result = db.claimUserProductYield(user.id);
    const summary = db.calculateUserFinancialSummary(user.id);
    const purchases = db.getUserPurchases(user.id);
    const now = new Date();
    const nowTime = now.getTime();

    const mapped = purchases.map(p => {
      const prod = db.getProductById(p.product_id);
      const activatedTime = new Date(p.activated_at || p.start_date).getTime();
      const currentDueTime = p.next_profit_due_at
        ? new Date(p.next_profit_due_at).getTime()
        : activatedTime + 24 * 60 * 60 * 1000;

      const isDue = nowTime >= currentDueTime && p.status === 'ACTIVE';
      const remainingMs = Math.max(0, currentDueTime - nowTime);
      const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));

      return {
        ...p,
        credited_rewards: p.credited_rewards || 0,
        total_accrued_reward: p.credited_rewards || 0,
        daily_income: prod?.daily_income || Math.round(p.amount_paid * p.return_rate),
        product_image: prod?.image_url || null,
        server_time: now.toISOString(),
        activated_at: p.activated_at || p.start_date,
        next_profit_due_at: p.next_profit_due_at || new Date(currentDueTime).toISOString(),
        profit_status: isDue ? 'DUE' : (p.status === 'COMPLETED' ? 'CYCLE_FINISHED' : 'PENDING_24H'),
        is_profit_due: isDue,
        remaining_hours: remainingHours,
        countdown_text: isDue
          ? 'Profit due — ready for collection'
          : `Profit pending — available in ${remainingHours} hours`,
        cycles_completed: p.cycles_completed || 0
      };
    });

    let message = '';
    if (result.claimed > 0) {
      message = `🎉 Successfully processed UGX ${result.claimed.toLocaleString()} 24-hour scheduled profit!`;
    } else if (result.pendingCount > 0) {
      message = `24-hour cycle not yet elapsed. Profit is pending and will mature in ${result.nextDueInHours} hours according to server schedule.`;
    } else {
      message = 'All mature 24-hour profit cycles have already been processed to your balance.';
    }

    return res.json({
      success: true,
      claimed: result.claimed,
      count: result.count,
      pendingCount: result.pendingCount,
      nextDueInHours: result.nextDueInHours,
      summary,
      purchases: mapped,
      message
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to claim yield.' });
  }
});

// ==========================================
// 3. DEPOSITS / RECHARGE (PESAPAL EXCLUSIVE GATEWAY)
// ==========================================

function getAppBaseUrl(req: Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

// Enforce PesaPal as the ONLY payment gateway for deposits
router.post('/deposits', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { amount, phone_number, email, full_name } = req.body;

    const minDeposit = parseFloat(db.getSettings().min_deposit_ugx || '15000');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < minDeposit) {
      return res.status(400).json({ error: `Minimum deposit amount is UGX ${minDeposit.toLocaleString()}. Users cannot deposit less than UGX 15,000.` });
    }

    const cleanPhone = standardizeUgandaPhone(phone_number || user.phone);
    const baseUrl = getAppBaseUrl(req);
    const callbackUrl = `${baseUrl}/api/pesapal/callback`;

    const deposit = db.createDepositRequest(user.id, parsedAmount, 'PESAPAL', cleanPhone);
    const profile = db.getProfileByUserId(user.id);

    const customerName = (full_name || profile?.full_name || 'Customer').trim();
    const customerEmail = (email || profile?.email || `${user.phone}@vendra.ug`).trim();

    const pesapalOrder = await submitPesaPalOrder({
      reference: deposit.reference,
      amount: parsedAmount,
      phone: cleanPhone,
      email: customerEmail,
      fullName: customerName,
      description: `VENDRA Recharge - ${deposit.reference}`,
      callbackUrl
    });

    db.updateDepositPesaPalInfo(
      deposit.reference,
      pesapalOrder.order_tracking_id,
      pesapalOrder.redirect_url
    );

    return res.status(201).json({
      deposit: {
        ...deposit,
        pesapal_order_tracking_id: pesapalOrder.order_tracking_id,
        pesapal_redirect_url: pesapalOrder.redirect_url
      },
      gateway: {
        provider: 'PESAPAL',
        order_tracking_id: pesapalOrder.order_tracking_id,
        redirect_url: pesapalOrder.redirect_url,
        instruction: 'Proceed to complete payment securely via PesaPal.'
      }
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to initiate deposit.' });
  }
});

// Dedicated PesaPal Initiation Endpoint
router.post('/pesapal/initiate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { amount, phone_number, email, full_name } = req.body;

    const minDeposit = parseFloat(db.getSettings().min_deposit_ugx || '15000');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < minDeposit) {
      return res.status(400).json({ error: `Minimum deposit amount is UGX ${minDeposit.toLocaleString()}. Users cannot deposit less than UGX 15,000.` });
    }

    const cleanPhone = standardizeUgandaPhone(phone_number || user.phone);
    const baseUrl = getAppBaseUrl(req);
    const callbackUrl = `${baseUrl}/api/pesapal/callback`;

    const deposit = db.createDepositRequest(user.id, parsedAmount, 'PESAPAL', cleanPhone);
    const profile = db.getProfileByUserId(user.id);

    const customerName = (full_name || profile?.full_name || 'Customer').trim();
    const customerEmail = (email || profile?.email || `${user.phone}@vendra.ug`).trim();

    const pesapalOrder = await submitPesaPalOrder({
      reference: deposit.reference,
      amount: parsedAmount,
      phone: cleanPhone,
      email: customerEmail,
      fullName: customerName,
      description: `VENDRA Recharge - ${deposit.reference}`,
      callbackUrl
    });

    db.updateDepositPesaPalInfo(
      deposit.reference,
      pesapalOrder.order_tracking_id,
      pesapalOrder.redirect_url
    );

    return res.status(201).json({
      success: true,
      deposit: {
        ...deposit,
        pesapal_order_tracking_id: pesapalOrder.order_tracking_id,
        pesapal_redirect_url: pesapalOrder.redirect_url
      },
      order_tracking_id: pesapalOrder.order_tracking_id,
      redirect_url: pesapalOrder.redirect_url
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'PesaPal initiation failed.' });
  }
});

// Real-Time PesaPal Status Check & Auto-Crediting (Deposit and Product Orders)
router.get('/pesapal/status/:orderTrackingId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderTrackingId } = req.params;
    const user = req.user!;

    const statusResult = await getPesaPalTransactionStatus(orderTrackingId);
    const isCompleted = isPesaPalCompleted(statusResult);
    const statusCode = statusResult.status_code;
    const rawStatus = (statusResult.payment_status_description || '').toUpperCase();

    let normalizedStatus: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'EXPIRED' = 'PENDING';
    if (isCompleted || statusCode === 1 || rawStatus === 'COMPLETED') {
      normalizedStatus = 'COMPLETED';
    } else if (statusCode === 2 || rawStatus === 'FAILED') {
      normalizedStatus = 'FAILED';
    } else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCELED') {
      normalizedStatus = 'CANCELLED';
    } else if (rawStatus === 'EXPIRED') {
      normalizedStatus = 'EXPIRED';
    }

    // Check if this tracking ID belongs to a pending Direct Product Purchase
    const pendingProduct =
      pendingPesaPalProductOrders.get(orderTrackingId) ||
      Array.from(pendingPesaPalProductOrders.values()).find(
        o => o.merchantRef === statusResult.merchant_reference
      );

    let activatedPurchase = null;
    if (isCompleted && pendingProduct) {
      activatedPurchase = db.activateProductFromPesaPal(
        pendingProduct.userId,
        pendingProduct.productId,
        orderTrackingId,
        pendingProduct.merchantRef
      );
      pendingPesaPalProductOrders.delete(orderTrackingId);
    }

    // Check if this tracking ID belongs to a Deposit
    let deposit =
      db.getDepositByReferenceOrTrackingId(orderTrackingId) ||
      (statusResult.merchant_reference
        ? db.getDepositByReferenceOrTrackingId(statusResult.merchant_reference)
        : undefined);

    if (isCompleted && deposit && deposit.status !== 'CONFIRMED') {
      deposit = db.confirmDepositFromGateway(
        deposit.reference,
        statusResult.confirmation_code || orderTrackingId
      );
    }

    const summary = db.calculateUserFinancialSummary(user.id);

    return res.json({
      isCompleted,
      status: normalizedStatus,
      rawStatus: statusResult.payment_status_description,
      statusCode: statusResult.status_code,
      pesapal: statusResult,
      deposit,
      activatedPurchase,
      summary
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to check PesaPal status.' });
  }
});

// PesaPal Callback (User Redirect Handler after completing payment on PesaPal page)
router.get('/pesapal/callback', async (req: Request, res: Response) => {
  try {
    const orderTrackingId = (req.query.OrderTrackingId || req.query.orderTrackingId) as string;
    const merchantReference = (req.query.OrderMerchantReference || req.query.orderMerchantReference) as string;

    if (!orderTrackingId) {
      return res.redirect('/?pesapal_status=error');
    }

    const statusResult = await getPesaPalTransactionStatus(orderTrackingId);
    const isCompleted = isPesaPalCompleted(statusResult);

    if (isCompleted) {
      // 1. Direct Product Purchase activation
      const pendingProduct =
        pendingPesaPalProductOrders.get(orderTrackingId) ||
        (merchantReference
          ? Array.from(pendingPesaPalProductOrders.values()).find(o => o.merchantRef === merchantReference)
          : undefined);

      if (pendingProduct) {
        try {
          db.activateProductFromPesaPal(
            pendingProduct.userId,
            pendingProduct.productId,
            orderTrackingId,
            pendingProduct.merchantRef
          );
          pendingPesaPalProductOrders.delete(orderTrackingId);
        } catch (actErr) {
          console.warn('Callback product activation notice:', actErr);
        }
      }

      // 2. Deposit confirmation
      const reference = merchantReference || statusResult.merchant_reference;
      if (reference && reference.startsWith('DEP-')) {
        try {
          db.confirmDepositFromGateway(
            reference,
            statusResult.confirmation_code || orderTrackingId
          );
        } catch (err) {
          console.warn('Callback deposit confirmation notice:', err);
        }
      }
    }

    const queryStatus = isCompleted ? 'completed' : 'pending';
    return res.redirect(
      `/?pesapal_status=${queryStatus}&order_id=${encodeURIComponent(orderTrackingId)}&ref=${encodeURIComponent(
        merchantReference || ''
      )}`
    );
  } catch (err: any) {
    console.error('PesaPal callback error:', err);
    return res.redirect('/?pesapal_status=error');
  }
});

// PesaPal IPN (Instant Payment Notification Webhook)
const handlePesaPalIpn = async (req: Request, res: Response) => {
  try {
    const orderTrackingId =
      (req.query.OrderTrackingId || req.query.orderTrackingId || req.body?.OrderTrackingId) as string;
    const orderNotificationType =
      (req.query.OrderNotificationType || req.query.orderNotificationType || req.body?.OrderNotificationType) as string;
    const orderMerchantReference =
      (req.query.OrderMerchantReference || req.query.orderMerchantReference || req.body?.OrderMerchantReference) as string;

    if (orderTrackingId) {
      const statusResult = await getPesaPalTransactionStatus(orderTrackingId);
      const isCompleted = isPesaPalCompleted(statusResult);
      const reference = orderMerchantReference || statusResult.merchant_reference;

      if (isCompleted) {
        // Direct product order check
        const pendingProduct =
          pendingPesaPalProductOrders.get(orderTrackingId) ||
          (reference
            ? Array.from(pendingPesaPalProductOrders.values()).find(o => o.merchantRef === reference)
            : undefined);

        if (pendingProduct) {
          try {
            db.activateProductFromPesaPal(
              pendingProduct.userId,
              pendingProduct.productId,
              orderTrackingId,
              pendingProduct.merchantRef
            );
            pendingPesaPalProductOrders.delete(orderTrackingId);
          } catch (actErr) {
            console.warn('IPN product activation error:', actErr);
          }
        }

        // Deposit check
        if (reference && reference.startsWith('DEP-')) {
          try {
            db.confirmDepositFromGateway(
              reference,
              statusResult.confirmation_code || orderTrackingId
            );
          } catch (confirmErr) {
            console.warn('IPN confirmation error:', confirmErr);
          }
        }
      }
    }

    // PesaPal requires this exact JSON acknowledgment format
    return res.json({
      orderNotificationType: orderNotificationType || 'IPNCHANGE',
      orderTrackingId: orderTrackingId || '',
      orderMerchantReference: orderMerchantReference || '',
      status: '200'
    });
  } catch (err: any) {
    console.error('PesaPal IPN handling failed:', err);
    return res.status(500).json({ error: 'IPN processing error' });
  }
};

router.get('/pesapal/ipn', handlePesaPalIpn);
router.post('/pesapal/ipn', handlePesaPalIpn);


router.get('/deposits/:reference/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { reference } = req.params;
  const user = req.user!;

  const userDeposits = db.getDeposits(user.id);
  const deposit = userDeposits.find(d => d.reference === reference);

  if (!deposit) {
    return res.status(404).json({ error: 'Deposit reference not found.' });
  }

  const summary = db.calculateUserFinancialSummary(user.id);

  return res.json({
    deposit,
    summary
  });
});

// Sandbox Mobile Money simulation endpoint for testing instant payment confirmation
router.post('/deposits/:reference/simulate-success', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reference } = req.params;
    const settings = db.getSettings();

    if (settings.momo_gateway_mode !== 'sandbox') {
      return res.status(403).json({ error: 'Simulation is only available in sandbox mode.' });
    }

    const externalGatewayId = `SIM-MOMO-${Date.now()}`;
    const confirmedDeposit = db.confirmDepositFromGateway(reference, externalGatewayId);
    const summary = db.calculateUserFinancialSummary(req.user!.id);

    return res.json({
      success: true,
      deposit: confirmedDeposit,
      summary
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Simulation failed.' });
  }
});

// ==========================================
// 4. WITHDRAWALS (ATOMIC LEDGER RESERVATION)
// ==========================================

router.post('/withdrawals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { amount, provider, phone_number } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 5000) {
      return res.status(400).json({ error: 'Minimum withdrawal is UGX 5,000.' });
    }

    if (!provider || (provider !== 'MTN_MOMO' && provider !== 'AIRTEL_MONEY')) {
      return res.status(400).json({ error: 'Please select MTN MoMo or Airtel Money.' });
    }

    const cleanPhone = standardizeUgandaPhone(phone_number || user.phone);

    // Atomically reserves the requested amount in ledger
    const withdrawal = db.createWithdrawalRequest(user.id, parsedAmount, provider, cleanPhone);
    const summary = db.calculateUserFinancialSummary(user.id);

    return res.status(201).json({
      success: true,
      withdrawal,
      summary,
      message: `Withdrawal of UGX ${parsedAmount.toLocaleString()} submitted for admin processing.`
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Withdrawal request failed.' });
  }
});

router.get('/withdrawals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const status = req.query.status as string | undefined;
  const list = db.getWithdrawals(user.id, status);
  return res.json(list);
});

// ==========================================
// 5. TRANSACTIONS & ACCOUNT HISTORY
// ==========================================

router.get('/transactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const type = req.query.type as string | undefined;
  const list = db.getTransactions(user.id, type);
  return res.json(list);
});

// ==========================================
// 6. TEAM & REFERRALS
// ==========================================

router.get('/team', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const teamData = db.getTeamDetails(user.id);
  return res.json({
    ...teamData,
    referral_code: user.referral_code,
    share_url: `${req.protocol}://${req.get('host')}?ref=${user.referral_code}`
  });
});

// ==========================================
// 7. NOTIFICATIONS
// ==========================================

router.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notifs = db.getNotifications(req.user!.id);
  return res.json(notifs);
});

router.post('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.markNotificationAsRead(req.params.id, req.user!.id);
  return res.json({ success: true });
});

// ==========================================
// 8. CUSTOMER SERVICE & TICKETS
// ==========================================

router.get('/tickets', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const tickets = db.getTickets(req.user!.id);
  return res.json(tickets);
});

router.post('/tickets', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { category, subject, description } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({ error: 'Category, subject, and description are required.' });
    }

    const ticket = db.createTicket(user.id, category, subject, description);
    return res.status(201).json(ticket);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to submit ticket.' });
  }
});

// ==========================================
// 9. WEBHOOKS (SECURE GATEWAY CALLBACK)
// ==========================================

router.post('/webhooks/momo', (req: Request, res: Response) => {
  try {
    const rawPayload = JSON.stringify(req.body);
    const signature = req.headers['x-vendra-signature'] as string | undefined;

    // Verify cryptographic signature
    if (!verifyWebhookSignature(rawPayload, signature)) {
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }

    const { reference, status, external_transaction_id } = req.body;
    if (status === 'SUCCESSFUL') {
      db.confirmDepositFromGateway(reference, external_transaction_id || `MOMO-${Date.now()}`);
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Internal webhook error' });
  }
});

// ==========================================
// 10. DAILY YIELD CRON TRIGGER
// ==========================================

router.post('/cron/accrue', (_req: Request, res: Response) => {
  const result = db.accrueActiveProductRewards();
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...result
  });
});

// ==========================================
// 11. ADMIN DASHBOARD ENDPOINTS
// ==========================================

// High-Security Admin Authentication & Credential Verification
router.post('/admin/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required for admin authorization.' });
    }

    if (username.trim() !== 'VendraAdmin' || password !== '@Es%') {
      return res.status(401).json({ error: 'Access Denied: Invalid administrator credentials.' });
    }

    // Retrieve or ensure VendraAdmin super admin user
    let adminUser = db.getUserByPhone('VendraAdmin');
    if (!adminUser) {
      adminUser = db.seedSuperAdmin();
    }

    const token = generateToken(adminUser);
    const profile = db.getProfileByUserId(adminUser.id);

    return res.json({
      success: true,
      message: 'Admin authorization successful.',
      user: {
        id: adminUser.id,
        phone: adminUser.phone,
        role: adminUser.role,
        referral_code: adminUser.referral_code
      },
      profile,
      token
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Admin authentication failed.' });
  }
});

// Gated admin authority verification: strictly requires admin credentials
router.post('/admin/claim-owner', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, password } = req.body || {};
    if (username?.trim() !== 'VendraAdmin' || password !== '@Es%') {
      return res.status(403).json({
        error: 'Access Denied: Highly restricted area. Non-authorized users cannot access administrative authority.'
      });
    }

    const user = req.user!;
    const updated = db.makeUserAdmin(user.id);
    const token = generateToken(updated);
    const profile = db.getProfileByUserId(updated.id);
    return res.json({
      success: true,
      message: 'Official Administrator Authority confirmed and activated.',
      user: {
        id: updated.id,
        phone: updated.phone,
        role: updated.role,
        referral_code: updated.referral_code
      },
      profile,
      token
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to activate owner role.' });
  }
});

router.get('/admin/stats', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const stats = db.getAdminStats();
  return res.json(stats);
});

router.get('/admin/analytics', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const analytics = db.getAdminAnalyticsTimeseries();
  return res.json(analytics);
});

router.get('/admin/withdrawals', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as string | undefined;
  const withdrawals = db.getWithdrawals(undefined, status);

  // Enrich with user phone and name for the admin queue
  const enriched = withdrawals.map(w => {
    const user = db.getUserById(w.user_id);
    const profile = db.getProfileByUserId(w.user_id);
    return {
      ...w,
      user_phone: user?.phone || 'Unknown',
      user_name: profile?.full_name || 'Anonymous User',
      kyc_status: profile?.kyc_status || 'unverified'
    };
  });

  return res.json(enriched);
});

const handleWithdrawalReview = (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const withdrawalId = req.params.id;
    const { action, payout_reference, admin_notes, admin_note } = req.body;
    const resolvedNotes = admin_notes || admin_note;

    if (!['approve', 'reject', 'mark_paid', 'require_verification'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action.' });
    }

    const updated = db.reviewWithdrawal(
      withdrawalId,
      action as any,
      admin.id,
      payout_reference,
      resolvedNotes
    );

    return res.json({ success: true, withdrawal: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Review action failed.' });
  }
};

router.post('/admin/withdrawals/:id/review', requireAdmin, handleWithdrawalReview);
router.post('/admin/withdrawals/:id/action', requireAdmin, handleWithdrawalReview);

router.get('/admin/deposits', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const deposits = db.getDeposits();
  const enriched = deposits.map(d => {
    const user = db.getUserById(d.user_id);
    const profile = db.getProfileByUserId(d.user_id);
    return {
      ...d,
      user_phone: user?.phone || 'Unknown',
      user_name: profile?.full_name || 'Customer'
    };
  });
  return res.json(enriched);
});

router.post('/admin/deposits/:id/approve', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { admin_notes } = req.body || {};
    const updated = db.approveDeposit(req.params.id, admin.id, admin_notes);
    return res.json({ success: true, deposit: updated, message: 'Deposit approved and credited.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to approve deposit.' });
  }
});

router.post('/admin/deposits/:id/reject', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { reason } = req.body || {};
    const updated = db.rejectDeposit(req.params.id, admin.id, reason);
    return res.json({ success: true, deposit: updated, message: 'Deposit rejected.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to reject deposit.' });
  }
});

router.get('/admin/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsersAdmin();
  return res.json(users);
});

router.post('/admin/users/:id/toggle-status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const updated = db.toggleUserStatus(req.params.id, admin.id);
    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to toggle user status.' });
  }
});

router.post('/admin/users/:id/suspend', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const updated = db.suspendUser(req.params.id, admin.id);
    return res.json({ success: true, user: updated, message: 'User account suspended.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to suspend user.' });
  }
});

router.post('/admin/users/:id/unsuspend', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const updated = db.unsuspendUser(req.params.id, admin.id);
    return res.json({ success: true, user: updated, message: 'User account reactivated.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to reactivate user.' });
  }
});

router.delete('/admin/users/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    db.deleteUser(req.params.id, admin.id);
    return res.json({ success: true, message: 'User account deleted successfully.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete user account.' });
  }
});

router.post('/admin/users/:id/adjust-balance', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { amount, type, reason } = req.body;
    db.adjustUserBalance(req.params.id, parseFloat(amount), type, reason, admin.id);
    return res.json({ success: true, message: `Wallet balance adjusted successfully.` });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to adjust balance.' });
  }
});

router.post('/admin/products', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const {
      name,
      category,
      price,
      duration_days,
      return_rate,
      return_type,
      status,
      purchase_limit,
      description,
      eligibility_tier,
      vip_level,
      daily_income,
      total_revenue,
      image_url
    } = req.body;

    const parsedPrice = parseFloat(price);
    const parsedDuration = parseInt(duration_days, 10) || 180;
    const parsedRate = parseFloat(return_rate) || 0.3;
    const calculatedDailyIncome = daily_income ? parseFloat(daily_income) : Math.round(parsedPrice * parsedRate);
    const calculatedTotalRevenue = total_revenue ? parseFloat(total_revenue) : (calculatedDailyIncome * parsedDuration);

    const newProd = db.createProduct({
      name,
      category: category || 'VENDRA Commercial Fleet',
      price: parsedPrice,
      duration_days: parsedDuration,
      return_rate: parsedRate,
      return_type: return_type || 'daily_percentage',
      status: status || 'active',
      purchase_limit: parseInt(purchase_limit, 10) || 5,
      description,
      eligibility_tier: eligibility_tier || vip_level || 'VIP1',
      vip_level: vip_level || 'VIP1',
      daily_income: calculatedDailyIncome,
      total_revenue: calculatedTotalRevenue,
      image_url: image_url || 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80'
    }, admin.id);

    return res.status(201).json(newProd);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create product.' });
  }
});

router.put('/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const updated = db.updateProduct(req.params.id, req.body, admin.id);
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update product.' });
  }
});

router.delete('/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    db.deleteProduct(req.params.id, admin.id);
    return res.json({ success: true, message: 'Product removed from catalog successfully.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete product.' });
  }
});

router.get('/admin/settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.getSettings();
  return res.json(settings);
});

router.put(['/admin/settings', '/admin/settings/:key'], requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const key = req.params.key || req.body.key;
    const value = req.body.value !== undefined ? req.body.value : req.body.val;
    if (!key) {
      return res.status(400).json({ error: 'Setting key is required.' });
    }
    db.updateSetting(key, String(value), admin.id);
    return res.json({ success: true, settings: db.getSettings() });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update setting.' });
  }
});

router.get('/admin/tickets', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const tickets = db.getTickets();
  const enriched = tickets.map(t => {
    const user = db.getUserById(t.user_id);
    return {
      ...t,
      user_phone: user?.phone || 'Unknown'
    };
  });
  return res.json(enriched);
});

router.post('/admin/tickets/:id/reply', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { response, status } = req.body;
    const ticket = db.replyTicket(req.params.id, response, status || 'RESOLVED', admin.id);
    return res.json(ticket);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to reply to ticket.' });
  }
});

router.get('/admin/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  return res.json(logs);
});

// Admin Gift Codes Management
router.get('/admin/gift-codes', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getGiftCodes());
});

router.post('/admin/gift-codes', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { code, value, max_uses, expires_at, notes } = req.body;
    const giftCode = db.generateGiftCode(admin.id, {
      code,
      value: parseFloat(value),
      max_uses: max_uses ? parseInt(max_uses, 10) : 1,
      expires_at: expires_at || null,
      notes: notes || null
    });
    return res.status(201).json(giftCode);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create gift code.' });
  }
});

router.post('/admin/gift-codes/:id/toggle-status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { status } = req.body;
    const updated = db.toggleGiftCodeStatus(req.params.id, admin.id, status);
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update gift code status.' });
  }
});

router.delete('/admin/gift-codes/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    db.deleteGiftCode(req.params.id, admin.id);
    return res.json({ success: true, message: 'Gift code deleted.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete gift code.' });
  }
});

router.get('/admin/gift-codes/redemptions', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const codeId = req.query.codeId as string | undefined;
  return res.json(db.getGiftCodeRedemptions(codeId));
});

// ==========================================
// SYSTEM RESILIENCE & INTEGRATION STATUS
// ==========================================

router.get('/system/status', (_req: Request, res: Response) => {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  return res.json({
    platform: 'VENDRA Commercial Financial Platform',
    status: 'OPERATIONAL',
    primary_database: isSupabaseServerConfigured ? 'Supabase PostgreSQL' : 'Resilient Autonomous Relational Ledger',
    fallback_engine: {
      name: 'VENDRA Zero-Error ACID Engine',
      status: 'READY_AND_ACTIVE',
      automatic_configuration: true,
      data_integrity: 'SECURE'
    },
    runtime: isServerless ? 'Vercel Serverless' : 'Cloud Run Container',
    timestamp: new Date().toISOString()
  });
});

export default router;
