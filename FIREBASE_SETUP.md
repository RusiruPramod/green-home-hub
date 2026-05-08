# Firebase Realtime Database Setup Guide

Official Firebase API references used by this project:

- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [InitializeApp](https://firebase.google.com/docs/reference/js/app.md#initializeapp)
- [GetAnalytics](https://firebase.google.com/docs/reference/js/analytics.md#getanalytics)
- [Realtime Database Web API](https://firebase.google.com/docs/reference/js/database)

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or select an existing one
3. Enter project name (e.g., "green-home-hub")
4. Follow the setup wizard

## Step 2: Enable Realtime Database

1. In Firebase Console, go to **Build** → **Realtime Database**
2. Click **"Create Database"**
3. Choose location (closest to your region)
4. Start in **Test mode** (for development; switch to locked rules in production)
5. Click **"Enable"**

## Step 3: Get Your Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under **"Your apps"**, if no app exists, click **"Add app"** → select **Web** (`</>`  icon)
3. Register the app with a name (e.g., "green-home-hub-web")
4. Copy the entire Firebase config object

If you want the exact SDK calls used in this project, use the modular API documented above:

```ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

Your config will look like:
```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
}
```

## Step 4: Configure the App

The app is already wired to use this Firebase project configuration directly:

```env
apiKey: "AIzaSyDwItElFQQ21Lay9Xh-Ba1K2u0G3kTrLo0"
authDomain: "esp32led-b6105.firebaseapp.com"
databaseURL: "https://esp32led-b6105-default-rtdb.firebaseio.com"
projectId: "esp32led-b6105"
storageBucket: "esp32led-b6105.firebasestorage.app"
messagingSenderId: "1018182365052"
appId: "1:1018182365052:web:f3512caea9405fa42d7ef9"
measurementId: "G-XBY8QKFX4J"
```

If you later want to move to environment variables for deployment, you can do that, but it is not required for the current working setup.

## Step 5: Create Database Structure

Go to **Realtime Database** in Firebase Console and click the **"+"** button to add initial data:

```json
{
  "sensors": {
    "gas": 0,
    "water": 0,
    "voltage": 0,
    "current": 0,
    "power": 0,
    "energy": 0,
    "motion": false,
    "pir": false,
    "doorOpen": false,
    "ultrasonicPresence": false,
    "occupancyState": "VACANT",
    "occupancyConfidence": 0,
    "relayStatus": false,
    "buzzerStatus": false,
    "flowRate": 0,
    "updatedAt": 0
  },
  "devices": {
    "light": false,
    "pump": false,
    "fan": false,
    "motionDetection": false,
    "ac": false,
    "geyser": false,
    "safetyRelay": false,
    "buzzer": false,
    "updatedAt": 0
  },
  "alerts": {}
}
```

## Step 6: Set Database Rules (Development)

For development with Test mode, rules should auto-allow reads/writes. To set custom rules:

1. Go to **Realtime Database** → **Rules** tab
2. Replace with:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "sensors": {
      ".validate": "newData.hasChildren(['gas', 'water', 'voltage', 'current', 'power', 'motion', 'flowRate'])"
    },
    "devices": {
      ".validate": "newData.hasChildren(['light', 'pump', 'fan', 'motionDetection'])"
    },
    "alerts": {
      "$alertId": {
        ".validate": "newData.hasChildren(['type', 'title', 'message'])"
      }
    }
  }
}
```

(For production, restrict `.read` and `.write` based on authentication.)

For production, also review the official rules guide:

- [Firebase Realtime Database Security Rules](https://firebase.google.com/docs/database/security)
- [Firebase Authentication Web Docs](https://firebase.google.com/docs/auth/web/start)

## Step 7: Start Development Server

```bash
npm run dev
```

The app should now connect to your Firebase RTDB and sync live data!

## Testing Without Real Credentials

If you don't have Firebase set up yet, you can start by keeping the existing project credentials above and then adjust them after you create your own project.

## Troubleshooting

- **"Firebase initialization failed"** → Confirm the project credentials match the Firebase project and Realtime Database is enabled
- **"Permission denied"** → Check Database Rules (should be in Test mode)
- **"No data showing"** → Ensure JSON structure is created in RTDB console
