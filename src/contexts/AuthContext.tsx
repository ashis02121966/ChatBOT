import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { databaseService } from '../services/DatabaseService';

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

  // Check for existing Supabase session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get user profile from database
          const userProfile = await databaseService.getUserByEmail(session.user.email!);
          if (userProfile) {
            setUser({
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email,
              role: userProfile.role
            });
          }
        } else {
          // Fallback to localStorage for demo users
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        // Fallback to localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userProfile = await databaseService.getUserByEmail(session.user.email!);
        if (userProfile) {
          setUser({
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            role: userProfile.role
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Try Supabase authentication first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (data.user && !error) {
        // Get user profile from database
        const userProfile = await databaseService.getUserByEmail(email);
        if (userProfile) {
          const userData = {
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            role: userProfile.role
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          return true;
        }
      }
    } catch (supabaseError) {
      console.log('Supabase auth failed, trying demo credentials:', supabaseError);
    }

    // Mock authentication - replace with actual API call
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
      return true;
    }
    return false;
  };

  const logout = () => {
    // Sign out from Supabase
    supabase.auth.signOut();
    
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
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}