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
    // Use Supabase authentication
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
              isMockUser: false
            };
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            console.log('✅ User logged in via Supabase:', user.email);
            return true;
          }
        }
      } catch (error) {
        console.error('❌ Supabase connection error:', error);
        // Fallback to mock authentication only if Supabase fails
        const mockUsers: User[] = [
          { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
          { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'John Enumerator', email: 'enum@example.com', role: 'enumerator' },
          { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'Jane Supervisor', email: 'super@example.com', role: 'supervisor' },
          { id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', name: 'ZO User', email: 'zo@example.com', role: 'zo' },
          { id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', name: 'RO User', email: 'ro@example.com', role: 'ro' },
        ];

        const foundMockUser = mockUsers.find(u => u.email === email);
        if (foundMockUser && password === 'password123') {
          console.log('🔄 Using mock authentication as fallback for:', email);
          const mockUser = { ...foundMockUser, isMockUser: true };
          setUser(mockUser);
          localStorage.setItem('user', JSON.stringify(mockUser));
          console.log('✅ User logged in via mock auth fallback:', foundMockUser.email, `(${foundMockUser.role})`);
          return true;
        }
        
        return false;
      }
    } else {
      // No Supabase configuration - use mock authentication
      const mockUsers: User[] = [
        { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
        { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'John Enumerator', email: 'enum@example.com', role: 'enumerator' },
        { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'Jane Supervisor', email: 'super@example.com', role: 'supervisor' },
        { id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', name: 'ZO User', email: 'zo@example.com', role: 'zo' },
        { id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', name: 'RO User', email: 'ro@example.com', role: 'ro' },
      ];

      const foundMockUser = mockUsers.find(u => u.email === email);
      if (foundMockUser && password === 'password123') {
        console.log('🔄 Using mock authentication (no Supabase config):', email);
        const mockUser = { ...foundMockUser, isMockUser: true };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        console.log('✅ User logged in via mock auth:', foundMockUser.email, `(${foundMockUser.role})`);
        return true;
      }
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