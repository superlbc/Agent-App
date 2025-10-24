import { createContext, useContext } from 'react';
import { AccountInfo } from "@azure/msal-browser";
import { GraphData } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthorized: boolean;
  isAdmin: boolean;
  user: AccountInfo | null;
  graphData: GraphData | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};