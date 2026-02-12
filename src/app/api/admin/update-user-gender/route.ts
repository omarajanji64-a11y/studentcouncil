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

const validGenders = new Set(["male", "female", ""]);

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
  const gender = (body.gender || "").toString().trim();

  if (!uid || !validGenders.has(gender)) {
    return NextResponse.json(
      { error: "Valid uid and gender are required." },
      { status: 400 }
    );
  }

  try {
    const auth = getAuth(adminApp);
    const decoded = await auth.verifyIdToken(token);

    const db = getFirestore(adminApp);
    const requesterSnap = await db.collection("users").doc(decoded.uid).get();
    const requesterRole =
      requesterSnap.data()?.role ?? (decoded as { role?: string }).role;
    if (requesterRole !== "supervisor" && requesterRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db
      .collection("users")
      .doc(uid)
      .set(
        {
          gender: gender || null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("update-user-gender failed", error);
    const message = error?.message || "Unable to update sex.";
    const status = message.toLowerCase().includes("token") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
