import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { databaseService } from '../services/DatabaseService';
import { supabase } from '../lib/supabase';

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

  // Initialize without session check to avoid storage errors
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting authentication for:', email);
      
      // Use demo authentication only (no Supabase auth to avoid storage issues)
      if (password === 'password123') {
        const demoUsers = {
          'admin@example.com': { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Admin User', email, role: 'admin' as const },
          'enum@example.com': { id: '550e8400-e29b-41d4-a716-446655440001', name: 'John Enumerator', email, role: 'enumerator' as const },
          'super@example.com': { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Jane Supervisor', email, role: 'supervisor' as const },
          'zo@example.com': { id: '550e8400-e29b-41d4-a716-446655440003', name: 'ZO User', email, role: 'zo' as const },
          'ro@example.com': { id: '550e8400-e29b-41d4-a716-446655440004', name: 'RO User', email, role: 'ro' as const },
        };
        
        const userData = demoUsers[email as keyof typeof demoUsers];
        if (userData) {
          setUser(userData);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}