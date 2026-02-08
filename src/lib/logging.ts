"use client";

import { addDoc } from "firebase/firestore";
import { collections, serverCreatedAt } from "@/lib/firestore";

type LogPayload = {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
};

export const logAction = async ({
  userId,
  action,
  entityType,
  entityId,
  details,
}: LogPayload) => {
  const col = collections.logs();
  if (!col) return;
  await addDoc(col, {
    userId,
    action,
    entityType,
    entityId,
    details: details ?? null,
    timestamp: serverCreatedAt(),
  });
};
