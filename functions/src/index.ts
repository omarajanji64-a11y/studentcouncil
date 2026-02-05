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

type CreateAuthUserRequest = {
  email?: string;
  password?: string;
  name?: string;
  role?: "member" | "supervisor";
};

export const createAuthUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be signed in to create users."
    );
  }

  const requesterSnap = await db.collection("users").doc(context.auth.uid).get();
  const requesterRole = requesterSnap.data()?.role;
  if (requesterRole !== "supervisor") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only supervisors can create users."
    );
  }

  const payload = (data || {}) as CreateAuthUserRequest;
  const email = (payload.email || "").trim().toLowerCase();
  const password = payload.password || "";
  const name = (payload.name || "").trim();
  const role = payload.role || "member";

  if (!email || !password) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email and password are required."
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name || undefined,
    });
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    return { uid: userRecord.uid };
  } catch (error: any) {
    const message =
      error?.message || "Unable to create a new authentication user.";
    throw new functions.https.HttpsError("internal", message);
  }
});

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
