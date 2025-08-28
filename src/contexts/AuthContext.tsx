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
        }
      } catch (error) {
        console.error('Session check error:', error);
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
      console.log('🔐 Attempting database authentication for:', email);
      
      // Authenticate directly against the database users table
      const dbUser = await databaseService.getUserByEmail(email);
      
      if (!dbUser) {
        console.log('Authentication failed: User not found in database');
        return false;
      }
      
      if (dbUser.status !== 'active') {
        console.log('Authentication failed: User account is inactive');
        return false;
      }
      
      // Verify password (for demo, accepting 'password123' for all users)
      if (password !== 'password123') {
        console.log('Authentication failed: Invalid password');
        return false;
      }
      
      // Set user session with database user data
      const userData = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Database authentication successful for:', email, 'Database User ID:', dbUser.id);
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  const logout = () => {
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