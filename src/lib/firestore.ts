"use client";

import {
  Timestamp,
  collection,
  doc,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { Break, Log, Notification, Pass, User } from "@/lib/types";
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
};

export const docRefs = {
  user: (uid: string) => (db ? doc(db, "users", uid) : null),
  pass: (id: string) => (db ? doc(db, "passes", id) : null),
  log: (id: string) => (db ? doc(db, "logs", id) : null),
  break: (id: string) => (db ? doc(db, "breaks", id) : null),
  notification: (id: string) => (db ? doc(db, "notifications", id) : null),
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
      };
    },
  },
  pass: {
    fromFirestore: (snap: QueryDocumentSnapshot<DocumentData> | any): Pass => {
      const data = snap.data();
      return {
        id: snap.id,
        studentName: data.studentName ?? "",
        reason: data.reason ?? "",
        issuedBy: data.issuedBy ?? "",
        issuedAt: toMillis(data.issuedAt),
        expiresAt: toMillis(data.expiresAt),
        status: data.status ?? "active",
      };
    },
  },
  log: {
    fromFirestore: (snap: QueryDocumentSnapshot<DocumentData> | any): Log => {
      const data = snap.data();
      return {
        id: snap.id,
        studentName: data.studentName ?? "",
        reason: data.reason ?? "",
        issuedBy: data.issuedBy ?? "",
        issuedAt: toMillis(data.issuedAt),
        expiresAt: toMillis(data.expiresAt),
        status: data.status ?? "active",
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
};

export const serverCreatedAt = () => serverTimestamp();
