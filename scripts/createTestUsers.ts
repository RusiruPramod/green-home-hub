import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

async function createUsers() {
  try {
    console.log("Creating Hotel Admin...");
    try {
      const hotelAdmin = await createUserWithEmailAndPassword(auth, "admin@hotel.com", "password123");
      await set(ref(db, `users/${hotelAdmin.user.uid}`), {
        email: "admin@hotel.com",
        role: "hotelAdmin",
        propertyId: "property_001"
      });
      console.log("✓ Hotel Admin created");
    } catch(e: any) {
      if (e.code === 'auth/email-already-in-use') {
        console.log("Hotel Admin already exists.");
      } else {
        throw e;
      }
    }

    console.log("Creating Super Admin...");
    try {
      const superAdmin = await createUserWithEmailAndPassword(auth, "super@admin.com", "password123");
      await set(ref(db, `users/${superAdmin.user.uid}`), {
        email: "super@admin.com",
        role: "superadmin"
      });
      console.log("✓ Super Admin created");
    } catch(e: any) {
      if (e.code === 'auth/email-already-in-use') {
        console.log("Super Admin already exists.");
      } else {
        throw e;
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating users:", error);
    process.exit(1);
  }
}

createUsers();
