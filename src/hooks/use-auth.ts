"use client";

import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In a real app, this would be implemented with Firebase Auth
const mockLogin = async (roleOrUser: 'member' | 'supervisor' | User): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let userData: User;
      if (typeof roleOrUser === 'string') {
        userData = {
          uid: roleOrUser === 'supervisor' ? 'sup-123' : 'mem-456',
          name: roleOrUser === 'supervisor' ? 'Dr. Evelyn Reed' : 'Alex Chen',
          email: roleOrUser === 'supervisor' ? 'e.reed@school.edu' : 'a.chen@school.edu',
          role: roleOrUser,
          avatar: 'https://picsum.photos/seed/100/40/40',
        };
      } else {
        userData = roleOrUser;
      }
      
      localStorage.setItem('canteen-user', JSON.stringify(userData));
      resolve(userData);
    }, 500);
  });
};


const mockLogout = async () => {
    localStorage.removeItem('canteen-user');
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('canteen-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const logout = () => {
    mockLogout();
    setUser(null);
  };

  const value = { user, loading, logout };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useRequireAuth = (role?: 'member' | 'supervisor') => {
    const { user, loading } = useAuth();
    const router = useRouter();
  
    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      } else if (!loading && user && role && user.role !== role && user.role !== 'supervisor') {
        // Supervisors can access everything
        router.push('/dashboard'); 
      }
    }, [user, loading, router, role]);
  
    return { user, loading };
};


export { mockLogin };
