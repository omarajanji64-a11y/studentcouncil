"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Timestamp,
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Query,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { Break, Log, Notification, Pass, User } from "@/lib/types";
import { collections, converters, docRefs, serverCreatedAt } from "@/lib/firestore";
import { db, functions } from "@/lib/firebase";

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

export const useNotifications = (enabled = true) => {
  const q = useMemo(() => {
    if (!enabled) return null;
    const col = collections.notifications();
    return col ? query(col, orderBy("createdAt", "desc")) : null;
  }, [enabled]);
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

export const updateUserNotificationSettings = async (
  uid: string,
  enabled: boolean
) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await updateDoc(ref, { notificationsEnabled: enabled, updatedAt: serverCreatedAt() });
};

export const saveNotificationToken = async (uid: string, token: string) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await updateDoc(ref, {
    notificationTokens: arrayUnion(token),
    updatedAt: serverCreatedAt(),
  });
};

export const removeUser = async (uid: string) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await deleteDoc(ref);
};

export const createUser = async (profile: {
  name: string;
  email: string;
  role?: User["role"];
  password: string;
}) => {
  if (!functions) throw new Error("Firebase Functions not configured");
  const callable = httpsCallable<
    {
      email: string;
      password: string;
      name: string;
      role: User["role"];
    },
    { uid: string }
  >(functions, "createAuthUser");
  const result = await callable({
    email: profile.email,
    password: profile.password,
    name: profile.name,
    role: profile.role ?? "member",
  });
  const uid = result.data?.uid;
  if (!uid) throw new Error("Could not create auth user.");
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await setDoc(ref, {
    name: profile.name,
    email: profile.email,
    role: profile.role ?? "member",
    avatar: null,
    notificationsEnabled: false,
    updatedAt: serverCreatedAt(),
  });
};

export const createNotification = async (
  notification: Omit<Notification, "id" | "createdAt"> & {
    senderId: string;
    senderName: string;
    senderRole: string;
  }
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

export const useNotificationReads = (uid?: string) => {
  const q = useMemo(() => {
    if (!uid) return null;
    if (!collections.users()) return null;
    return query(
      collection(doc(db!, "users", uid), "notification_reads"),
      orderBy("readAt", "desc")
    );
  }, [uid]);
  return useRealtimeCollection<{ id: string }>(
    q,
    (snap: any) => ({ id: snap.id })
  );
};

export const markNotificationsRead = async (uid: string, ids: string[]) => {
  if (!db) throw new Error("Firestore not configured");
  if (!ids.length) return;
  const batch = writeBatch(db);
  ids.forEach((notificationId) => {
    const ref = doc(db, "users", uid, "notification_reads", notificationId);
    batch.set(ref, { readAt: serverCreatedAt() }, { merge: true });
  });
  await batch.commit();
};
