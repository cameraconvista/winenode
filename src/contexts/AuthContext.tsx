import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePersistentMobileAdminAuth } from '../hooks/usePersistentMobileAdminAuth';

interface User {
  id: string;
  role: string;
  email?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMobileDevice: boolean;
  hasPersistedSession: boolean;
  login: (userData: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  // Integra l'hook di persistenza mobile admin
  const { isMobileDevice, hasPersistedSession } = usePersistentMobileAdminAuth({ 
    user, 
    setUser 
  });

  // Simula login admin per testing (da rimuovere in produzione)
  useEffect(() => {
    const initAuth = async () => {
      // Attendi che l'hook di persistenza abbia tentato il ripristino
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Se non c'è utente persistito e siamo su mobile, simula login admin
      if (!user && isMobileDevice) {
        console.log('🧪 Simulazione login admin mobile per testing');
        setUser({
          id: 'admin-user-id',
          role: 'admin',
          email: 'admin@winenode.app'
        });
      } else if (!user && !isMobileDevice) {
        // Desktop: sempre autenticato come utente normale
        setUser({
          id: 'user-id',
          role: 'user',
          email: 'user@winenode.app'
        });
      }
      
      setIsHydrating(false);
    };

    initAuth();
  }, [user, isMobileDevice]);

  const login = (userData: User) => {
    console.log('🔐 Login utente:', userData.role);
    setUser(userData);
  };

  const logout = () => {
    console.log('🚪 Logout utente');
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user && !isHydrating,
    isAdmin: user?.role === 'admin',
    isMobileDevice,
    hasPersistedSession,
    login,
    logout,
    setUser
  };

  // Mostra loading durante hydration
  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-app-accent"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
