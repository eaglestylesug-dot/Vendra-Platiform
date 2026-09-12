import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserProfile, UserFinancialSummary } from '../types/index.ts';
import { auth, googleProvider, signInWithPopup, signOut } from '../firebase.ts';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  token: string | null;
  user: User | null;
  profile: UserProfile | null;
  summary: UserFinancialSummary;
  unreadCount: number;
  isLoading: boolean;
  isAdmin: boolean;
  firebaseUser: FirebaseUser | null;
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, fbUser => {
      setFirebaseUser(fbUser);
    });
    return () => unsubscribe();
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
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
        setSummary(data.summary || defaultSummary);
        setUnreadCount(data.unread_notifications_count || 0);
      } else {
        // Token invalid or expired
        localStorage.removeItem('vendra_auth_token');
        setToken(null);
        setUser(null);
        setProfile(null);
        setSummary(defaultSummary);
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const login = async (phone: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    localStorage.setItem('vendra_auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    setSummary(data.summary || defaultSummary);
  };

  const register = async (phone: string, fullName: string, password: string, referralCode?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        full_name: fullName,
        password,
        referral_code: referralCode || undefined
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    localStorage.setItem('vendra_auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    setSummary(data.summary || defaultSummary);
  };

  const adminLogin = async (username: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Admin authorization failed.');
    }

    localStorage.setItem('vendra_auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    setSummary(data.summary || defaultSummary);
  };

  const claimOwnerRole = async (username?: string, password?: string) => {
    const storedToken = localStorage.getItem('vendra_auth_token');
    if (!storedToken) throw new Error('Not logged in.');
    const res = await fetch('/api/admin/claim-owner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to claim approver authority.');
    if (data.token) {
      localStorage.setItem('vendra_auth_token', data.token);
      setToken(data.token);
    }
    if (data.user) setUser(data.user);
    if (data.profile) setProfile(data.profile);
    await refreshUserData();
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      localStorage.setItem('vendra_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setSummary(data.summary || defaultSummary);
    } catch (err: any) {
      console.error('[Firebase Auth] Error:', err);
      throw new Error(err.message || 'Failed to sign in with Google.');
    }
  };

  const logout = () => {
    localStorage.removeItem('vendra_auth_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setSummary(defaultSummary);
    signOut(auth).catch(() => {});
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
        firebaseUser,
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
