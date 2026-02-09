import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

export async function POST(request: Request) {
  if (!projectId || !clientEmail || !privateKey) {
    return NextResponse.json(
      { error: "Missing Firebase admin credentials." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const uid = (body.uid || "").toString().trim();
  const canEditSchedule = Boolean(body.canEditSchedule);

  if (!uid) {
    return NextResponse.json(
      { error: "Valid uid is required." },
      { status: 400 }
    );
  }

  try {
    const auth = getAuth(adminApp);
    const decoded = await auth.verifyIdToken(token);

    const db = getFirestore(adminApp);
    const requesterSnap = await db.collection("users").doc(decoded.uid).get();
    const requesterRole = requesterSnap.data()?.role;
    if (requesterRole !== "supervisor" && requesterRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetUser = await auth.getUser(uid);
    const existingClaims = targetUser.customClaims ?? {};
    await auth.setCustomUserClaims(uid, {
      ...existingClaims,
      canEditSchedule,
    });

    await db
      .collection("users")
      .doc(uid)
      .set(
        {
          canEditSchedule,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to update schedule editor." },
      { status: 500 }
    );
  }
}
