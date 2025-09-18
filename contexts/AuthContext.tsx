import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { User } from '@/services/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
        handleUnauthenticatedUser();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        if (session?.user) {
          await loadUserProfile(session.user);
          handleAuthenticatedUser();
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleUnauthenticatedUser = () => {
    // Check if we're on a public page or have a circle invite token
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const circleInviteToken = urlParams.get('circleInviteToken');
      
      const isPublicPage = currentPath.includes('/circle-invite/') || 
                         currentPath.includes('/app-pitch') ||
                         currentPath.includes('/login') ||
                         currentPath.includes('/invitation-details');
      
      console.log('Unauthenticated user - Path:', currentPath, 'Token:', circleInviteToken, 'IsPublic:', isPublicPage);
      
      // If there's a circle invite token, don't redirect - let the home page handle it
      if (circleInviteToken) {
        console.log('Circle invite token found, staying on current page');
        return;
      }
      
      // If not on a public page and no invite token, redirect to login
      if (!isPublicPage) {
        console.log('Redirecting to login');
        setTimeout(() => router.replace('/login'), 100);
      }
    }
  };

  const handleAuthenticatedUser = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteToken = urlParams.get('invite');
      
      console.log('Authenticated user - Invite token:', inviteToken);
      
      if (inviteToken) {
        // Redirect to invitation details with token preserved
        console.log('Redirecting to invitation details with token:', inviteToken);
        router.replace(`/invitation-details?token=${inviteToken}`);
      } else {
        // Normal login flow
        console.log('Normal login, redirecting to tabs');
        router.replace('/(tabs)');
      }
    } else {
      router.replace('/(tabs)');
    }
  };

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log('Loading user profile for:', authUser.email);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        // Create profile if it doesn't exist
        if (error.code === 'PGRST116') {
          console.log('Creating new profile for user:', authUser.email);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email!,
              full_name: authUser.user_metadata?.full_name || null,
            });

          if (!insertError) {
            setUser({
              id: authUser.id,
              email: authUser.email!,
              full_name: authUser.user_metadata?.full_name || undefined,
            });
          }
        }
      } else {
        console.log('Profile loaded:', profile.email);
        setUser({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || undefined,
          avatar_url: profile.avatar_url || undefined,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    console.log('Signing out user');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setUser(null);
      console.log('User signed out successfully');
      router.replace('/login');
    } else {
      console.error('Error signing out:', error);
    }
    return { error };
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.full_name,
        avatar_url: updates.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, ...updates });
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}