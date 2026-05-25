'useClient'; // Let's make sure it operates as a Client Component in Next.js
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_active: boolean;
  stripe_customer_id: string | null;
  points: number;
  exact_scores: number;
  goal_difference: number;
  created_at: string;
  referral_code?: string;
  referred_by?: string | null;
  role?: 'user' | 'vendedor' | 'admin' | 'promotor' | null;
  seller_request_status?: 'none' | 'pending' | 'approved' | 'rejected' | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  spicyMode: boolean;
  setSpicyMode: (value: boolean) => void;
  soundMuted: boolean;
  setSoundMuted: (value: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (value: 'light' | 'dark') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [spicyMode, setSpicyModeState] = useState(false);
  const [soundMuted, setSoundMutedState] = useState(true);
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpicyModeState(localStorage.getItem('spicyMode') === 'true');
      
      const savedSound = localStorage.getItem('soundMuted');
      setSoundMutedState(savedSound === null ? true : savedSound === 'true');
      
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        setThemeState(savedTheme);
      } else {
        setThemeState('dark');
      }
    }
  }, []);

  // Update theme html attribute
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const setSpicyMode = (val: boolean) => {
    setSpicyModeState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('spicyMode', val ? 'true' : 'false');
    }
  };

  const setSoundMuted = (val: boolean) => {
    setSoundMutedState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', val ? 'true' : 'false');
    }
  };

  const setTheme = (val: 'light' | 'dark') => {
    setThemeState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', val);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('qui_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching user profile:', error.message);
        setProfile(null);
      } else if (!data) {
        console.warn('Profile record not found in qui_profiles table.');
        setProfile(null);
      } else {
        setProfile(prev => {
          if (prev && 
              prev.id === data.id && 
              prev.is_active === data.is_active && 
              prev.points === data.points && 
              prev.exact_scores === data.exact_scores && 
              prev.goal_difference === data.goal_difference && 
              prev.username === data.username && 
              prev.full_name === data.full_name &&
              prev.is_admin === data.is_admin &&
              prev.role === data.role &&
              prev.seller_request_status === data.seller_request_status) {
            return prev;
          }
          return data as Profile;
        });
      }
    } catch (err) {
      console.warn('Unexpected error fetching profile:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let isInitialized = false;

    // Safety timeout: force loading false if initialization hangs
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization safety timeout triggered. Forcing loading = false.');
        setLoading(false);
      }
    }, 2500);

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[DEBUG] initializeAuth - session user:', session?.user?.email || 'none');
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('[DEBUG] Error getting initial session:', err);
      } finally {
        if (mounted) {
          isInitialized = true;
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes natively without manual visibilitychange handlers
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[DEBUG] onAuthStateChange - event:', event, 'user:', session?.user?.email || 'none');
      if (!mounted) return;

      try {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('[DEBUG] Error in onAuthStateChange handler:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    // Silent visibility auth refresh when tab becomes active after inactivity
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (mounted) {
            if (session?.user) {
              setUser(session.user);
              await fetchProfile(session.user.id);
            } else {
              setUser(null);
              setProfile(null);
            }
          }
        } catch (e) {
          console.warn('Silent visibility auth refresh failed:', e);
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const logout = async () => {
    try {
      // Trigger signOut in background so local UI state clears instantly without waiting for network response
      supabase.auth.signOut().catch(err => console.error('Silent signout failed:', err));
      
      // Manually wipe all Supabase session keys from localStorage and cookies to guarantee 100% absolute logout
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // Wipe session cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }

      setUser(null);
      setProfile(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      refreshProfile, 
      logout, 
      spicyMode, 
      setSpicyMode,
      soundMuted,
      setSoundMuted,
      theme,
      setTheme
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

