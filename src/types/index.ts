export type UserRole = 'user' | 'admin' | 'super_admin';
export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type ProductStatus = 'active' | 'locked' | 'sold_out';
export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL_RESERVE'
  | 'WITHDRAWAL_COMPLETED'
  | 'WITHDRAWAL_REFUND'
  | 'PRODUCT_PURCHASE'
  | 'PRODUCT_REWARD'
  | 'REFERRAL_REWARD'
  | 'ADJUSTMENT_CREDIT'
  | 'ADJUSTMENT_DEBIT';

export type TransactionStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REVERSED';
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'REQUIRES_VERIFICATION';
export type DepositStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED' | 'REJECTED';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type MobileMoneyProvider = 'MTN_MOMO' | 'AIRTEL_MONEY' | 'PESAPAL';

export interface User {
  id: string; // e.g. VEN-839210
  phone: string;
  username?: string;
  role: UserRole;
  password_hash?: string;
  vip_level?: string;
  referral_code: string;
  referred_by_id?: string | null;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string | null;
  nin_number?: string | null;
  kyc_status: KycStatus;
  momo_provider?: MobileMoneyProvider | null;
  momo_number?: string | null;
  avatar_url?: string | null;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image_url?: string;
  vip_level?: string; // 'VIP1', 'VIP2', ..., 'VIP8'
  price: number; // In UGX
  duration_days: number; // 180 days for VENDRA plans
  daily_income?: number; // In UGX (e.g. 3,000 for VIP1 up to 2,000,000 for VIP8)
  total_revenue?: number; // In UGX (e.g. 540,000 up to 360,000,000)
  return_rate: number; // e.g. 0.30 for 30% daily
  return_type: 'daily_percentage' | 'fixed_amount';
  status: ProductStatus;
  purchase_limit: number;
  description: string;
  eligibility_tier: string;
  created_at: string;
  updated_at: string;
}

export interface ProductPurchase {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  amount_paid: number;
  projected_reward: number;
  return_rate: number;
  duration_days: number;
  daily_income?: number;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  credited_rewards: number;
  total_accrued_reward?: number;
  last_accrual_at?: string | null;
  created_at: string;
  // 24-Hour Server-Side Profit Generation Fields
  activated_at?: string;
  next_profit_due_at?: string;
  profit_status?: 'PENDING_24H' | 'DUE' | 'PROCESSED' | 'CYCLE_FINISHED';
  cycles_completed?: number;
  last_processed_transaction_id?: string | null;
  // PesaPal Payment Verification Fields
  pesapal_tracking_id?: string | null;
  pesapal_reference?: string | null;
  payment_method?: 'PESAPAL' | 'BALANCE';
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  provider: MobileMoneyProvider;
  phone_number: string;
  reference: string;
  gateway_reference?: string | null;
  pesapal_order_tracking_id?: string | null;
  pesapal_redirect_url?: string | null;
  status: DepositStatus;
  created_at: string;
  confirmed_at?: string | null;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  provider: MobileMoneyProvider;
  phone_number: string;
  reference: string;
  payout_reference?: string | null;
  status: WithdrawalStatus;
  admin_notes?: string | null;
  requested_at: string;
  reviewed_at?: string | null;
  paid_at?: string | null;
  reviewed_by?: string | null;
  user_name?: string;
  user_phone?: string;
  momo_number?: string;
  momo_provider?: string;
  net_amount?: number;
  fee?: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number; // positive for credits, negative or positive depending on context (we store positive amount and use type)
  transaction_type: TransactionType;
  reference: string;
  status: TransactionStatus;
  source: string;
  description: string;
  audit_info: string;
  created_at: string;
}

export interface ReferralRelationship {
  id: string;
  inviter_id: string;
  invitee_id: string;
  level: number; // 1 for direct, 2 for secondary
  created_at: string;
}

export interface ReferralReward {
  id: string;
  inviter_id: string;
  invitee_id: string;
  qualifying_transaction_id: string;
  amount: number;
  percentage: number;
  level: number;
  status: 'CREDITED' | 'REVERSED';
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export type Notification = NotificationItem;

export interface SupportTicket {
  id: string;
  user_id: string;
  ticket_number: string;
  category: 'deposit' | 'withdrawal' | 'account' | 'product' | 'general';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: TicketStatus;
  admin_response?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface PlatformSettings {
  min_deposit_ugx: number;
  min_withdrawal_ugx: number;
  l1_referral_percentage: number;
  l2_referral_percentage: number;
  referral_eligibility_min_deposit: number;
  maintenance_mode: boolean;
  momo_gateway_mode: 'sandbox' | 'live';
}

export interface UserFinancialSummary {
  available_balance: number;
  total_earnings: number;
  total_deposits: number;
  total_withdrawals: number;
  pending_withdrawals: number;
  product_operating_profits?: number;
  referral_commissions?: number;
  active_product_count?: number;
  daily_expected_yield?: number;
  has_active_recharge?: boolean;
  can_withdraw?: boolean;
  welcome_bonus_claimed?: boolean;
  daily_checkin_claimed_today?: boolean;
  daily_checkin_streak?: number;
}
