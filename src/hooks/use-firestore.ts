"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Timestamp,
  addDoc,
  arrayUnion,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Query,
} from "firebase/firestore";
import type { Break, Complaint, Duty, Log, Notification, Pass, User } from "@/lib/types";
import { collections, converters, docRefs, serverCreatedAt } from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { logAction } from "@/lib/logging";

type LoadingState<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh?: () => void;
};

const getActorRole = async (actorId: string): Promise<User["role"] | null> => {
  const actorRef = docRefs.user(actorId);
  if (!actorRef) throw new Error("Firestore not configured");
  const snapshot = await getDoc(actorRef);
  if (!snapshot.exists()) return null;
  const role = snapshot.data()?.role;
  return role === "admin" || role === "supervisor" || role === "member" ? role : null;
};

const assertBreakManagerActor = async (actorId?: string) => {
  if (!actorId) throw new Error("Only supervisors and admins can manage breaks.");
  const role = await getActorRole(actorId);
  if (role !== "admin" && role !== "supervisor") {
    throw new Error("Only supervisors and admins can manage breaks.");
  }
};

const useCollection = <T,>(
  q: Query<DocumentData> | null,
  mapDoc: (snap: any) => T,
  realtime = true
): LoadingState<T> => {
  const [state, setState] = useState<LoadingState<T>>({
    data: [],
    loading: true,
    error: null,
  });
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!q) {
      setState({ data: [], loading: false, error: "Firestore not configured" });
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | null = null;

    const runOnce = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const snapshot = await getDocs(q);
        if (!active) return;
        setState({
          data: snapshot.docs.map((doc) => mapDoc(doc)),
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : "Failed to load data.";
        setState((prev) => ({
          data: prev.data,
          loading: false,
          error: message,
        }));
      }
    };

    if (realtime) {
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!active) return;
          setState({
            data: snapshot.docs.map((doc) => mapDoc(doc)),
            loading: false,
            error: null,
          });
        },
        (error) => {
          if (!active) return;
          setState({ data: [], loading: false, error: error.message });
        }
      );
    } else {
      runOnce();
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [q, mapDoc, realtime, refreshTick]);

  return {
    ...state,
    refresh: realtime ? undefined : () => setRefreshTick((prev) => prev + 1),
  };
};

const usePollingCollection = <T,>(
  q: Query<DocumentData> | null,
  mapDoc: (snap: any) => T,
  intervalMs = 10000
): LoadingState<T> => {
  const [state, setState] = useState<LoadingState<T>>({
    data: [],
    loading: true,
    error: null,
  });
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!q) {
      setState({ data: [], loading: false, error: "Firestore not configured" });
      return;
    }
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const run = async () => {
      try {
        const snapshot = await getDocs(q);
        if (!active) return;
        setState({
          data: snapshot.docs.map((doc) => mapDoc(doc)),
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : "Failed to load data.";
        setState((prev) => ({
          data: prev.data,
          loading: false,
          error: message,
        }));
      }
    };

    run();
    timer = setInterval(run, intervalMs);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [q, mapDoc, intervalMs, refreshTick]);

  return {
    ...state,
    refresh: () => setRefreshTick((prev) => prev + 1),
  };
};

type BaseQueryOptions = {
  enabled?: boolean;
  realtime?: boolean;
};

export const useUsers = (options: BaseQueryOptions = {}) => {
  const { enabled = true, realtime = true } = options;
  const q = useMemo(() => {
    if (!enabled) return null;
    const col = collections.users();
    return col ? query(col) : null;
  }, [enabled]);
  return useCollection<User>(q, converters.user.fromFirestore, realtime);
};

export const useUsersPolling = (enabled = true, intervalMs = 10000) => {
  const q = useMemo(() => {
    if (!enabled) return null;
    const col = collections.users();
    return col ? query(col) : null;
  }, [enabled]);
  return usePollingCollection<User>(q, converters.user.fromFirestore, intervalMs);
};

type PassQueryOptions = {
  status?: Pass["status"];
  enabled?: boolean;
  realtime?: boolean;
  limit?: number;
};

export const usePasses = (options: PassQueryOptions = {}) => {
  const { status, enabled = true, realtime = true, limit: limitCount = 50 } = options;
  const q = useMemo(() => {
    if (!enabled) return null;
    const col = collections.passes();
    if (!col) return null;
    const constraints = [];
    if (status) constraints.push(where("status", "==", status));
    constraints.push(orderBy("issuedAt", "desc"));
    if (limitCount) constraints.push(limit(limitCount));
    return query(col, ...constraints);
  }, [status, enabled, limitCount]);
  return useCollection<Pass>(q, converters.pass.fromFirestore, realtime);
};

type ActivePassOptions = {
  enabled?: boolean;
  realtime?: boolean;
  limit?: number;
};

export const useActivePasses = (options: ActivePassOptions = {}) => {
  const { enabled = true, realtime = true, limit: limitCount = 50 } = options;
  const q = useMemo(() => {
    if (!enabled) return null;
    const col = collections.passes();
    if (!col) return null;
    const constraints: any[] = [where("status", "in", ["active", "pending"])];
    const normalizedLimit =
      typeof limitCount === "number" ? Math.floor(limitCount) : 0;
    if (normalizedLimit > 0) {
      constraints.push(limit(normalizedLimit));
    }
    return query(col, ...constraints);
  }, [enabled, limitCount]);
  return useCollection<Pass>(q, converters.pass.fromFirestore, realtime);
};

type LogQueryOptions = {
  enabled?: boolean;
  limit?: number;
  sinceMs?: number;
  untilMs?: number;
  realtime?: boolean;
};

export const useLogs = (options: LogQueryOptions = {}) => {
  const {
    enabled = true,
    limit: limitCount,
    sinceMs,
    untilMs,
    realtime = true,
  } = options;
  const q = useMemo(() => {
    if (!enabled) return null;
    const col = collections.logs();
    if (!col) return null;
    const constraints = [];
    if (typeof sinceMs === "number") {
      constraints.push(where("timestamp", ">=", Timestamp.fromMillis(sinceMs)));
    }
    if (typeof untilMs === "number") {
      constraints.push(where("timestamp", "<=", Timestamp.fromMillis(untilMs)));
    }
    constraints.push(orderBy("timestamp", "desc"));
    if (limitCount) constraints.push(limit(limitCount));
    return query(col, ...constraints);
  }, [enabled, sinceMs, untilMs, limitCount]);
  return useCollection<Log>(q, converters.log.fromFirestore, realtime);
};

export const useUserLogs = (
  uid?: string,
  options: { enabled?: boolean; realtime?: boolean; sinceMs?: number; untilMs?: number; limit?: number } = {}
) => {
  const { enabled = true, realtime = true, sinceMs, untilMs, limit: limitCount } = options;
  const q = useMemo(() => {
    if (!enabled || !uid) return null;
    const col = collections.logs();
    if (!col) return null;
    const constraints: any[] = [where("userId", "==", uid)];
    if (typeof sinceMs === "number") {
      constraints.push(where("timestamp", ">=", Timestamp.fromMillis(sinceMs)));
    }
    if (typeof untilMs === "number") {
      constraints.push(where("timestamp", "<=", Timestamp.fromMillis(untilMs)));
    }
    constraints.push(orderBy("timestamp", "desc"));
    if (limitCount) constraints.push(limit(limitCount));
    return query(col, ...constraints);
  }, [uid, enabled, sinceMs, untilMs, limitCount]);
  return useCollection<Log>(q, converters.log.fromFirestore, realtime);
};

export const useBreaks = (options: BaseQueryOptions = {}) => {
  const { enabled = true, realtime = true } = options;
  const q = useMemo(() => {
    if (!enabled) return null;
    const col = collections.breaks();
    return col ? query(col) : null;
  }, [enabled]);
  return useCollection<Break>(q, converters.breakItem.fromFirestore, realtime);
};

export const useBreaksPolling = (intervalMs = 10000) => {
  const q = useMemo(() => {
    const col = collections.breaks();
    return col ? query(col) : null;
  }, []);
  return usePollingCollection<Break>(q, converters.breakItem.fromFirestore, intervalMs);
};

export const useNotifications = (
  enabled = true,
  limitCount = 50,
  realtime = true
) => {
  const q = useMemo(() => {
    if (!enabled) return null;
    const col = collections.notifications();
    if (!col) return null;
    if (limitCount) {
      return query(col, orderBy("createdAt", "desc"), limit(limitCount));
    }
    return query(col, orderBy("createdAt", "desc"));
  }, [enabled, limitCount]);
  return useCollection<Notification>(
    q,
    converters.notification.fromFirestore,
    realtime
  );
};

export const useDuties = (options: BaseQueryOptions = {}) => {
  const { enabled = true, realtime = true } = options;
  const q = useMemo(() => {
    if (!enabled) return null;
    const col = collections.duties();
    return col ? query(col) : null;
  }, [enabled]);
  return useCollection<Duty>(q, converters.duty.fromFirestore, realtime);
};

export const useDutiesPolling = (intervalMs = 10000) => {
  const q = useMemo(() => {
    const col = collections.duties();
    return col ? query(col) : null;
  }, []);
  return usePollingCollection<Duty>(q, converters.duty.fromFirestore, intervalMs);
};

type ComplaintQueryOptions = {
  studentId?: string;
  enabled?: boolean;
  realtime?: boolean;
  sinceMs?: number;
  limit?: number;
};

export const useComplaints = (options: ComplaintQueryOptions = {}) => {
  const { studentId, enabled = true, realtime = true, sinceMs, limit: limitCount } = options;
  const q = useMemo(() => {
    if (!enabled) return null;
    const col = collections.complaints();
    if (!col) return null;
    const constraints = [];
    if (studentId) {
      constraints.push(where("studentId", "==", studentId));
    }
    if (typeof sinceMs === "number") {
      constraints.push(where("timestamp", ">=", Timestamp.fromMillis(sinceMs)));
      constraints.push(orderBy("timestamp", "desc"));
    } else if (limitCount) {
      constraints.push(orderBy("timestamp", "desc"));
    }
    if (limitCount) constraints.push(limit(limitCount));
    if (!constraints.length) return query(col);
    return query(col, ...constraints);
  }, [studentId, enabled, sinceMs, limitCount]);
  return useCollection<Complaint>(
    q,
    converters.complaint.fromFirestore,
    realtime
  );
};

export const useComplaintsPolling = (intervalMs = 10000) => {
  const q = useMemo(() => {
    const col = collections.complaints();
    return col ? query(col) : null;
  }, []);
  return usePollingCollection<Complaint>(q, converters.complaint.fromFirestore, intervalMs);
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
      canEditSchedule: user.canEditSchedule ?? false,
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
  if (!auth?.currentUser) throw new Error("Firebase Auth not configured");
  const token = await auth.currentUser.getIdToken();
  const response = await fetch("/api/admin/update-user-role", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ uid, role }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Could not update the user's role.");
  }
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

export const updateUserGender = async (
  uid: string,
  gender: User["gender"],
  actorId?: string
) => {
  if (!auth?.currentUser) throw new Error("Firebase Auth not configured");
  const token = await auth.currentUser.getIdToken();
  const response = await fetch("/api/admin/update-user-gender", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ uid, gender: gender ?? "" }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Could not update sex.");
  }
  await logAction({
    userId: actorId ?? "system",
    action: "user_gender_updated",
    entityType: "user",
    entityId: uid,
    details: { gender },
  });
};

export const updateUserScheduleEditor = async (
  uid: string,
  canEditSchedule: boolean,
  actorId?: string
) => {
  if (!auth?.currentUser) throw new Error("Firebase Auth not configured");
  const token = await auth.currentUser.getIdToken();
  const response = await fetch("/api/admin/update-user-schedule-editor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ uid, canEditSchedule }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Could not update schedule editor access.");
  }
  await logAction({
    userId: actorId ?? "system",
    action: "schedule_editor_updated",
    entityType: "user",
    entityId: uid,
    details: { canEditSchedule },
  });
};

export const clearTemporaryPasswordFlag = async (uid: string, actorId?: string) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await updateDoc(ref, {
    mustChangePassword: false,
    updatedAt: serverCreatedAt(),
  });
  await logAction({
    userId: actorId ?? uid,
    action: "password_updated",
    entityType: "user",
    entityId: uid,
  });
};

export const updateUserProfileBasics = async (
  uid: string,
  profile: { name: string; gender: User["gender"]; mustChangePassword?: boolean }
) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  const payload: Record<string, any> = {
    name: profile.name,
    gender: profile.gender ?? null,
    updatedAt: serverCreatedAt(),
  };
  if (typeof profile.mustChangePassword === "boolean") {
    payload.mustChangePassword = profile.mustChangePassword;
  }
  await setDoc(ref, payload, { merge: true });
  await logAction({
    userId: uid,
    action: "profile_updated",
    entityType: "user",
    entityId: uid,
    details: { name: profile.name, gender: profile.gender ?? null },
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
  gender?: User["gender"];
  password: string;
  actorId?: string;
}) => {
  if (!auth?.currentUser) throw new Error("Firebase Auth not configured");
  const token = await auth.currentUser.getIdToken();
  const response = await fetch("/api/admin/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: profile.email,
      password: profile.password,
      name: profile.name,
      role: profile.role ?? "member",
      gender: profile.gender ?? "",
    }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Could not create auth user.");
  }
  const data = await response.json().catch(() => ({}));
  const uid = data?.uid;
  if (!uid) throw new Error("Could not create auth user.");
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
  await assertBreakManagerActor(actorId);
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
  await assertBreakManagerActor(actorId);
  const ref = docRefs.break(breakId);
  if (!ref) throw new Error("Firestore not configured");
  const payload: Record<string, any> = { ...update };
  if (typeof update.startTime === "number") {
    payload.startTime = Timestamp.fromMillis(update.startTime);
  }
  if (typeof update.endTime === "number") {
    payload.endTime = Timestamp.fromMillis(update.endTime);
  }
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
  await assertBreakManagerActor(actorId);
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
  const targetName = (complaint.title ?? "").trim();
  const targetNameLower = targetName.toLowerCase();
  const ref = await addDoc(col, {
    ...complaint,
    targetName,
    targetNameLower,
    status: complaint.status ?? "Open",
    timestamp: serverCreatedAt(),
  });
  await logAction({
    userId: actorId ?? complaint.studentId ?? "system",
    action: "complaint_created",
    entityType: "complaint",
    entityId: ref.id,
    details: {
      title: complaint.title,
      dutyId: complaint.dutyId ?? null,
      studentId: complaint.studentId,
      dutyLocation: complaint.dutyLocation ?? null,
    },
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

export const markNotificationsRead = async (
  uid: string,
  count = 0,
  actorId?: string
) => {
  const ref = docRefs.user(uid);
  if (!ref) throw new Error("Firestore not configured");
  await updateDoc(ref, {
    lastNotificationReadAt: serverCreatedAt(),
    updatedAt: serverCreatedAt(),
  });
  await logAction({
    userId: actorId ?? "system",
    action: "notifications_marked_read",
    entityType: "notification",
    entityId: uid,
    details: { count },
  });
};
