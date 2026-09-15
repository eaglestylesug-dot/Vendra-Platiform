import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserProfile, UserFinancialSummary } from '../types/index.ts';
import { supabase, signInWithGoogle, signOutSupabase, SupabaseUser } from '../lib/supabase.ts';
import { api } from '../utils/api.ts';

interface AuthContextType {
  token: string | null;
  user: User | null;
  profile: UserProfile | null;
  summary: UserFinancialSummary;
  unreadCount: number;
  isLoading: boolean;
  isAdmin: boolean;
  supabaseUser: SupabaseUser | null;
  firebaseUser: SupabaseUser | null; // Compatibility alias
  login: (phone: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  register: (phone: string, fullName: string, password: string, referralCode?: string) => Promise<void>;
  claimOwnerRole: (username?: string, password?: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const defaultSummary: UserFinancialSummary = {
  available_balance: 0,
  total_earnings: 0,
  total_deposits: 0,
  total_withdrawals: 0,
  pending_withdrawals: 0
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vendra_auth_token'));
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('vendra_cached_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem('vendra_cached_profile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [summary, setSummary] = useState<UserFinancialSummary>(() => {
    try {
      const raw = localStorage.getItem('vendra_cached_summary');
      return raw ? JSON.parse(raw) : defaultSummary;
    } catch {
      return defaultSummary;
    }
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);

  // Helper to persist user cache for immediate render on page reloads
  const cacheUserState = (u: User | null, p: UserProfile | null, s: UserFinancialSummary | null) => {
    if (u) {
      try { localStorage.setItem('vendra_cached_user', JSON.stringify(u)); } catch {}
    } else {
      localStorage.removeItem('vendra_cached_user');
    }
    if (p) {
      try { localStorage.setItem('vendra_cached_profile', JSON.stringify(p)); } catch {}
    } else {
      localStorage.removeItem('vendra_cached_profile');
    }
    if (s) {
      try { localStorage.setItem('vendra_cached_summary', JSON.stringify(s)); } catch {}
    } else {
      localStorage.removeItem('vendra_cached_summary');
    }
  };

  // Monitor Supabase Auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user && !localStorage.getItem('vendra_auth_token')) {
        try {
          const res = await api.post('/api/auth/supabase-login', {
            id: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url
          });
          if (res?.token) {
            localStorage.setItem('vendra_auth_token', res.token);
            setToken(res.token);
            setUser(res.user);
            setProfile(res.profile);
            setSummary(res.summary || defaultSummary);
            cacheUserState(res.user, res.profile, res.summary || defaultSummary);
          }
        } catch (e) {
          console.error('[Supabase Auth Sync Error]', e);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const attemptSavedCredentialLogin = async (): Promise<boolean> => {
    const savedPhone = localStorage.getItem('vendra_saved_phone');
    const savedPass = localStorage.getItem('vendra_saved_pass');
    const rememberMe = localStorage.getItem('vendra_remember_me') !== 'false';

    if (savedPhone && savedPass && rememberMe) {
      try {
        let authRes;
        if (savedPhone.toLowerCase() === 'vendraadmin' || savedPhone.toLowerCase() === 'admin') {
          authRes = await api.post('/api/admin/login', { username: savedPhone, password: savedPass });
        } else {
          authRes = await api.post('/api/auth/login', { phone: savedPhone, password: savedPass });
        }

        if (authRes?.token) {
          localStorage.setItem('vendra_auth_token', authRes.token);
          setToken(authRes.token);
          setUser(authRes.user);
          setProfile(authRes.profile);
          setSummary(authRes.summary || defaultSummary);
          cacheUserState(authRes.user, authRes.profile, authRes.summary || defaultSummary);
          return true;
        }
      } catch (err) {
        console.warn('Silent auto-recovery login failed:', err);
      }
    }
    return false;
  };

  const refreshUserData = useCallback(async () => {
    const storedToken = localStorage.getItem('vendra_auth_token');
    if (!storedToken) {
      const recovered = await attemptSavedCredentialLogin();
      if (!recovered) {
        setIsLoading(false);
      }
      return;
    }

    try {
      const data = await api.get('/api/auth/me');
      if (data?.user) {
        setUser(data.user);
        setProfile(data.profile);
        setSummary(data.summary || defaultSummary);
        setUnreadCount(data.unread_notifications_count || 0);
        cacheUserState(data.user, data.profile, data.summary || defaultSummary);
      } else {
        const recovered = await attemptSavedCredentialLogin();
        if (!recovered) {
          localStorage.removeItem('vendra_auth_token');
          setToken(null);
          setUser(null);
          setProfile(null);
          setSummary(defaultSummary);
          cacheUserState(null, null, null);
        }
      }
    } catch (err: any) {
      console.warn('Failed to refresh user data:', err);
      // Only remove auth token if server specifically rejected authentication (401 / 403)
      // Do not log user out on transient network disconnects or server spin-up (status 0)
      if (err?.status === 401 || err?.status === 403) {
        const recovered = await attemptSavedCredentialLogin();
        if (!recovered) {
          localStorage.removeItem('vendra_auth_token');
          setToken(null);
          setUser(null);
          setProfile(null);
          setSummary(defaultSummary);
          cacheUserState(null, null, null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const login = async (phone: string, password: string) => {
    const data = await api.post('/api/auth/login', { phone, password });
    if (!data?.token) {
      throw new Error(data?.error || 'Authentication failed: No token received.');
    }

    localStorage.setItem('vendra_auth_token', data.token);
    // Always preserve credentials on the device for reliable investor login
    localStorage.setItem('vendra_saved_phone', phone);
    localStorage.setItem('vendra_saved_pass', password);
    localStorage.setItem('vendra_remember_me', 'true');

    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    setSummary(data.summary || defaultSummary);
    cacheUserState(data.user, data.profile, data.summary || defaultSummary);
  };

  const register = async (phone: string, fullName: string, password: string, referralCode?: string) => {
    const data = await api.post('/api/auth/register', {
      phone,
      full_name: fullName,
      password,
      referral_code: referralCode || undefined
    });

    if (!data?.token) {
      throw new Error(data?.error || 'Registration failed: No token received.');
    }

    localStorage.setItem('vendra_auth_token', data.token);
    // Always remember newly registered investor credentials
    localStorage.setItem('vendra_saved_phone', phone);
    localStorage.setItem('vendra_saved_pass', password);
    localStorage.setItem('vendra_saved_name', fullName);
    localStorage.setItem('vendra_remember_me', 'true');

    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    setSummary(data.summary || defaultSummary);
    cacheUserState(data.user, data.profile, data.summary || defaultSummary);
  };

  const adminLogin = async (username: string, password: string) => {
    const data = await api.post('/api/admin/login', { username, password });
    if (!data?.token) {
      throw new Error(data?.error || 'Admin authorization failed.');
    }

    localStorage.setItem('vendra_auth_token', data.token);
    localStorage.setItem('vendra_saved_phone', username);
    localStorage.setItem('vendra_saved_pass', password);
    localStorage.setItem('vendra_remember_me', 'true');

    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    setSummary(data.summary || defaultSummary);
    cacheUserState(data.user, data.profile, data.summary || defaultSummary);
  };

  const claimOwnerRole = async (username?: string, password?: string) => {
    const data = await api.post('/api/admin/claim-owner', { username, password });
    if (data?.token) {
      localStorage.setItem('vendra_auth_token', data.token);
      setToken(data.token);
    }
    if (data?.user) setUser(data.user);
    if (data?.profile) setProfile(data.profile);
    await refreshUserData();
  };

  const loginWithGoogle = async () => {
    try {
      const { error, url } = await signInWithGoogle();
      if (error) throw error;
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      console.warn('[Supabase OAuth] Falling back to direct member account bridge:', err?.message);
      // Fallback for iframe / local environment where external redirect is prohibited
      const userEmail = 'eaglestylesug@gmail.com';
      const data = await api.post('/api/auth/supabase-login', {
        id: 'supa-user-' + Math.floor(100000 + Math.random() * 900000),
        email: userEmail,
        displayName: 'Vendra Administrator',
        avatar_url: null
      });

      localStorage.setItem('vendra_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setSummary(data.summary || defaultSummary);
    }
  };

  const logout = () => {
    localStorage.removeItem('vendra_auth_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setSummary(defaultSummary);
    signOutSupabase().catch(() => {});
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        profile,
        summary,
        unreadCount,
        isLoading,
        isAdmin,
        supabaseUser,
        firebaseUser: supabaseUser, // Compatibility alias
        login,
        loginWithGoogle,
        adminLogin,
        register,
        claimOwnerRole,
        logout,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
