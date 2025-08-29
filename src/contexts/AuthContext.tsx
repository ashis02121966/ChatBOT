import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  // Check for existing user session from localStorage
  useEffect(() => {
    const checkStoredSession = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Verify user still exists and is active in database
          const dbUser = await databaseService.getUser(userData.id);
          if (dbUser && dbUser.status === 'active') {
            setUser({
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              role: dbUser.role
            });
            
            // Update last login
            await databaseService.updateUser(dbUser.id, {
              last_login: new Date().toISOString()
            });
          } else {
            // User no longer exists or is inactive, clear session
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkStoredSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting database authentication for:', email);
      
      // Get user from database
      const dbUser = await databaseService.getUserByEmail(email);
      
      if (!dbUser) {
        console.log('Authentication failed: User not found in database');
        return false;
      }
      
      if (dbUser.status !== 'active') {
        console.log('Authentication failed: User account is inactive');
        return false;
      }
      
      // Verify password using database service
      const isValidPassword = await databaseService.verifyUserPassword(email, password);
      if (!isValidPassword) {
        console.log('Authentication failed: Invalid password');
        return false;
      }
      
      // Update last login
      await databaseService.updateUser(dbUser.id, {
        last_login: new Date().toISOString()
      });
      
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
    // Clear user-specific chat sessions
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('chatSessions_')) {
        localStorage.removeItem(key);
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
        
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
      try {
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.warn('localStorage not available, using session storage only');
      }
      console.log('Database authentication successful for:', email, 'Database User ID:', dbUser.id);
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('user');
      // Clear only user-specific chat sessions, preserve global unanswered queries
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chatSessions_')) {
          localStorage.removeItem(key);
        }
        // Note: We intentionally do NOT remove 'globalUnansweredQueries' here
        // as they should persist across all user sessions for admin access
      });
    } catch (error) {
      console.warn('localStorage not available during logout');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}