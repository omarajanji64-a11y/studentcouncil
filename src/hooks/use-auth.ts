"use client";

import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useRef,
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
import { logAction } from "@/lib/logging";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInDemo: (role: "member" | "supervisor" | "admin") => Promise<void>;
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
  canEditSchedule: role !== "member",
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loggedInRef = useRef<string | null>(null);

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
        loggedInRef.current = null;
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
            canEditSchedule: fallback.canEditSchedule ?? false,
          });
          setUser(fallback);
        }
        if (loggedInRef.current !== fbUser.uid) {
          loggedInRef.current = fbUser.uid;
          await logAction({
            userId: fbUser.uid,
            action: "login",
            entityType: "auth",
            entityId: fbUser.uid,
          });
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

  const signInDemo = async (role: "member" | "supervisor" | "admin") => {
    if (!auth) throw new Error("Firebase Auth not configured");
    const credential = await signInAnonymously(auth);
    const ref = docRefs.user(credential.user.uid);
    if (!ref) return;
    const demoProfile: User = {
      uid: credential.user.uid,
      name:
        role === "admin"
          ? "Demo Admin"
          : role === "supervisor"
          ? "Demo Supervisor"
          : "Demo Member",
      email: `${role}@demo.local`,
      role,
      avatar: "https://picsum.photos/seed/demo/40/40",
      notificationsEnabled: true,
      canEditSchedule: role !== "member",
    };
    await setDoc(
      ref,
      {
        name: demoProfile.name,
        email: demoProfile.email,
        role: demoProfile.role,
        avatar: demoProfile.avatar ?? null,
        notificationsEnabled: demoProfile.notificationsEnabled ?? false,
        canEditSchedule: demoProfile.canEditSchedule ?? false,
      },
      { merge: true }
    );
  };

  const logout = async () => {
    if (!auth) return;
    if (user?.uid) {
      await logAction({
        userId: user.uid,
        action: "logout",
        entityType: "auth",
        entityId: user.uid,
      });
    }
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

export const useRequireAuth = (role?: "member" | "supervisor" | "admin") => {
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
      user.role !== "supervisor" &&
      user.role !== "admin"
    ) {
      router.push("/dashboard");
    }
  }, [user, loading, router, role]);

  return { user, loading };
};
