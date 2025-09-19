import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'enumerator' | 'supervisor' | 'zo' | 'ro';
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
              role: userProfile.role
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
    if (isSupabaseConfigured()) {
      try {
        // Try Supabase authentication first
        const { data, error } = await supabase!.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          console.error('❌ Supabase auth error:', error);
          return await mockLogin(email, password);
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
            return await mockLogin(email, password);
          }

          if (userProfile) {
            const user: User = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email,
              role: userProfile.role
            };
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            console.log('✅ User logged in via Supabase:', user.email);
            return true;
          }
        }
      } catch (error) {
        console.error('❌ Supabase login error:', error);
        return await mockLogin(email, password);
      }
    }
    
    return await mockLogin(email, password);
  };

  const mockLogin = async (email: string, password: string): Promise<boolean> => {
    console.log('🔄 Using mock authentication...');
    
    const mockUsers: User[] = [
      { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      { id: '2', name: 'John Enumerator', email: 'enum@example.com', role: 'enumerator' },
      { id: '3', name: 'Jane Supervisor', email: 'super@example.com', role: 'supervisor' },
      { id: '4', name: 'ZO User', email: 'zo@example.com', role: 'zo' },
      { id: '5', name: 'RO User', email: 'ro@example.com', role: 'ro' },
    ];

    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'password123') {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      console.log('✅ User logged in via mock auth:', foundUser.email);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (isSupabaseConfigured()) {
      supabase!.auth.signOut().catch(error => {
        console.error('❌ Supabase logout error:', error);
      });
    }
    
    setUser(null);
    localStorage.removeItem('user');
    // Clear only user-specific chat sessions, preserve global unanswered queries
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('chatSessions_')) {
        localStorage.removeItem(key);
      }
      // Note: We intentionally do NOT remove 'globalUnansweredQueries' here
      // as they should persist across all user sessions for admin access
    });
    console.log('✅ User logged out');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}