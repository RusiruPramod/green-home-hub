import { initializeApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

let realtimeDb: Database | null = null;
let auth: Auth | null = null;
let initError: Error | null = null;

if (missingKeys.length > 0) {
  const message =
    `Missing Firebase environment variables: ${missingKeys.join(", ")}\n\n` +
    `Please fill in VITE_FIREBASE_* in your .env file.\n` +
    `See FIREBASE_IMPLEMENTATION_PLAN.md for detailed instructions.`;
  
  initError = new Error(message);
  console.error("❌", message);
} else {
  try {
    const app = initializeApp(firebaseConfig);
    realtimeDb = getDatabase(app);
    auth = getAuth(app);
    getAnalytics(app);
    console.log("✓ Firebase initialized (Database & Auth)");
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error));
    console.error("Firebase initialization failed:", initError.message);
  }
}

export { realtimeDb, auth, initError };
