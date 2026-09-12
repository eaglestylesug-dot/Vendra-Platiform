import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { BottomNav, TabKey } from './components/layout/BottomNav.tsx';
import { BalanceCard } from './components/home/BalanceCard.tsx';
import { QuickActions } from './components/home/QuickActions.tsx';
import { AnnouncementBanner } from './components/home/AnnouncementBanner.tsx';
import { DailyCheckinBanner } from './components/home/DailyCheckinBanner.tsx';
import { ProductCard } from './components/products/ProductCard.tsx';
import { ProductDetailModal } from './components/products/ProductDetailModal.tsx';
import { TeamPage } from './components/team/TeamPage.tsx';
import { MinePage } from './components/mine/MinePage.tsx';
import { DepositModal } from './components/recharge/DepositModal.tsx';
import { WithdrawModal } from './components/withdraw/WithdrawModal.tsx';
import { HistoryModal } from './components/history/HistoryModal.tsx';
import { CustomerServiceModal } from './components/support/CustomerServiceModal.tsx';
import { FloatingHelpButton } from './components/support/FloatingHelpButton.tsx';
import { AdminDashboardModal } from './components/admin/AdminDashboardModal.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { VendraPlanTableModal } from './components/products/VendraPlanTableModal.tsx';
import { NotificationModal } from './components/notifications/NotificationModal.tsx';
import { Product } from './types/index.ts';
import { DEFAULT_PRODUCTS } from './data/defaultProducts.ts';
import { AlertTriangle, Clock, RefreshCw, ShieldCheck, Sparkles, TrendingUp, Layers, Zap, Table } from 'lucide-react';
import { formatUGX } from './utils/currency.ts';

function MainApp() {
  const { user, summary, token, isLoading, refreshUserData } = useAuth();

  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [activePurchases, setActivePurchases] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [pesapalBanner, setPesapalBanner] = useState<{
    type: 'success' | 'pending' | 'error';
    message: string;
  } | null>(null);

  // Handle return redirect from PesaPal payment gateway
  useEffect(() => {
    try {
      const search = window.location.search;
      if (!search) return;
      const params = new URLSearchParams(search);
      const pesapalStatus = params.get('pesapal_status');
      const orderId = params.get('order_id');
      const ref = params.get('ref');

      if (pesapalStatus) {
        // Clean URL query parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        if (pesapalStatus === 'completed') {
          setPesapalBanner({
            type: 'success',
            message: `PesaPal payment successful! Ref: ${ref || orderId || 'Verified'}. Your account balance has been credited.`
          });
          refreshUserData();
        } else if (pesapalStatus === 'pending') {
          setPesapalBanner({
            type: 'pending',
            message: `PesaPal payment submitted (${ref || orderId}). Transaction is currently being processed by the network.`
          });
          refreshUserData();
        } else {
          setPesapalBanner({
            type: 'error',
            message: 'PesaPal payment was cancelled or encountered an error. Please try again or check your account history.'
          });
        }
      }
    } catch (_err) {
      // Ignore URL parsing errors
    }
  }, [refreshUserData]);

  // Fetch products with resilient retries
  const fetchProducts = async (retries = 3, delay = 1000) => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
        setProductsError(null);
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err: any) {
      if (retries > 0) {
        setTimeout(() => {
          fetchProducts(retries - 1, delay * 1.5);
        }, delay);
      } else {
        // Fall back gracefully to bundled default products
        setProductsError('Using offline equipment catalog.');
      }
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch active purchases for logged in user
  const fetchActivePurchases = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/purchases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivePurchases(data);
      }
    } catch (_err) {
      // Quiet failover
    }
  };

  // Claim Daily Yield Handler
  const [isClaimingYield, setIsClaimingYield] = useState(false);
  const [yieldNotice, setYieldNotice] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const handleClaimYield = async () => {
    if (!token || isClaimingYield) return;
    setIsClaimingYield(true);
    setYieldNotice(null);
    try {
      const res = await fetch('/api/purchases/claim-yield', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setYieldNotice({
          type: 'success',
          message: data.message || 'Daily equipment yield collected and credited to your wallet!'
        });
        await refreshUserData();
        await fetchActivePurchases();
      } else {
        setYieldNotice({
          type: 'info',
          message: data.error || 'No pending yield to collect yet. Yield accrues automatically every 24 hours.'
        });
      }
    } catch (_err: any) {
      setYieldNotice({
        type: 'error',
        message: 'Could not connect to financial network to collect yield.'
      });
    } finally {
      setIsClaimingYield(false);
      setTimeout(() => setYieldNotice(null), 7000);
    }
  };

  useEffect(() => {
    fetchProducts(3, 800);
  }, []);

  useEffect(() => {
    if (token) {
      fetchActivePurchases();
    } else {
      setActivePurchases([]);
    }
  }, [token]);

  // If initial auth session is verifying, display loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-[2px] animate-spin">
          <div className="w-full h-full bg-slate-950 rounded-[14px]" />
        </div>
        <span>Connecting to VENDRA Commercial Investment Gateway...</span>
      </div>
    );
  }

  // FIRST PAGE IS THE LOGIN PAGE FOR VISITORS
  if (!user) {
    return (
      <>
        <LoginPage onOpenSupport={() => setShowSupportModal(true)} />
        {showSupportModal && (
          <CustomerServiceModal onClose={() => setShowSupportModal(false)} />
        )}
      </>
    );
  }

  // Dynamically compute category options from loaded products
  const uniqueCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  const categories = ['ALL', ...uniqueCategories];

  const filteredProducts = products.filter(p => {
    if (productCategoryFilter === 'ALL') return true;
    return p.category.toLowerCase().includes(productCategoryFilter.toLowerCase()) ||
           productCategoryFilter.toLowerCase().includes(p.category.toLowerCase());
  });

  const handleProductParticipate = (prod: Product) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedProduct(prod);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top App Header */}
      <Header
        onOpenNotifications={() => {
          if (!user) setShowAuthModal(true);
          else setShowNotificationModal(true);
        }}
        onOpenCustomerService={() => setShowSupportModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
      />

      {/* Main Responsive Container */}
      <main className="flex-1 w-full max-w-md mx-auto relative pb-20">
        {/* PesaPal Gateway Redirect Notice Banner */}
        {pesapalBanner && (
          <div className="p-4 pb-0">
            <div
              className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 text-xs animate-fade-in ${
                pesapalBanner.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : pesapalBanner.type === 'pending'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-black text-sm">
                  {pesapalBanner.type === 'success' ? '✓' : pesapalBanner.type === 'pending' ? '⏳' : '⚠'}
                </span>
                <p className="font-medium leading-relaxed">{pesapalBanner.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setPesapalBanner(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner during initial session check */}
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 p-[2px] animate-spin">
              <div className="w-full h-full bg-slate-950 rounded-[14px]" />
            </div>
            <span>Connecting to VENDRA Financial Gateway...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: HOME */}
            {currentTab === 'home' && (
              <div className="p-4 space-y-4 animate-fade-in">
                {/* Balance Card */}
                <BalanceCard
                  summary={summary}
                  onRecharge={() => {
                    if (!user) setShowAuthModal(true);
                    else setShowDepositModal(true);
                  }}
                  onWithdraw={() => {
                    if (!user) setShowAuthModal(true);
                    else setShowWithdrawModal(true);
                  }}
                  onHistory={() => {
                    if (!user) setShowAuthModal(true);
                    else setShowHistoryModal(true);
                  }}
                  onSupport={() => setShowSupportModal(true)}
                />

                {/* Announcement Ticker */}
                <AnnouncementBanner />

                {/* Official VENDRA Investment Plan Banner */}
                <div
                  onClick={() => setShowPlanModal(true)}
                  className="p-4 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20 cursor-pointer hover:brightness-105 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider mb-1.5">
                        <Zap className="w-3 h-3 text-amber-300" />
                        VENDRA Investment Plan (VIP 1 - VIP 8)
                      </div>
                      <h3 className="text-base font-black tracking-tight leading-tight">
                        Invest Today, Earn Every Day!
                      </h3>
                      <p className="text-xs text-blue-100 mt-0.5">
                        180-day daily automated yields • UGX 3,000 to UGX 2,000,000 / day
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-3.5 py-2 rounded-xl bg-white text-blue-700 font-extrabold text-xs shadow-sm flex-shrink-0"
                    >
                      View Table
                    </button>
                  </div>
                </div>

                {/* Quick Actions Panel */}
                <QuickActions
                  onRecharge={() => {
                    if (!user) setShowAuthModal(true);
                    else setShowDepositModal(true);
                  }}
                  onWithdraw={() => {
                    if (!user) setShowAuthModal(true);
                    else setShowWithdrawModal(true);
                  }}
                  onHistory={() => {
                    if (!user) setShowAuthModal(true);
                    else setShowHistoryModal(true);
                  }}
                  onCustomerService={() => setShowSupportModal(true)}
                  onShareTeam={() => setCurrentTab('team')}
                  onFaq={() => setShowSupportModal(true)}
                />

                {/* Daily Check-In (UGX 300) & UGX 5,000 Welcome Bonus Indicator */}
                <DailyCheckinBanner
                  onOpenDeposit={() => {
                    if (!user) {
                      setAuthMode('register');
                      setShowAuthModal(true);
                    } else {
                      setShowDepositModal(true);
                    }
                  }}
                />

                {/* Yield Notice Toast */}
                {yieldNotice && (
                  <div
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs animate-fade-in ${
                      yieldNotice.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : yieldNotice.type === 'info'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="font-medium">{yieldNotice.message}</span>
                    </div>
                    <button
                      onClick={() => setYieldNotice(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Active Participations Section if any */}
                {user && activePurchases.length > 0 && (
                  <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Active Equipment Fleet ({activePurchases.length})
                        </h3>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Earning Daily
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {activePurchases.map(pur => {
                        const matchedProduct = products.find(p => p.id === pur.product_id);
                        const img = matchedProduct?.image_url || pur.image_url;
                        const dailyProfit = matchedProduct?.daily_income || pur.daily_income || Math.round(pur.amount_paid * pur.return_rate);

                        return (
                          <div
                            key={pur.id}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {img ? (
                                <img
                                  src={img}
                                  alt={pur.product_name}
                                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-orange-600/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-xs flex-shrink-0">
                                  VIP
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white block truncate">
                                  {pur.product_name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                                    +{formatUGX(dailyProfit)}/day
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {pur.duration_days ? `${pur.duration_days}d plan` : '180d plan'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="font-black text-emerald-600 dark:text-emerald-400 block text-xs">
                                +{formatUGX(pur.total_accrued_reward || 0)}
                              </span>
                              <span className="text-[9px] text-slate-400 uppercase font-bold">Total Accrued</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Claim Daily Operating Profits Button */}
                    <div className="pt-1">
                      <button
                        onClick={handleClaimYield}
                        disabled={isClaimingYield}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>
                          {isClaimingYield ? 'Collecting Daily Operating Profits...' : "Collect Today's Profits to Wallet"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Hot Products Preview Section */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                        Featured Equipment Assets
                      </h3>
                      <p className="text-xs text-slate-400">
                        Commercial units with audited daily operating yields
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentTab('products')}
                      className="text-xs font-bold text-orange-500 hover:text-orange-400 flex items-center gap-0.5"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {products.slice(0, 3).map(prod => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onSelect={handleProductParticipate}
                      />
                    ))}
                  </div>
                </div>

                {/* Important Platform Regulatory Notice */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200 block mb-0.5">
                      VENDRA Financial Ledger Integrity:
                    </span>
                    All financial figures are queried from verified double-entry database transactions. Available balance cannot be altered client-side. Return figures are mathematical formula projections based on actual equipment operating terms.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCTS */}
            {currentTab === 'products' && (
              <div className="p-4 space-y-4 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      VENDRA Investment Fleet
                    </h2>
                    <p className="text-xs text-slate-400">
                      180-Day commercial equipment leasing with automated daily payout
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all flex-shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Plan Table</span>
                  </button>
                </div>

                {/* Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setProductCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        productCategoryFilter === cat
                          ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white shadow-sm shadow-orange-500/20'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Products List */}
                {isLoadingProducts && products.length === 0 ? (
                  <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                    <span>Loading equipment catalog...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 text-xs">
                    No products found in this category.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredProducts.map(prod => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onSelect={handleProductParticipate}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TEAM */}
            {currentTab === 'team' && (
              user ? (
                <TeamPage />
              ) : (
                <div className="p-6 text-center py-24 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    Sign in to View Team Network
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Access your multi-level referral commissions, invitation link, and team metrics.
                  </p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-xs shadow-md"
                  >
                    Sign In or Create Account
                  </button>
                </div>
              )
            )}

            {/* TAB 4: MINE */}
            {currentTab === 'mine' && (
              user ? (
                <MinePage
                  onOpenHistory={() => setShowHistoryModal(true)}
                  onOpenSupport={() => setShowSupportModal(true)}
                  onOpenAdmin={() => setShowAdminModal(true)}
                  onOpenRecharge={() => setShowDepositModal(true)}
                  onOpenWithdraw={() => setShowWithdrawModal(true)}
                />
              ) : (
                <div className="p-6 text-center py-24 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    Access Your VENDRA Account
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Sign in with your phone number to access your verified ledger, deposits, and profile settings.
                  </p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-xs shadow-md"
                  >
                    Sign In or Create Account
                  </button>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={tab => {
          if (!user && (tab === 'team' || tab === 'mine')) {
            setShowAuthModal(true);
          } else {
            setCurrentTab(tab);
          }
        }}
      />

      {/* Floating Help & Support Quick Action */}
      <FloatingHelpButton onOpenSupportModal={() => setShowSupportModal(true)} />

      {/* MODALS */}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={() => {
            setSelectedProduct(null);
            fetchActivePurchases();
          }}
          onNeedRecharge={() => {
            setSelectedProduct(null);
            setShowDepositModal(true);
          }}
        />
      )}

      {/* Deposit / Recharge Modal */}
      {showDepositModal && (
        <DepositModal
          onClose={() => setShowDepositModal(false)}
          onSuccess={() => {
            setShowDepositModal(false);
            refreshUserData();
          }}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WithdrawModal
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            refreshUserData();
          }}
          onOpenDeposit={() => {
            setShowWithdrawModal(false);
            setShowDepositModal(true);
          }}
        />
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <HistoryModal onClose={() => setShowHistoryModal(false)} />
      )}

      {/* Customer Support Modal */}
      {showSupportModal && (
        <CustomerServiceModal onClose={() => setShowSupportModal(false)} />
      )}

      {/* Admin Dashboard Modal */}
      {showAdminModal && (
        <AdminDashboardModal onClose={() => setShowAdminModal(false)} />
      )}

      {/* Notifications Modal */}
      {showNotificationModal && (
        <NotificationModal onClose={() => setShowNotificationModal(false)} />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authMode}
        onClose={() => setShowAuthModal(false)}
      />

      {/* VENDRA Investment Plan Table Comparison Modal */}
      <VendraPlanTableModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSelectPlan={(vipLevel) => {
          const matched = products.find(p => p.vip_level === vipLevel || p.name.includes(vipLevel));
          if (matched) {
            setSelectedProduct(matched);
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
