import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'enumerator' | 'supervisor' | 'zo' | 'ro';
  isMockUser?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (session?.user) {
          // Get user profile from users table
          const { data: userProfile, error } = await supabase!
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
            setUser(null);
          } else if (userProfile) {
            const user: User = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email,
              role: userProfile.role,
              isMockUser: false
            };
            setUser(user);
            console.log('✅ User authenticated via Supabase:', user.email);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Supabase auth check error:', error);
        checkLocalStorageAuth();
      }
    } else {
      checkLocalStorageAuth();
    }
    setLoading(false);
  };

  const checkLocalStorageAuth = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // First try Supabase authentication
    if (isSupabaseConfigured()) {
      try {
        console.log('🔄 Attempting Supabase authentication...');
        const { data, error } = await supabase!.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          console.error('❌ Supabase auth failed:', error.message);
          return false;
        }

        if (data.user) {
          // Get user profile from users table
          const { data: userProfile, error: profileError } = await supabase!
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          if (profileError) {
            console.error('❌ Error fetching user profile:', profileError);
            return false;
          }

          if (userProfile) {
            const user: User = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email,
              role: userProfile.role,
            };
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            console.log('✅ User logged in via Supabase:', user.email);
            return true;
          } else {
            console.error('❌ No user profile found for:', email);
            // Fall back to mock authentication
            return tryMockAuthentication(email, password);
          }
        }
      } catch (error) {
        console.error('❌ Supabase connection error:', error);
        // Fall back to mock authentication on connection error
        return tryMockAuthentication(email, password);
      }
    }
    
    // If Supabase not configured, use mock authentication
    return tryMockAuthentication(email, password);
  };

  const tryMockAuthentication = (email: string, password: string): boolean => {
    console.log('🔄 Attempting mock authentication for:', email);
    
    // Mock user credentials
    const mockUsers = [
      { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' as const, password: 'password123' },
      { id: '2', name: 'John Enumerator', email: 'enum@example.com', role: 'enumerator' as const, password: 'password123' },
      { id: '3', name: 'Jane Supervisor', email: 'super@example.com', role: 'supervisor' as const, password: 'password123' },
      { id: '4', name: 'ZO User', email: 'zo@example.com', role: 'zo' as const, password: 'password123' },
      { id: '5', name: 'RO User', email: 'ro@example.com', role: 'ro' as const, password: 'password123' },
    ];

    const mockUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (mockUser) {
      const user: User = {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        isMockUser: true
      };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ Mock user logged in:', user.email);
      return true;
    } else {
      console.log('❌ Mock authentication failed for:', email);
      return false;
    }
  };

  const logout = () => {
    if (isSupabaseConfigured()) {
      supabase!.auth.signOut().catch(error => {
        console.error('❌ Supabase logout error:', error);
      });
    }
    
    setUser(null);
    localStorage.removeItem('user');
    console.log('✅ User logged out');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}