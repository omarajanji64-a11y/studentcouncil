"use client";

import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { onSnapshot, setDoc } from "firebase/firestore";
import { auth, firebaseReady } from "@/lib/firebase";
import { converters, docRefs } from "@/lib/firestore";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInDemo: (role: "member" | "supervisor") => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildFallbackUser = (fbUser: FirebaseUser, role: User["role"]): User => ({
  uid: fbUser.uid,
  name: fbUser.displayName || "Staff Member",
  email: fbUser.email || "unknown@school.edu",
  role,
  avatar: fbUser.photoURL || "https://picsum.photos/seed/100/40/40",
  notificationsEnabled: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firebaseReady) {
      setLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        unsubscribeProfile?.();
        unsubscribeProfile = null;
        setUser(null);
        setLoading(false);
        return;
      }

      const ref = docRefs.user(fbUser.uid);
      if (!ref) {
        setUser(null);
        setLoading(false);
        return;
      }

      unsubscribeProfile?.();
      unsubscribeProfile = onSnapshot(ref, async (snapshot) => {
        if (snapshot.exists()) {
          setUser(converters.user.fromFirestore(snapshot));
        } else {
          const fallback = buildFallbackUser(fbUser, "member");
          await setDoc(ref, {
            name: fallback.name,
            email: fallback.email,
            role: fallback.role,
            avatar: fallback.avatar ?? null,
            notificationsEnabled: fallback.notificationsEnabled ?? false,
          });
          setUser(fallback);
        }
        setLoading(false);
      });
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth not configured");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInDemo = async (role: "member" | "supervisor") => {
    if (!auth) throw new Error("Firebase Auth not configured");
    const credential = await signInAnonymously(auth);
    const ref = docRefs.user(credential.user.uid);
    if (!ref) return;
    const demoProfile: User = {
      uid: credential.user.uid,
      name: role === "supervisor" ? "Demo Supervisor" : "Demo Member",
      email: `${role}@demo.local`,
      role,
      avatar: "https://picsum.photos/seed/demo/40/40",
      notificationsEnabled: true,
    };
    await setDoc(
      ref,
      {
        name: demoProfile.name,
        email: demoProfile.email,
        role: demoProfile.role,
        avatar: demoProfile.avatar ?? null,
        notificationsEnabled: demoProfile.notificationsEnabled ?? false,
      },
      { merge: true }
    );
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const value = { user, loading, signIn, signInDemo, logout };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useRequireAuth = (role?: "member" | "supervisor") => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (
      !loading &&
      user &&
      role &&
      user.role !== role &&
      user.role !== "supervisor"
    ) {
      router.push("/dashboard");
    }
  }, [user, loading, router, role]);

  return { user, loading };
};
