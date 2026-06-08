// Authentication context — provides login/logout state and the current user's
// profile (including role) to any component in the tree via useAuth().
//
// Roles drive feature access across the entire app:
//   staff   — can mark attendance and view training only
//   manager — staff permissions + register/enroll participants
//   admin   — full access including search, reports, and program management
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, isSupabaseConfigured, Profile } from '../../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; role: 'staff' | 'manager' | 'admin'; id: string; email: string } | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; role: 'staff' | 'manager' | 'admin'; id: string; email: string } | null>(null);
  // loading=true during the initial session check so route guards wait before
  // rendering or redirecting — prevents a blank flash on page refresh.
  const [loading, setLoading] = useState(true);

  // On mount, restore the session from Supabase (persisted in localStorage).
  // This is what keeps users logged in across page refreshes.
  useEffect(() => {
    checkUser();
  }, []);

  // Restores an existing Supabase session and hydrates the user state.
  // Also enforces the admin-approval gate: unapproved accounts are signed out
  // immediately so they cannot access protected routes.
  const checkUser = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        // The profiles table stores app-level data (role, approval status)
        // separate from Supabase Auth's own user record.
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        if (profile) {
          // Accounts must be approved by an admin before they can log in.
          if (!profile.approved) {
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          setIsAuthenticated(true);
          setUser({
            id: profile.id,
            name: profile.full_name,
            role: profile.role,
            email: profile.email
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Authenticates against Supabase Auth, then fetches the matching profile row.
  // Returns a typed result object so callers can display user-facing error messages.
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          return { success: false, error: 'Profile not found. Please contact administrator.' };
        }

        if (profile) {
          // Block unapproved accounts even if Supabase Auth succeeded.
          if (!profile.approved) {
            await supabase.auth.signOut();
            return { success: false, error: 'Your account is pending approval. Please wait for administrator confirmation.' };
          }

          setIsAuthenticated(true);
          setUser({
            id: profile.id,
            name: profile.full_name,
            role: profile.role,
            email: profile.email
          });
          return { success: true };
        }
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Signs the user out of Supabase and clears local auth state, causing
  // ProtectedRoute to redirect back to /login on the next render.
  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook — throws if called outside an AuthProvider so misconfigured
// components surface immediately during development.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}