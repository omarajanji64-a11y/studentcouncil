# Student Council App

This Next.js app uses Firebase Auth + Firestore for real-time synchronization.

## Firebase Setup
1. Create a Firebase project.
2. Enable Auth providers:
   - Email/Password
   - Anonymous (optional, for demo login buttons)
3. Create a Firestore database in production or test mode.
4. Add a web app to get your client config values.

Create a `.env.local` with:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Running
```bash
npm install
npm run dev
```
