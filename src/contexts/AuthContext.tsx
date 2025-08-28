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
      // Check if we have valid Supabase configuration
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Only attempt Supabase auth if properly configured AND not using demo environment
      const isSupabaseConfigured = supabaseUrl && 
                                   supabaseKey && 
                                   supabaseUrl !== 'your_supabase_project_url' && 
                                   supabaseKey !== 'your_supabase_anon_key' &&
                                   !supabaseUrl.includes('buhrurxzleuorxzjsuwt.supabase.co');
      
      if (isSupabaseConfigured) {
        try {
          console.log('🔐 Attempting Supabase authentication for:', email);
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
              console.log('Supabase authentication successful for:', email);
              return true;
            }
          }
          
          console.log('🔄 Supabase authentication failed, using mock authentication for:', email);
        } catch (supabaseError) {
          console.log('🔄 Supabase service unavailable, using mock authentication:', email);
        }
      } else {
        console.log('🔄 Supabase not configured, using mock authentication for:', email);
      }

      // Mock authentication fallback
      console.log('🎭 Using mock authentication for:', email);
    const mockUsers: User[] = [
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      { id: '550e8400-e29b-41d4-a716-446655440002', name: 'John Enumerator', email: 'enum@example.com', role: 'enumerator' },
      { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Jane Supervisor', email: 'super@example.com', role: 'supervisor' },
      { id: '550e8400-e29b-41d4-a716-446655440004', name: 'ZO User', email: 'zo@example.com', role: 'zo' },
      { id: '550e8400-e29b-41d4-a716-446655440005', name: 'RO User', email: 'ro@example.com', role: 'ro' },
    ];

    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'password123') {
      console.log('Mock user found:', foundUser.email, 'with ID:', foundUser.id);
      
      try {
        // First check if user exists in database by email
        let existingUser = await databaseService.getUserByEmail(foundUser.email);
        if (!existingUser) {
          console.log('User not found in database, creating:', foundUser.email);
          existingUser = await databaseService.createUser({
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            role: foundUser.role as any
          });
          console.log('User created in database with ID:', existingUser?.id);
        } else {
          console.log('User found in database with ID:', existingUser.id);
        }
        
        if (existingUser) {
          // Use the database user's actual ID
          const userData = {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role
          };
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('Mock user logged in successfully with database ID:', existingUser.id);
          return true;
        }
      } catch (error) {
        console.error('Error checking/creating mock user in database:', error);
        console.log('Database operations failed, using mock user data as fallback');
      }
      
      // Final fallback: use mock user data directly if database operations fail
      try {
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
        console.log('Using mock user data as fallback:', foundUser.email);
        return true;
      } catch (fallbackError) {
        console.error('Even fallback failed:', fallbackError);
      }
    }
    
    console.log('Login failed: no matching user found or incorrect password');
    return false;
    } catch (error) {
      console.error('Login process failed with error:', error);
      return false;
    }
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