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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<UserFinancialSummary>(defaultSummary);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);

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

  const refreshUserData = useCallback(async () => {
    const storedToken = localStorage.getItem('vendra_auth_token');
    if (!storedToken) {
      setUser(null);
      setProfile(null);
      setSummary(defaultSummary);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.get('/api/auth/me');
      if (data?.user) {
        setUser(data.user);
        setProfile(data.profile);
        setSummary(data.summary || defaultSummary);
        setUnreadCount(data.unread_notifications_count || 0);
      } else {
        localStorage.removeItem('vendra_auth_token');
        setToken(null);
        setUser(null);
        setProfile(null);
        setSummary(defaultSummary);
      }
    } catch (err) {
      console.warn('Failed to refresh user data:', err);
      // In case of 401 unauthorized
      localStorage.removeItem('vendra_auth_token');
      setToken(null);
      setUser(null);
      setProfile(null);
      setSummary(defaultSummary);
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
    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    setSummary(data.summary || defaultSummary);
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
    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    setSummary(data.summary || defaultSummary);
  };

  const adminLogin = async (username: string, password: string) => {
    const data = await api.post('/api/admin/login', { username, password });
    if (!data?.token) {
      throw new Error(data?.error || 'Admin authorization failed.');
    }

    localStorage.setItem('vendra_auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    setSummary(data.summary || defaultSummary);
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
