# Firebase Realtime Database Setup Guide

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

## Step 4: Add Credentials to `.env`

Open `.env` in the project root and fill in these values:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...
```

**⚠️ Never commit `.env` to git.** It contains sensitive credentials.

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
    "motion": false,
    "flowRate": 0,
    "updatedAt": 0
  },
  "devices": {
    "light": false,
    "pump": false,
    "fan": false,
    "motionDetection": false,
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

## Step 7: Start Development Server

```bash
npm run dev
```

The app should now connect to your Firebase RTDB and sync live data!

## Testing Without Real Credentials

If you don't have Firebase set up yet, you can use mock data by setting the environment variables to placeholder values. The app will gracefully handle connection errors during development.

Alternatively, use the provided `.env.example` as reference and ask in Firebase Console support if you have setup issues.

## Troubleshooting

- **"Missing Firebase environment variables"** → Fill in `.env` with real credentials
- **"Permission denied"** → Check Database Rules (should be in Test mode)
- **"No data showing"** → Ensure JSON structure is created in RTDB console
