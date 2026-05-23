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
  role?: 'user' | 'vendedor' | 'admin' | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [spicyMode, setSpicyModeState] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpicyModeState(localStorage.getItem('spicyMode') === 'true');
    }
  }, []);

  const setSpicyMode = (val: boolean) => {
    setSpicyModeState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('spicyMode', val ? 'true' : 'false');
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
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
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
      if (!mounted) return;

      // Prevent duplicate fetches on initial mount
      if (!isInitialized) {
        return;
      }

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
        console.error('Error in onAuthStateChange handler:', err);
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
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, logout, spicyMode, setSpicyMode }}>
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

