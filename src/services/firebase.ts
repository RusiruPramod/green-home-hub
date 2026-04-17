import { initializeApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDwItElFQQ21Lay9Xh-Ba1K2u0G3kTrLo0",
  authDomain: "esp32led-b6105.firebaseapp.com",
  databaseURL: "https://esp32led-b6105-default-rtdb.firebaseio.com",
  projectId: "esp32led-b6105",
  storageBucket: "esp32led-b6105.firebasestorage.app",
  messagingSenderId: "1018182365052",
  appId: "1:1018182365052:web:f3512caea9405fa42d7ef9",
  measurementId: "G-XBY8QKFX4J"
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
    getAnalytics(app);
    console.log("✓ Firebase Realtime Database connected");
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error));
    console.error("Firebase initialization failed:", initError.message);
  }
}

export { realtimeDb, initError };
