# Green Home Hub - Full Stack IoT Application

Complete MERN stack application for smart home monitoring with IoT devices.

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
npm install
```

### 2. Configure Environment Variables

The `.env` and `.env.local` files are already created in the root directory.

For Firebase Realtime Database, add these variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Start MongoDB
Make sure MongoDB is running on your system

### 4. Start the Servers

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```
Backend will run on: `http://localhost:5000`

**Terminal 2 - Frontend Development Server:**
```bash
npm run dev
```
Frontend will run on: `http://localhost:5173`

## 📁 Project Structure

- `backend/` - Node.js + Express + MongoDB backend
- `src/` - React + TypeScript + Vite frontend
- `src/services/` - API integration layer
- `src/hooks/` - Custom React hooks for data fetching

## 🔌 API Endpoints

Visit `/services` page in the application to see all available API endpoints.

## 🔥 Firebase Realtime Database

The app now supports live data using Firebase RTDB with this structure:

```json
{
	"sensors": {
		"gas": 420,
		"water": 62,
		"voltage": 229.4,
		"current": 1.46,
		"power": 335,
		"motion": false,
		"flowRate": 11.2,
		"updatedAt": 1712472450000
	},
	"devices": {
		"light": true,
		"pump": false,
		"fan": true,
		"motionDetection": true,
		"updatedAt": 1712472450000
	},
	"alerts": {
		"-Nx123abc": {
			"type": "warning",
			"title": "Low Water Level",
			"message": "Water tank level is 24% (threshold < 30%).",
			"source": "water",
			"acknowledged": false,
			"createdAt": 1712472450000
		}
	}
}
```

Service functions are in `src/services/realtimeDbService.ts`:

- `listenSensors()`
- `listenDevices()`
- `updateDevice(deviceId, state)`
- `pushAlert(alert)`

Additional helpers are included for alerts page actions:

- `listenAlerts()`
- `acknowledgeAlert()`
- `deleteAlert()`
- `clearAlerts()`

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
