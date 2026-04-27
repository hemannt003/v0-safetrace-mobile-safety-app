# SafeTrace Mobile App

A React Native (Expo) mobile app for the SafeTrace women's safety system.

## Setup

1. Install dependencies:
```bash
cd mobile-app
npm install
```

2. Create a `.env` file with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the development server:
```bash
npx expo start
```

4. Run on your device:
- Scan the QR code with the Expo Go app (iOS/Android)
- Press `i` for iOS simulator
- Press `a` for Android emulator

## Features

- **SOS Alert**: One-tap emergency alert with 5-second countdown
- **Journey Tracking**: Share your trip with emergency contacts
- **Emergency Contacts**: Manage contacts who receive alerts
- **Location Sharing**: Real-time location tracking
- **Shake Detection**: Trigger alert by shaking phone (coming soon)

## Project Structure

```
mobile-app/
├── app/
│   ├── (auth)/           # Authentication screens
│   ├── (tabs)/           # Main app tabs
│   ├── _layout.tsx       # Root layout
│   └── index.tsx         # Entry redirect
├── context/
│   └── auth.tsx          # Auth context provider
├── lib/
│   ├── alerts.ts         # Alert functions
│   ├── location.ts       # Location services
│   ├── supabase.ts       # Supabase client
│   └── types.ts          # TypeScript types
├── app.json              # Expo config
├── package.json
└── tsconfig.json
```

## API Integration

The app connects to the same Supabase backend as the web dashboard. All data syncs in real-time between the mobile app and web dashboard.
