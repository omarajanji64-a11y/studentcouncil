/* eslint-disable no-console */
const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });
dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase admin credentials in env.");
  console.error(
    "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.local"
  );
  process.exit(1);
}

const app =
  admin.apps.length > 0
    ? admin.apps[0]
    : admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

const auth = admin.auth(app);
const db = admin.firestore(app);

const RESET_EXISTING_PASSWORDS = false;

const users = [
  {
    name: "Ayma",
    email: "ayma.abrar@ihsan.school",
    password: "A@ihsan88",
    role: "member",
    gender: "female",
  },
  {
    name: "Maria",
    email: "maria.arslan@ihsan.school",
    password: "IHSAN@stu152",
    role: "member",
    gender: "female",
  },
  {
    name: "Sirin",
    email: "sirin.mahayri@ihsan.school",
    password: "S@ihsan789",
    role: "member",
    gender: "female",
  },
  {
    name: "Nada",
    email: "nada.alghory@ihsan.school",
    password: "2022nine2023",
    role: "member",
    gender: "female",
  },
  {
    name: "Zaina",
    email: "zaina.baalbaki@ihsan.school",
    password: "Zaina135",
    role: "member",
    gender: "female",
  },
  {
    name: "Yaman",
    email: "yaman.alfakih@ihsan.school",
    password: "Yaman0ameen",
    role: "member",
    gender: "female",
  },
  {
    name: "Tala",
    email: "tala.ashi@ihsan.school",
    password: "Nadia_310",
    role: "member",
    gender: "female",
  },
];

const ensureUser = async (user) => {
  const email = user.email.toLowerCase().trim();
  let record = null;

  try {
    record = await auth.getUserByEmail(email);
    const updates = {};
    if (user.name && record.displayName !== user.name) {
      updates.displayName = user.name;
    }
    if (RESET_EXISTING_PASSWORDS) {
      updates.password = user.password;
    }
    if (Object.keys(updates).length > 0) {
      await auth.updateUser(record.uid, updates);
    }
  } catch (error) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  }

  if (!record) {
    record = await auth.createUser({
      email,
      password: user.password,
      displayName: user.name,
    });
    await auth.setCustomUserClaims(record.uid, { role: user.role });
  } else {
    await auth.setCustomUserClaims(record.uid, { role: user.role });
  }

  await db.collection("users").doc(record.uid).set(
    {
      name: user.name || "Staff Member",
      email,
      role: user.role,
      gender: user.gender || null,
      avatar: null,
      notificationsEnabled: false,
      canEditSchedule: false,
      mustChangePassword: true,
      lastNotificationReadAt: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return record.uid;
};

const run = async () => {
  console.log(`Creating ${users.length} users...`);
  for (const user of users) {
    try {
      const uid = await ensureUser(user);
      console.log(`✔ ${user.email} -> ${uid}`);
    } catch (error) {
      console.error(`✖ ${user.email}`, error?.message || error);
    }
  }
  console.log("Done.");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
