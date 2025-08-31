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
  const [loading, setLoading] = useState(false); // Start with false to avoid loading state

  // Remove localStorage dependency completely - start fresh each time
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting Supabase authentication for:', email);
      
      // Use Supabase auth for login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError || !authData.user) {
        console.log('Authentication failed:', authError?.message);
        return false;
      }
      
      // Get user details from public.users table
      const dbUser = await databaseService.getUserByEmail(email);
      
      if (!dbUser || dbUser.status !== 'active') {
        console.log('Authentication failed: User not found or inactive');
        await supabase.auth.signOut(); // Clean up auth session
        return false;
      }
      
      // Update last login
      await databaseService.updateUser(dbUser.id, {
        last_login: new Date().toISOString()
      });
      
      // Set user session (memory only - no localStorage)
      const userData = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role
      };
      
      setUser(userData);
      
      console.log('Supabase authentication successful for:', email, 'Auth User ID:', authData.user.id);
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      await supabase.auth.signOut(); // Clean up on error
      return false;
    }
  };

  const logout = () => {
    // Sign out from Supabase auth
    supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}