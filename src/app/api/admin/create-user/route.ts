import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const email = (body.email || "").toString().trim().toLowerCase();
  const password = (body.password || "").toString();
  const name = (body.name || "").toString().trim();
  const role = (body.role || "member").toString();
  const gender = (body.gender || "").toString().trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  try {
    const auth = getAuth(adminApp);
    const decoded = await auth.verifyIdToken(token);

    const db = getFirestore(adminApp);
    const requesterSnap = await db
      .collection("users")
      .doc(decoded.uid)
      .get();
    const requesterRole =
      requesterSnap.data()?.role ?? (decoded as { role?: string }).role;
    if (requesterRole !== "supervisor" && requesterRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name || undefined,
    });
    await auth.setCustomUserClaims(userRecord.uid, { role });

    await db.collection("users").doc(userRecord.uid).set(
      {
        name: name || "Staff Member",
        email,
        role,
        gender: gender || null,
        avatar: null,
        notificationsEnabled: false,
        canEditSchedule: false,
        mustChangePassword: true,
        lastNotificationReadAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ uid: userRecord.uid });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to create user." },
      { status: 500 }
    );
  }
}
