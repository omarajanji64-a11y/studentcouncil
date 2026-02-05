import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

type NotificationDoc = {
  title?: string;
  message?: string;
  senderId?: string;
  senderName?: string;
  senderRole?: string;
};

export const onNotificationCreated = functions.firestore
  .document("notifications/{notificationId}")
  .onCreate(async (snap, context) => {
    const notification = snap.data() as NotificationDoc;
    const notificationId = context.params.notificationId as string;

    const title = notification.title ?? "New notification";
    const body = notification.message ?? "";
    const senderId = notification.senderId ?? "";

    const usersSnap = await db
      .collection("users")
      .where("role", "==", "member")
      .where("notificationsEnabled", "==", true)
      .get();

    const tokenEntries: { uid: string; token: string }[] = [];
    usersSnap.forEach((doc) => {
      if (doc.id === senderId) return;
      const data = doc.data() || {};
      const tokens = Array.isArray(data.notificationTokens)
        ? (data.notificationTokens as string[])
        : [];
      tokens.forEach((token) => {
        tokenEntries.push({ uid: doc.id, token });
      });
    });

    if (!tokenEntries.length) {
      return;
    }

    const userResults = new Map<
      string,
      { success: number; failure: number; errors: string[] }
    >();
    const tokensToRemove: { uid: string; token: string }[] = [];

    const chunkSize = 500;
    for (let i = 0; i < tokenEntries.length; i += chunkSize) {
      const chunk = tokenEntries.slice(i, i + chunkSize);
      const response = await messaging.sendEachForMulticast({
        tokens: chunk.map((entry) => entry.token),
        notification: {
          title,
          body,
        },
        data: {
          notificationId,
          senderId,
        },
      });

      response.responses.forEach((res, index) => {
        const entry = chunk[index];
        const current =
          userResults.get(entry.uid) || { success: 0, failure: 0, errors: [] };
        if (res.success) {
          current.success += 1;
        } else {
          current.failure += 1;
          if (res.error?.code) {
            current.errors.push(res.error.code);
          }
          if (
            res.error?.code === "messaging/registration-token-not-registered" ||
            res.error?.code === "messaging/invalid-registration-token"
          ) {
            tokensToRemove.push(entry);
          }
        }
        userResults.set(entry.uid, current);
      });
    }

    const logBatch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    userResults.forEach((result, uid) => {
      const logRef = db
        .collection("notification_logs")
        .doc(`${notificationId}_${uid}`);
      logBatch.set(
        logRef,
        {
          notificationId,
          userId: uid,
          sentAt: now,
          successCount: result.success,
          failureCount: result.failure,
          errors: result.errors.slice(0, 5),
        },
        { merge: true }
      );
    });

    tokensToRemove.forEach(({ uid, token }) => {
      const userRef = db.collection("users").doc(uid);
      logBatch.update(userRef, {
        notificationTokens: admin.firestore.FieldValue.arrayRemove(token),
      });
    });

    await logBatch.commit();
  });
