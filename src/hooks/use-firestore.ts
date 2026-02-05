"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Timestamp,
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type DocumentData,
  type Query,
} from "firebase/firestore";
import type { Break, Log, Notification, Pass, User } from "@/lib/types";
import { collections, converters, docRefs, serverCreatedAt } from "@/lib/firestore";

type LoadingState<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
};

const useRealtimeCollection = <T,>(
  q: Query<DocumentData> | null,
  mapDoc: (snap: any) => T
): LoadingState<T> => {
  const [state, setState] = useState<LoadingState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!q) {
      setState({ data: [], loading: false, error: "Firestore not configured" });
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setState({
          data: snapshot.docs.map((doc) => mapDoc(doc)),
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState({ data: [], loading: false, error: error.message });
      }
    );

    return () => unsubscribe();
  }, [q, mapDoc]);

  return state;
};

export const useUsers = () => {
  const q = useMemo(() => {
    const col = collections.users();
    return col ? query(col, orderBy("name", "asc")) : null;
  }, []);
  return useRealtimeCollection<User>(q, converters.user.fromFirestore);
};

export const usePasses = () => {
  const q = useMemo(() => {
    const col = collections.passes();
    return col ? query(col, orderBy("issuedAt", "desc")) : null;
  }, []);
  return useRealtimeCollection<Pass>(q, converters.pass.fromFirestore);
};

export const useLogs = () => {
  const q = useMemo(() => {
    const col = collections.logs();
    return col ? query(col, orderBy("issuedAt", "desc")) : null;
  }, []);
  return useRealtimeCollection<Log>(q, converters.log.fromFirestore);
};

export const useBreaks = () => {
  const q = useMemo(() => {
    const col = collections.breaks();
    return col ? query(col, orderBy("startTime", "asc")) : null;
  }, []);
  return useRealtimeCollection<Break>(q, converters.breakItem.fromFirestore);
};

export const useNotifications = () => {
  const q = useMemo(() => {
    const col = collections.notifications();
    return col ? query(col, orderBy("createdAt", "desc")) : null;
  }, []);
  return useRealtimeCollection<Notification>(
    q,
    converters.notification.fromFirestore
  );
};

export const upsertUserProfile = async (user: User) => {
  const ref = docRefs.user(user.uid);
  if (!ref) throw new Error("Firestore not configured");
  await setDoc(
    ref,
    {
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar ?? null,
      updatedAt: serverCreatedAt(),
    },
    { merge: true }
  );
};

export const updateUserRole = async (uid: string, role: User["role"]) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await updateDoc(ref, { role, updatedAt: serverCreatedAt() });
};

export const removeUser = async (uid: string) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await deleteDoc(ref);
};

export const createNotification = async (
  notification: Omit<Notification, "id" | "createdAt">
) => {
  const col = collections.notifications();
  if (!col) throw new Error("Firestore not configured");
  await addDoc(col, {
    ...notification,
    createdAt: serverCreatedAt(),
  });
};

export const createPass = async (
  pass: Omit<Pass, "id" | "issuedAt" | "status"> & { expiresAt: number }
) => {
  const passesCol = collections.passes();
  const logsCol = collections.logs();
  if (!passesCol || !logsCol) throw new Error("Firestore not configured");

  const issuedAt = Date.now();
  const newPass = {
    ...pass,
    issuedAt,
    status: "active",
  };

  const passRef = await addDoc(passesCol, {
    ...newPass,
    issuedAt: Timestamp.fromMillis(issuedAt),
    expiresAt: Timestamp.fromMillis(pass.expiresAt),
  });

  await addDoc(logsCol, {
    ...newPass,
    passId: passRef.id,
    issuedAt: Timestamp.fromMillis(issuedAt),
    expiresAt: Timestamp.fromMillis(pass.expiresAt),
  });
};

export const updatePassStatus = async (passId: string, status: Pass["status"]) => {
  const ref = docRefs.pass(passId);
  if (!ref) throw new Error("Firestore not configured");
  await updateDoc(ref, { status });
};

export const createBreak = async (breakItem: Omit<Break, "id">) => {
  const col = collections.breaks();
  if (!col) throw new Error("Firestore not configured");
  await addDoc(col, {
    ...breakItem,
    startTime: Timestamp.fromMillis(breakItem.startTime),
    endTime: Timestamp.fromMillis(breakItem.endTime),
  });
};
