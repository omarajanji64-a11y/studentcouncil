"use client";

import {
  Timestamp,
  collection,
  doc,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { Break, Complaint, Duty, Log, Notification, Pass, User } from "@/lib/types";
import { db } from "@/lib/firebase";

export type FirestoreDoc<T> = T & { id: string };

const toMillis = (value: unknown, fallback = Date.now()) => {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return fallback;
};

export const collections = {
  users: () => (db ? collection(db, "users") : null),
  passes: () => (db ? collection(db, "passes") : null),
  logs: () => (db ? collection(db, "logs") : null),
  breaks: () => (db ? collection(db, "breaks") : null),
  notifications: () => (db ? collection(db, "notifications") : null),
  duties: () => (db ? collection(db, "duties") : null),
  complaints: () => (db ? collection(db, "complaints") : null),
};

export const docRefs = {
  user: (uid: string) => (db ? doc(db, "users", uid) : null),
  pass: (id: string) => (db ? doc(db, "passes", id) : null),
  log: (id: string) => (db ? doc(db, "logs", id) : null),
  break: (id: string) => (db ? doc(db, "breaks", id) : null),
  notification: (id: string) => (db ? doc(db, "notifications", id) : null),
  duty: (id: string) => (db ? doc(db, "duties", id) : null),
  complaint: (id: string) => (db ? doc(db, "complaints", id) : null),
};

export const converters = {
  user: {
    fromFirestore: (snap: QueryDocumentSnapshot<DocumentData> | any): User => {
      const data = snap.data();
      return {
        uid: snap.id,
        name: data.name ?? "Unknown",
        email: data.email ?? "",
        role: data.role ?? "member",
        avatar: data.avatar ?? undefined,
        notificationsEnabled: data.notificationsEnabled ?? false,
        canEditSchedule: data.canEditSchedule ?? false,
      };
    },
  },
  pass: {
    fromFirestore: (snap: QueryDocumentSnapshot<DocumentData> | any): Pass => {
      const data = snap.data();
      return {
        id: snap.id,
        studentName: data.studentName ?? "",
        studentId: data.studentId ?? undefined,
        reason: data.reason ?? "",
        issuedBy: data.issuedBy ?? "",
        issuedById: data.issuedById ?? undefined,
        issuedAt: toMillis(data.issuedAt),
        expiresAt: toMillis(data.expiresAt),
        status: data.status ?? "active",
        passType: data.passType ?? "active_break",
        durationMinutes: data.durationMinutes ?? undefined,
        override: data.override ?? false,
      };
    },
  },
  log: {
    fromFirestore: (snap: QueryDocumentSnapshot<DocumentData> | any): Log => {
      const data = snap.data();
      return {
        id: snap.id,
        timestamp: toMillis(data.timestamp),
        userId: data.userId ?? "system",
        action: data.action ?? "unknown",
        entityType: data.entityType ?? "unknown",
        entityId: data.entityId ?? "",
        details: data.details ?? undefined,
      };
    },
  },
  breakItem: {
    fromFirestore: (snap: QueryDocumentSnapshot<DocumentData> | any): Break => {
      const data = snap.data();
      return {
        id: snap.id,
        name: data.name ?? "",
        startTime: toMillis(data.startTime),
        endTime: toMillis(data.endTime),
      };
    },
  },
  notification: {
    fromFirestore: (snap: QueryDocumentSnapshot<DocumentData> | any): Notification => {
      const data = snap.data();
      return {
        id: snap.id,
        title: data.title ?? "",
        message: data.message ?? "",
        createdAt: toMillis(data.createdAt),
        senderId: data.senderId ?? undefined,
        senderName: data.senderName ?? undefined,
        senderRole: data.senderRole ?? undefined,
      };
    },
  },
  duty: {
    fromFirestore: (snap: QueryDocumentSnapshot<DocumentData> | any): Duty => {
      const data = snap.data();
      return {
        id: snap.id,
        title: data.title ?? "",
        startTime: toMillis(data.startTime),
        endTime: toMillis(data.endTime),
        memberIds: data.memberIds ?? [],
        memberNames: data.memberNames ?? [],
        breakId: data.breakId ?? undefined,
        location: data.location ?? undefined,
      };
    },
  },
  complaint: {
    fromFirestore: (snap: QueryDocumentSnapshot<DocumentData> | any): Complaint => {
      const data = snap.data();
      return {
        id: snap.id,
        studentId: data.studentId ?? "",
        studentName: data.studentName ?? undefined,
        dutyId: data.dutyId ?? null,
        title: data.title ?? "",
        description: data.description ?? "",
        timestamp: toMillis(data.timestamp),
        status: data.status ?? "Open",
        handledBy: data.handledBy ?? undefined,
        handledById: data.handledById ?? undefined,
        notes: data.notes ?? undefined,
      };
    },
  },
};

export const serverCreatedAt = () => serverTimestamp();
