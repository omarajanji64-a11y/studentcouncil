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
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBMNu5oqYlq4SII9e3TQnS-mZeCPeAUo3s
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studentcouncil-ce2b5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studentcouncil-ce2b5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studentcouncil-ce2b5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=785722329583
NEXT_PUBLIC_FIREBASE_APP_ID=1:785722329583:web:06eb6084d82c2fbe2b0e1a
```

## Running
```bash
npm install
npm run dev
```
