import { initializeApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

let realtimeDb: Database | null = null;
let initError: Error | null = null;

if (missingKeys.length > 0) {
  const message =
    `Missing Firebase environment variables: ${missingKeys.join(", ")}\n\n` +
    `Please fill in VITE_FIREBASE_* in your .env file.\n` +
    `See FIREBASE_SETUP.md for detailed instructions.`;
  
  initError = new Error(message);
  console.error("❌", message);
} else {
  try {
    const app = initializeApp(firebaseConfig);
    realtimeDb = getDatabase(app);
    console.log("✓ Firebase Realtime Database connected");
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error));
    console.error("Firebase initialization failed:", initError.message);
  }
}

export { realtimeDb, initError };
