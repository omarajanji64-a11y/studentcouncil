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
import type { Break, Complaint, Duty, Log, Notification, Pass, User } from "@/lib/types";
import { collections, converters, docRefs, serverCreatedAt } from "@/lib/firestore";
import { db, functions } from "@/lib/firebase";
import { logAction } from "@/lib/logging";

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
    return col ? query(col, orderBy("timestamp", "desc")) : null;
  }, []);
  return useRealtimeCollection<Log>(q, converters.log.fromFirestore);
};

export const useBreaks = () => {
  const q = useMemo(() => {
    const col = collections.breaks();
    return col ? query(col) : null;
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

export const useDuties = () => {
  const q = useMemo(() => {
    const col = collections.duties();
    return col ? query(col) : null;
  }, []);
  return useRealtimeCollection<Duty>(q, converters.duty.fromFirestore);
};

export const useComplaints = () => {
  const q = useMemo(() => {
    const col = collections.complaints();
    return col ? query(col) : null;
  }, []);
  return useRealtimeCollection<Complaint>(q, converters.complaint.fromFirestore);
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
  await logAction({
    userId: user.uid,
    action: "user_profile_upserted",
    entityType: "user",
    entityId: user.uid,
    details: { name: user.name, role: user.role },
  });
};

export const updateUserRole = async (
  uid: string,
  role: User["role"],
  actorId?: string
) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await updateDoc(ref, { role, updatedAt: serverCreatedAt() });
  await logAction({
    userId: actorId ?? "system",
    action: "role_changed",
    entityType: "user",
    entityId: uid,
    details: { role },
  });
};

export const updateUserNotificationSettings = async (
  uid: string,
  enabled: boolean,
  actorId?: string
) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await updateDoc(ref, { notificationsEnabled: enabled, updatedAt: serverCreatedAt() });
  await logAction({
    userId: actorId ?? "system",
    action: "notification_settings_updated",
    entityType: "user",
    entityId: uid,
    details: { enabled },
  });
};

export const saveNotificationToken = async (uid: string, token: string) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await updateDoc(ref, {
    notificationTokens: arrayUnion(token),
    updatedAt: serverCreatedAt(),
  });
  await logAction({
    userId: uid,
    action: "notification_token_saved",
    entityType: "user",
    entityId: uid,
  });
};

export const removeUser = async (uid: string, actorId?: string) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await deleteDoc(ref);
  await logAction({
    userId: actorId ?? "system",
    action: "user_deleted",
    entityType: "user",
    entityId: uid,
  });
};

export const createUser = async (profile: {
  name: string;
  email: string;
  role?: User["role"];
  password: string;
  actorId?: string;
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
  await logAction({
    userId: profile.actorId ?? "system",
    action: "user_created",
    entityType: "user",
    entityId: uid,
    details: { name: profile.name, role: profile.role ?? "member" },
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
  const ref = await addDoc(col, {
    ...notification,
    createdAt: serverCreatedAt(),
  });
  await logAction({
    userId: notification.senderId,
    action: "notification_created",
    entityType: "notification",
    entityId: ref.id,
    details: { title: notification.title },
  });
};

export const createPass = async (
  pass: Omit<Pass, "id" | "issuedAt" | "status"> & { expiresAt: number },
  actorId?: string
) => {
  const passesCol = collections.passes();
  if (!passesCol) throw new Error("Firestore not configured");

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

  await logAction({
    userId: actorId ?? pass.issuedById ?? "system",
    action: pass.override ? "pass_override_created" : "pass_created",
    entityType: "pass",
    entityId: passRef.id,
    details: {
      studentName: pass.studentName,
      passType: pass.passType ?? "active_break",
      override: pass.override ?? false,
    },
  });
};

export const updatePassStatus = async (
  passId: string,
  status: Pass["status"],
  actorId?: string
) => {
  const ref = docRefs.pass(passId);
  if (!ref) throw new Error("Firestore not configured");
  await updateDoc(ref, { status });
  await logAction({
    userId: actorId ?? "system",
    action: "pass_status_updated",
    entityType: "pass",
    entityId: passId,
    details: { status },
  });
};

export const createBreak = async (breakItem: Omit<Break, "id">, actorId?: string) => {
  const col = collections.breaks();
  if (!col) throw new Error("Firestore not configured");
  const ref = await addDoc(col, {
    ...breakItem,
    startTime: Timestamp.fromMillis(breakItem.startTime),
    endTime: Timestamp.fromMillis(breakItem.endTime),
  });
  await logAction({
    userId: actorId ?? "system",
    action: "break_created",
    entityType: "break",
    entityId: ref.id,
    details: { name: breakItem.name },
  });
};

export const updateBreak = async (
  breakId: string,
  update: Partial<Break>,
  actorId?: string
) => {
  const ref = docRefs.break(breakId);
  if (!ref) throw new Error("Firestore not configured");
  const payload: Record<string, any> = { ...update };
  if (update.startTime) payload.startTime = Timestamp.fromMillis(update.startTime);
  if (update.endTime) payload.endTime = Timestamp.fromMillis(update.endTime);
  await updateDoc(ref, payload);
  await logAction({
    userId: actorId ?? "system",
    action: "break_updated",
    entityType: "break",
    entityId: breakId,
    details: update,
  });
};

export const deleteBreak = async (breakId: string, actorId?: string) => {
  const ref = docRefs.break(breakId);
  if (!ref) throw new Error("Firestore not configured");
  await deleteDoc(ref);
  await logAction({
    userId: actorId ?? "system",
    action: "break_deleted",
    entityType: "break",
    entityId: breakId,
  });
};

export const createDuty = async (
  duty: Omit<Duty, "id">,
  actorId?: string
) => {
  const col = collections.duties();
  if (!col) throw new Error("Firestore not configured");
  const ref = await addDoc(col, {
    ...duty,
    startTime: Timestamp.fromMillis(duty.startTime),
    endTime: Timestamp.fromMillis(duty.endTime),
  });
  await logAction({
    userId: actorId ?? "system",
    action: "duty_created",
    entityType: "duty",
    entityId: ref.id,
    details: { title: duty.title, memberCount: duty.memberIds.length },
  });
  return ref.id;
};

export const updateDuty = async (
  dutyId: string,
  update: Partial<Duty>,
  actorId?: string
) => {
  const ref = docRefs.duty(dutyId);
  if (!ref) throw new Error("Firestore not configured");
  const payload: Record<string, any> = { ...update };
  if (update.startTime) payload.startTime = Timestamp.fromMillis(update.startTime);
  if (update.endTime) payload.endTime = Timestamp.fromMillis(update.endTime);
  await updateDoc(ref, payload);
  await logAction({
    userId: actorId ?? "system",
    action: "duty_updated",
    entityType: "duty",
    entityId: dutyId,
    details: update,
  });
};

export const deleteDuty = async (dutyId: string, actorId?: string) => {
  const ref = docRefs.duty(dutyId);
  if (!ref) throw new Error("Firestore not configured");
  await deleteDoc(ref);
  await logAction({
    userId: actorId ?? "system",
    action: "duty_deleted",
    entityType: "duty",
    entityId: dutyId,
  });
};

export const createComplaint = async (
  complaint: Omit<Complaint, "id" | "timestamp" | "status"> & {
    status?: Complaint["status"];
  },
  actorId?: string
) => {
  const col = collections.complaints();
  if (!col) throw new Error("Firestore not configured");
  const ref = await addDoc(col, {
    ...complaint,
    status: complaint.status ?? "Open",
    timestamp: serverCreatedAt(),
  });
  await logAction({
    userId: actorId ?? complaint.studentId ?? "system",
    action: "complaint_created",
    entityType: "complaint",
    entityId: ref.id,
    details: { title: complaint.title, dutyId: complaint.dutyId ?? null },
  });
  return ref.id;
};

export const updateComplaint = async (
  complaintId: string,
  update: Partial<Complaint>,
  actorId?: string
) => {
  const ref = docRefs.complaint(complaintId);
  if (!ref) throw new Error("Firestore not configured");
  await updateDoc(ref, update);
  await logAction({
    userId: actorId ?? "system",
    action: "complaint_updated",
    entityType: "complaint",
    entityId: complaintId,
    details: update,
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

export const markNotificationsRead = async (
  uid: string,
  ids: string[],
  actorId?: string
) => {
  if (!db) throw new Error("Firestore not configured");
  if (!ids.length) return;
  const batch = writeBatch(db);
  ids.forEach((notificationId) => {
    const ref = doc(db, "users", uid, "notification_reads", notificationId);
    batch.set(ref, { readAt: serverCreatedAt() }, { merge: true });
  });
  await batch.commit();
  await logAction({
    userId: actorId ?? "system",
    action: "notifications_marked_read",
    entityType: "notification",
    entityId: uid,
    details: { count: ids.length },
  });
};
