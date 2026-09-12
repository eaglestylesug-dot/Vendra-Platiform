import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  Key,
  Layers,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  Trash2,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  X,
  Zap,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Product, SupportTicket, Withdrawal } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX, formatDate } from '../../utils/currency.ts';
import { AdminAnalyticsTab } from './AdminAnalyticsTab.tsx';
import { AdminLoginPage } from './AdminLoginPage.tsx';

interface AdminDashboardModalProps {
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ onClose }) => {
  const { token, user, isAdmin, adminLogin, logout, refreshUserData } = useAuth();

  // Admin Login State for non-authorized users
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dashboard Active Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'analytics' | 'withdrawals' | 'deposits' | 'products' | 'users' | 'settings' | 'tickets' | 'audit'
  >('overview');

  // Loaded Data
  const [stats, setStats] = useState<any>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [depositFilter, setDepositFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'>('ALL');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'REJECTED'>('ALL');

  // Withdrawal Action Dialog
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [withdrawalActionType, setWithdrawalActionType] = useState<'approve' | 'reject' | 'mark_paid' | 'require_verification'>('mark_paid');
  const [payoutReference, setPayoutReference] = useState('');
  const [withdrawalAdminNote, setWithdrawalAdminNote] = useState('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

  // Deposit Action Dialog
  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);
  const [depositActionType, setDepositActionType] = useState<'approve' | 'reject'>('approve');
  const [depositAdminNote, setDepositAdminNote] = useState('');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);

  // Product Add / Edit Dialog
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'VENDRA Commercial Fleet',
    price: 10000,
    daily_income: 3000,
    duration_days: 90,
    daily_rate_percent: 30.0,
    purchase_limit: 5,
    description: '',
    vip_level: 'VIP1',
    image_url: ''
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // User Balance Adjustment Dialog
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<any | null>(null);
  const [balanceAdjustmentAmount, setBalanceAdjustmentAmount] = useState<number>(10000);
  const [balanceAdjustmentType, setBalanceAdjustmentType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [balanceAdjustmentReason, setBalanceAdjustmentReason] = useState('Administrative compensation');
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);

  // Confirmation for Deletion
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'user'; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ticket Reply Dialog
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Fetch all admin suite data
  const fetchAdminData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Parallelize fetches
      const [statsRes, depRes, withRes, prodRes, usersRes, setRes, tickRes, auditRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/deposits', { headers }),
        fetch('/api/admin/withdrawals', { headers }),
        fetch('/api/products'),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/settings', { headers }),
        fetch('/api/admin/tickets', { headers }),
        fetch('/api/admin/audit-logs', { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (depRes.ok) setDeposits(await depRes.json());
      if (withRes.ok) setWithdrawals(await withRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (usersRes.ok) setUsersList(await usersRes.json());
      if (setRes.ok) setSettings(await setRes.json());
      if (tickRes.ok) setTickets(await tickRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, token]);

  // Handle Admin Authorization
  const handleAdminAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await adminLogin(adminUsernameInput.trim(), adminPasswordInput);
      setAdminPasswordInput('');
      setAdminUsernameInput('');
    } catch (err: any) {
      setAuthError(err.message || 'Access Denied: Invalid credentials.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Deposit Approval/Rejection
  const handleProcessDeposit = async () => {
    if (!selectedDeposit) return;
    setIsProcessingDeposit(true);
    try {
      const endpoint = depositActionType === 'approve'
        ? `/api/admin/deposits/${selectedDeposit.id}/approve`
        : `/api/admin/deposits/${selectedDeposit.id}/reject`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          admin_notes: depositAdminNote,
          reason: depositAdminNote
        })
      });

      if (res.ok) {
        setSelectedDeposit(null);
        setDepositAdminNote('');
        await fetchAdminData();
        await refreshUserData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  // Handle Withdrawal Review
  const handleProcessWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    setIsProcessingWithdrawal(true);
    const resolvedPayoutRef = withdrawalActionType === 'mark_paid'
      ? (payoutReference.trim() || `MM-UGX-${Date.now().toString().slice(-6)}`)
      : payoutReference;

    try {
      const res = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: withdrawalActionType,
          payout_reference: resolvedPayoutRef,
          admin_note: withdrawalAdminNote
        })
      });

      if (res.ok) {
        setSelectedWithdrawal(null);
        setPayoutReference('');
        setWithdrawalAdminNote('');
        await fetchAdminData();
        await refreshUserData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  // Handle Save (Create or Edit) Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProduct(true);
    try {
      const payload = {
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        daily_income: Number(productForm.daily_income) || (Number(productForm.price) * (Number(productForm.daily_rate_percent) / 100)),
        duration_days: Number(productForm.duration_days),
        return_rate: Number(productForm.daily_rate_percent) / 100,
        purchase_limit: Number(productForm.purchase_limit),
        description: productForm.description,
        vip_level: productForm.vip_level || 'VIP1',
        image_url: productForm.image_url || 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80'
      };

      const url = editingProductId
        ? `/api/admin/products/${editingProductId}`
        : '/api/admin/products';

      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowProductModal(false);
        setEditingProductId(null);
        setProductForm({
          name: '',
          category: 'VENDRA Commercial Fleet',
          price: 10000,
          daily_income: 3000,
          duration_days: 90,
          daily_rate_percent: 30.0,
          purchase_limit: 5,
          description: '',
          vip_level: 'VIP1',
          image_url: ''
        });
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Open Edit Product Modal
  const openEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      category: p.category,
      price: p.price,
      daily_income: p.daily_income || (p.price * p.return_rate),
      duration_days: p.duration_days,
      daily_rate_percent: p.return_rate * 100,
      purchase_limit: p.purchase_limit,
      description: p.description,
      vip_level: p.vip_level || 'VIP1',
      image_url: p.image_url || ''
    });
    setShowProductModal(true);
  };

  // Handle User Suspension / Reactivation
  const handleToggleUserSuspension = async (u: any) => {
    try {
      const endpoint = u.status === 'suspended'
        ? `/api/admin/users/${u.id}/unsuspend`
        : `/api/admin/users/${u.id}/suspend`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle User Balance Adjustment
  const handleAdjustUserBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBalance) return;
    setIsAdjustingBalance(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserForBalance.id}/adjust-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: balanceAdjustmentAmount,
          type: balanceAdjustmentType,
          reason: balanceAdjustmentReason
        })
      });

      if (res.ok) {
        setSelectedUserForBalance(null);
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdjustingBalance(false);
    }
  };

  // Handle Delete Confirmation (Product or User)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const endpoint = deleteTarget.type === 'product'
        ? `/api/admin/products/${deleteTarget.id}`
        : `/api/admin/users/${deleteTarget.id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setDeleteTarget(null);
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Setting Update
  const handleSaveSetting = async (key: string, value: any) => {
    try {
      await fetch(`/api/admin/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ value })
      });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Ticket Reply
  const handleReplyTicket = async () => {
    if (!selectedTicket) return;
    setIsSendingReply(true);
    try {
      await fetch(`/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ admin_response: ticketReply })
      });
      setSelectedTicket(null);
      setTicketReply('');
      await fetchAdminData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Filtered Users List
  const filteredUsers = usersList.filter(u => {
    const term = userSearchTerm.toLowerCase();
    return (
      u.phone?.toLowerCase().includes(term) ||
      u.referral_code?.toLowerCase().includes(term) ||
      u.id?.toLowerCase().includes(term)
    );
  });

  // Filtered Deposits
  const filteredDeposits = deposits.filter(d => {
    if (depositFilter === 'ALL') return true;
    return d.status === depositFilter;
  });

  // Filtered Withdrawals
  const filteredWithdrawals = withdrawals.filter(w => {
    if (withdrawalFilter === 'ALL') return true;
    return w.status === withdrawalFilter;
  });

  // =========================================================================
  // IF NOT ADMIN: STRICT PROFESSIONAL LOGIN GATE
  // =========================================================================
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 animate-fade-in">
        <AdminLoginPage
          onBackToApp={onClose}
          onLoginSuccess={async () => {
            await fetchAdminData();
            await refreshUserData();
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // AUTHORIZED ADMINISTRATOR SUITE
  // =========================================================================
  const pendingDepositsCount = deposits.filter(d => d.status === 'PENDING').length;
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'PENDING').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[94vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  VENDRA Master Operations Suite
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                  Super Admin
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  VendraAdmin Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ledger clearing, deposit/withdrawal decisions, user account governance & site parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors"
              title="Lock Admin Session / Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 overflow-x-auto no-scrollbar">
          {[
            { key: 'overview', label: 'Overview', icon: DollarSign },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp },
            {
              key: 'withdrawals',
              label: `Withdrawals ${pendingWithdrawalsCount > 0 ? `(${pendingWithdrawalsCount})` : ''}`,
              icon: ArrowUpRight,
              badge: pendingWithdrawalsCount
            },
            {
              key: 'deposits',
              label: `Deposits (Gateway)`,
              icon: ArrowDownLeft
            },
            { key: 'products', label: `Products (${products.length})`, icon: Layers },
            { key: 'users', label: `Users (${usersList.length})`, icon: Users },
            { key: 'settings', label: 'Settings', icon: Settings },
            { key: 'tickets', label: 'Tickets', icon: Ticket },
            { key: 'audit', label: 'Audit Trail', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-black">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Body Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Members</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {stats?.total_users || usersList.length}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-semibold block mt-1">
                    {stats?.active_users || usersList.filter(u => u.status === 'active').length} active accounts
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Deposits</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatUGX(stats?.total_deposited_ugx || 0)}
                  </span>
                  <span className="text-[10px] text-orange-500 font-semibold block mt-1">
                    {pendingDepositsCount} pending review
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Paid Out</span>
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                    {formatUGX(stats?.total_withdrawn_ugx || 0)}
                  </span>
                  <span className="text-[10px] text-amber-500 font-semibold block mt-1">
                    {pendingWithdrawalsCount} pending approvals
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">System Reserve</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {formatUGX(stats?.reserve_pool_ugx || 0)}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-semibold block mt-1">
                    Solvency Verified
                  </span>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Priority Administrative Shortcuts
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => setActiveTab('deposits')}
                    className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left hover:brightness-105 transition-all"
                  >
                    <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Approve Deposits
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {pendingDepositsCount} waiting
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-left hover:brightness-105 transition-all"
                  >
                    <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400 mb-1" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Clear Withdrawals
                    </span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400">
                      {pendingWithdrawalsCount} in queue
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingProductId(null);
                      setShowProductModal(true);
                    }}
                    className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-left hover:brightness-105 transition-all"
                  >
                    <Plus className="w-5 h-5 text-orange-600 dark:text-orange-400 mb-1" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Add Product
                    </span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400">
                      Create new fleet
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-left hover:brightness-105 transition-all"
                  >
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-1" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Growth Analytics
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                      Recharts Trends
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-left hover:brightness-105 transition-all"
                  >
                    <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-1" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Website Config
                    </span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400">
                      Limits & Referrals
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANALYTICS (RECHARTS VISUALIZATION) */}
          {activeTab === 'analytics' && <AdminAnalyticsTab />}

          {/* TAB 2: DEPOSITS MANAGEMENT (GATEWAY AUTO-CLEARING) */}
          {activeTab === 'deposits' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Mobile Money & PesaPal Gateway Ledger ({deposits.length})
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-600" />
                      <span>100% Auto-Clearing</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Deposits are automatically verified and credited to member balances upon payment gateway approval. No manual approval required.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  {(['ALL', 'CONFIRMED', 'PENDING', 'REJECTED'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setDepositFilter(f)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        depositFilter === f
                          ? 'bg-orange-600 text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic Gateway Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Automatic Gateway Reconciliation Active</strong>
                  <span>
                    When members complete payment via MTN MoMo, Airtel Money, or PesaPal, the payment gateway automatically credits user balances and distributes 35% Level 1 and 6% Level 2 commissions.
                  </span>
                </div>
              </div>

              {filteredDeposits.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No deposits matching filter.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredDeposits.map(d => (
                    <div
                      key={d.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {formatUGX(d.amount)}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              d.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                : d.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                            }`}
                          >
                            {d.status === 'CONFIRMED' ? 'Auto-Credited by Gateway' : d.status === 'PENDING' ? 'Awaiting Gateway Payment' : 'Gateway Failed'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {d.payment_method || 'MOBILE_MONEY'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          <span>User: <strong className="text-slate-700 dark:text-slate-200">{d.user_phone || d.phone_number}</strong></span>
                          <span className="mx-1.5">•</span>
                          <span>Ref: <span className="font-mono">{d.reference}</span></span>
                          <span className="mx-1.5">•</span>
                          <span>{formatDate(d.created_at)}</span>
                        </div>
                      </div>

                      {d.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDeposit(d);
                              setDepositActionType('approve');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Simulate Gateway Hook</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WITHDRAWALS MANAGEMENT */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Uganda Mobile Money Payout Ledger ({withdrawals.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direct disbursement verification and payout reference assignment
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  {(['ALL', 'PENDING', 'PAID', 'REJECTED'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setWithdrawalFilter(f)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        withdrawalFilter === f
                          ? 'bg-orange-600 text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredWithdrawals.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No withdrawal records in this view.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredWithdrawals.map(w => (
                    <div
                      key={w.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {formatUGX(w.amount)}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              w.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                : w.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>Phone: <strong className="text-slate-700 dark:text-slate-200">{w.phone_number}</strong></span>
                          <span className="mx-1.5">•</span>
                          <span>Net Disbursed: <strong className="text-slate-800 dark:text-slate-100">{formatUGX(w.net_amount)}</strong></span>
                          <span className="mx-1.5">•</span>
                          <span>Ref: <span className="font-mono">{w.reference}</span></span>
                          <span className="mx-1.5">•</span>
                          <span>{formatDate(w.created_at)}</span>
                        </div>
                        {w.payout_reference && (
                          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Payout Reference: {w.payout_reference}
                          </div>
                        )}
                      </div>

                      {w.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setWithdrawalActionType('mark_paid');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm transition-all"
                          >
                            Disburse / Review
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Commercial Equipment & Fleet Products ({products.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add new investment plans, adjust pricing, daily return percentages, and delete products
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingProductId(null);
                    setProductForm({
                      name: '',
                      category: 'VENDRA Commercial Fleet',
                      price: 10000,
                      daily_income: 3000,
                      duration_days: 90,
                      daily_rate_percent: 30.0,
                      purchase_limit: 5,
                      description: '',
                      vip_level: 'VIP1'
                    });
                    setShowProductModal(true);
                  }}
                  className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                {products.map(p => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-2">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 flex items-center justify-center shrink-0 text-orange-500">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-orange-600 uppercase">
                              {p.vip_level || p.category}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                              {p.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {p.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {p.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Price</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatUGX(p.price)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Daily Return</span>
                          <span className="font-bold text-orange-500">
                            {(p.return_rate * 100).toFixed(1)}% / day
                          </span>
                        </div>
                        <div className="pt-1">
                          <span className="text-slate-400 text-[10px] block">Duration</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {p.duration_days} Days
                          </span>
                        </div>
                        <div className="pt-1">
                          <span className="text-slate-400 text-[10px] block">Purchase Limit</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {p.purchase_limit} units
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                      <button
                        onClick={() => openEditProduct(p)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Product</span>
                      </button>

                      <button
                        onClick={() => setDeleteTarget({ type: 'product', id: p.id, name: p.name })}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Member Accounts Directory ({usersList.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Suspend/unsuspend accounts, adjust member wallet balances, or delete records
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={e => setUserSearchTerm(e.target.value)}
                    placeholder="Search phone or ref code..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                          {u.phone}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {u.role}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                          }`}
                        >
                          {u.status}
                        </span>
                        <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400">
                          Ref: {u.referral_code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        <span>Joined: {formatDate(u.created_at)}</span>
                        <span className="mx-1.5">•</span>
                        <span>Deposited: <strong className="text-slate-700 dark:text-slate-300">{formatUGX(u.total_deposits || 0)}</strong></span>
                        <span className="mx-1.5">•</span>
                        <span>Available: <strong className="text-emerald-600 dark:text-emerald-400">{formatUGX(u.available_balance || 0)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUserForBalance(u);
                          setBalanceAdjustmentAmount(10000);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
                      >
                        Adjust Balance
                      </button>

                      {u.role !== 'super_admin' && (
                        <>
                          <button
                            onClick={() => handleToggleUserSuspension(u)}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                              u.status === 'suspended'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                            }`}
                          >
                            {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </button>

                          <button
                            onClick={() => setDeleteTarget({ type: 'user', id: u.id, name: u.phone })}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PLATFORM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Platform Parameters & Financial Configuration
                </h3>
                <p className="text-xs text-slate-400">
                  Configure limits, referral reward percentages, bonuses, and communication links
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4 text-xs">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Minimum Deposit Amount (UGX)
                    </label>
                    <input
                      type="number"
                      defaultValue={settings.min_deposit_ugx || 10000}
                      onBlur={e => handleSaveSetting('min_deposit_ugx', Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Default: UGX 10,000</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Minimum Withdrawal Limit (UGX)
                    </label>
                    <input
                      type="number"
                      defaultValue={settings.min_withdrawal_ugx || 5000}
                      onBlur={e => handleSaveSetting('min_withdrawal_ugx', Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Default: UGX 5,000</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Maximum Withdrawal Limit (UGX)
                    </label>
                    <input
                      type="number"
                      defaultValue={settings.max_withdrawal_ugx || 5000000}
                      onBlur={e => handleSaveSetting('max_withdrawal_ugx', Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Default: UGX 5,000,000</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Level 1 Referral Commission (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue={settings.l1_referral_percentage || 35.0}
                      onBlur={e => handleSaveSetting('l1_referral_percentage', Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Awarded upon referral deposit</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Level 2 Referral Commission (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue={settings.l2_referral_percentage || 6.0}
                      onBlur={e => handleSaveSetting('l2_referral_percentage', Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Awarded upon sub-referral deposit</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Referral Eligibility Min Deposit (UGX)
                    </label>
                    <input
                      type="number"
                      defaultValue={settings.referral_eligibility_min_deposit || 10000}
                      onBlur={e => handleSaveSetting('referral_eligibility_min_deposit', Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Welcome Bonus (UGX)
                    </label>
                    <input
                      type="number"
                      defaultValue={settings.welcome_bonus_ugx || 5000}
                      onBlur={e => handleSaveSetting('welcome_bonus_ugx', Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Platform Announcement Banner
                  </label>
                  <textarea
                    rows={2}
                    defaultValue={settings.platform_announcement || ''}
                    onBlur={e => handleSaveSetting('platform_announcement', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      WhatsApp 1-on-1 Support Link
                    </label>
                    <input
                      type="text"
                      defaultValue={settings.whatsapp_support_url || 'https://wa.me/qr/C3VMQ7Y7TXH6B1'}
                      onBlur={e => handleSaveSetting('whatsapp_support_url', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Telegram Channel Link
                    </label>
                    <input
                      type="text"
                      defaultValue={settings.telegram_channel_url || 'https://t.me/vendraplatiform'}
                      onBlur={e => handleSaveSetting('telegram_channel_url', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Mobile Money Gateway Environment
                  </label>
                  <select
                    defaultValue={settings.momo_gateway_mode || 'sandbox'}
                    onChange={e => handleSaveSetting('momo_gateway_mode', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="sandbox">Sandbox (Testing / Instant Simulation Mode)</option>
                    <option value="live">Live Uganda Production Gateway (MTN & Airtel MoMo)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SUPPORT TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Customer Support Desk ({tickets.length})
                </h3>
                <p className="text-xs text-slate-400">
                  User inquiries and direct administrator replies
                </p>
              </div>

              {tickets.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No support tickets logged.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tickets.map(t => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {t.subject}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{t.message}</p>
                      {t.admin_response ? (
                        <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-xs text-orange-950 dark:text-orange-200">
                          <strong>Admin Response:</strong> {t.admin_response}
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="py-1.5 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
                        >
                          Reply to User
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  System Audit Ledger Logs ({auditLogs.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Immutable security events and administrative actions
                </p>
              </div>

              <div className="space-y-2">
                {auditLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-600 dark:text-orange-400">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          target: {log.target_type} ({log.target_id?.slice(0, 8)})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL: Deposit Action Dialog */}
        {selectedDeposit && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {depositActionType === 'approve' ? 'Approve Deposit' : 'Reject Deposit'}: {formatUGX(selectedDeposit.amount)}
              </h3>
              <p className="text-xs text-slate-400 mb-4 font-mono">
                Ref: {selectedDeposit.reference} • User: {selectedDeposit.user_phone}
              </p>

              {depositActionType === 'approve' ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 mb-4">
                  ✓ This will credit {formatUGX(selectedDeposit.amount)} to member available balance.
                  <br />
                  ✓ Automatically triggers Level 1 (35%) and Level 2 (6%) referral commissions for eligible sponsors.
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 mb-4">
                  ⚠ This deposit will be marked REJECTED without crediting user balance.
                </div>
              )}

              <div className="space-y-3 text-xs mb-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Administrative Remarks
                  </label>
                  <textarea
                    value={depositAdminNote}
                    onChange={e => setDepositAdminNote(e.target.value)}
                    placeholder="Enter reason or transaction reference..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDeposit(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessDeposit}
                  disabled={isProcessingDeposit}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm ${
                    depositActionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {isProcessingDeposit ? 'Processing...' : depositActionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Withdrawal Action Dialog */}
        {selectedWithdrawal && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Process Withdrawal: {formatUGX(selectedWithdrawal.amount)}
              </h3>
              <p className="text-xs text-slate-400 mb-4 font-mono">
                Ref: {selectedWithdrawal.reference} • Recipient: {selectedWithdrawal.phone_number}
              </p>

              <div className="space-y-3 text-xs mb-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Resolution Action
                  </label>
                  <select
                    value={withdrawalActionType}
                    onChange={e => setWithdrawalActionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="mark_paid">Mark as Paid (Disbursed to Mobile Money)</option>
                    <option value="approve">Approve (Move to Processing)</option>
                    <option value="reject">Reject & Issue Immediate Balance Refund</option>
                    <option value="require_verification">Require National ID (NIN) Verification</option>
                  </select>
                </div>

                {withdrawalActionType === 'mark_paid' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Mobile Money Payment Reference
                      </label>
                      <button
                        type="button"
                        onClick={() => setPayoutReference(`MM-UGX-${Date.now().toString().slice(-6)}`)}
                        className="text-[10px] text-orange-500 font-bold hover:underline"
                      >
                        Auto-Generate Ref
                      </button>
                    </div>
                    <input
                      type="text"
                      value={payoutReference}
                      onChange={e => setPayoutReference(e.target.value)}
                      placeholder="e.g. MM-UG-2026-91823"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Administrative Audit Note
                  </label>
                  <textarea
                    value={withdrawalAdminNote}
                    onChange={e => setWithdrawalAdminNote(e.target.value)}
                    placeholder="Enter reason or reference remarks..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessWithdrawal}
                  disabled={isProcessingWithdrawal}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-xs shadow-sm hover:brightness-105"
                >
                  {isProcessingWithdrawal ? 'Executing Action...' : 'Confirm Action'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Add / Edit Product */}
        {showProductModal && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                {editingProductId ? 'Edit Commercial Product' : 'Create Commercial Product'}
              </h3>

              <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                {/* Product Image Section */}
                <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
                      <span>Product Picture / Image</span>
                    </label>
                    {productForm.image_url && (
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, image_url: '' })}
                        className="text-[10px] text-rose-500 hover:underline font-bold"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  {productForm.image_url ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-900">
                      <img
                        src={productForm.image_url}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-semibold">
                        Preview
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center hover:border-orange-500/50 transition-colors">
                      <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Upload an image or paste a photo URL below
                      </p>
                    </div>
                  )}

                  {/* File Upload Button */}
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer flex-1 py-1.5 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-center hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-orange-500" />
                      <span>Upload Picture from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setProductForm({ ...productForm, image_url: reader.result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Image URL Input */}
                  <input
                    type="url"
                    value={productForm.image_url.startsWith('data:') ? '' : productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="Or paste direct image URL (https://...)"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />

                  {/* Quick Presets */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Preset Fleet Photos:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: 'Fleet 1', url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80' },
                        { label: 'Fleet 2', url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80' },
                        { label: 'LiDAR', url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&auto=format&fit=crop&q=80' },
                        { label: 'Cargo', url: 'https://images.unsplash.com/photo-1506947411487-a56738267384?w=800&auto=format&fit=crop&q=80' },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProductForm({ ...productForm, image_url: preset.url })}
                          className="py-1 px-1 text-[10px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-500 font-bold truncate transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">VIP Level / Tier</label>
                  <input
                    type="text"
                    value={productForm.vip_level}
                    onChange={e => setProductForm({ ...productForm, vip_level: e.target.value })}
                    placeholder="e.g. VIP1, VIP2, VIP3..."
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Product Name</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. VENDRA CITY 01"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Price (UGX)</label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={productForm.price}
                      onChange={e => {
                        const price = Number(e.target.value);
                        const daily = Math.round(price * (productForm.daily_rate_percent / 100));
                        setProductForm({ ...productForm, price, daily_income: daily });
                      }}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Daily Return %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.daily_rate_percent}
                      onChange={e => {
                        const rate = Number(e.target.value);
                        const daily = Math.round(productForm.price * (rate / 100));
                        setProductForm({ ...productForm, daily_rate_percent: rate, daily_income: daily });
                      }}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Daily Profit (UGX)</label>
                    <input
                      type="number"
                      value={productForm.daily_income}
                      onChange={e => setProductForm({ ...productForm, daily_income: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      value={productForm.duration_days}
                      onChange={e => setProductForm({ ...productForm, duration_days: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-300">Projected Total Return:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-black">
                    {formatUGX((productForm.daily_income || (productForm.price * (productForm.daily_rate_percent / 100))) * productForm.duration_days)}
                  </strong>
                </div>

                <div>
                  <label className="font-bold block mb-1">Purchase Limit</label>
                  <input
                    type="number"
                    value={productForm.purchase_limit}
                    onChange={e => setProductForm({ ...productForm, purchase_limit: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProductId(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm"
                  >
                    {isSavingProduct ? 'Saving...' : editingProductId ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Adjust Balance Dialog */}
        {selectedUserForBalance && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Adjust Wallet Balance: {selectedUserForBalance.phone}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Current Balance: <strong className="text-emerald-500">{formatUGX(selectedUserForBalance.available_balance || 0)}</strong>
              </p>

              <form onSubmit={handleAdjustUserBalance} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">Adjustment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBalanceAdjustmentType('CREDIT')}
                      className={`py-2 rounded-xl font-bold transition-all ${
                        balanceAdjustmentType === 'CREDIT'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Credit (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalanceAdjustmentType('DEBIT')}
                      className={`py-2 rounded-xl font-bold transition-all ${
                        balanceAdjustmentType === 'DEBIT'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Debit (-)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Amount (UGX)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={balanceAdjustmentAmount}
                    onChange={e => setBalanceAdjustmentAmount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Reason / Note</label>
                  <input
                    type="text"
                    value={balanceAdjustmentReason}
                    onChange={e => setBalanceAdjustmentReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForBalance(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdjustingBalance}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm"
                  >
                    {isAdjustingBalance ? 'Executing...' : 'Confirm Balance Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Delete Confirmation Dialog */}
        {deleteTarget && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Deletion
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to permanently delete {deleteTarget.type === 'product' ? 'product' : 'user account'}{' '}
                  <strong>"{deleteTarget.name}"</strong>? This action cannot be reversed.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Ticket Reply Dialog */}
        {selectedTicket && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Reply to Ticket: {selectedTicket.subject}
              </h3>
              <p className="text-xs text-slate-400 mb-3">{selectedTicket.message}</p>

              <textarea
                value={ticketReply}
                onChange={e => setTicketReply(e.target.value)}
                placeholder="Type administrator response to member..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white mb-3 resize-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReplyTicket}
                  disabled={isSendingReply}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm"
                >
                  {isSendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
