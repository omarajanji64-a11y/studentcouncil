"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { firebaseApp, firebaseReady } from "@/lib/firebase";

export const registerForPushNotifications = async () => {
  if (!firebaseReady || !firebaseApp) {
    throw new Error("Firebase not configured");
  }

  const supported = await isSupported();
  if (!supported) {
    throw new Error("Push notifications are not supported on this device.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission not granted.");
  }

  const registration =
    (await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js")) ||
    (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

  const messaging = getMessaging(firebaseApp);
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    throw new Error("Missing VAPID key.");
  }

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Could not obtain an FCM token.");
  }

  return token;
};
