# Snapchat Mobile Starter & Supabase Backend Architecture

Production-ready starter architecture for a Snapchat-style mobile app using **React Native (Expo / Bare Workflow)** and **Supabase (PostgreSQL, Storage, Edge Functions, Realtime)**.

## Architecture Highlights

1. **Frontend Architecture (React Native & TypeScript)**
   - **Camera Integration**: Uses `react-native-vision-camera` (iOS AVFoundation & Android CameraX) configured for camera-first entry view, low-latency live preview, tap photo capture, and hold-to-record video.
   - **Navigation & Ephemerality**: Full-screen navigation stack (`React Navigation`) transitioning seamlessly from Camera -> Main Chat Feed -> Ephemeral Snap Viewer modal.
   - **Performance**: Powered by `react-native-reanimated` and `react-native-gesture-handler` for fast UI rendering, gestures, and smooth progress bar countdown animations.

2. **Backend Services (Supabase)**
   - **Database**: PostgreSQL schema managed via migration scripts (`profiles`, `friendships`, `snaps`).
   - **Indexing**: High-performance composite index `idx_snaps_recipient_unviewed` on `snaps(recipient_id, created_at) WHERE viewed_at IS NULL`.
   - **Strict RLS**: Row Level Security policies ensuring users can ONLY view unviewed snaps addressed specifically to them.
   - **Ephemeral Storage & Edge Function**: Storage bucket `snaps-media` (private permissions) with a Deno Edge Function (`delete-viewed-snap`) that deletes media from storage and purges the record from Postgres upon view completion.
   - **Realtime**: Postgres changes listener for incoming snaps + Realtime Presence for active typing status.

---

## Folder Structure

```
Snapchat/
├── supabase/
│   ├── migrations/
│   │   └── 20260721000000_init_snapchat_schema.sql # PostgreSQL Tables, RLS & Storage
│   └── functions/
│       └── delete-viewed-snap/
│           └── index.ts                             # Ephemeral media auto-delete function
├── src/
│   ├── lib/
│   │   └── supabase.ts                              # Supabase Client with localhost config
│   ├── types/
│   │   ├── database.ts                              # TypeScript entities & DB types
│   │   └── navigation.ts                            # Navigation Stack Param Lists
│   ├── navigation/
│   │   └── AppNavigator.tsx                         # Camera-first Tab & Modal Navigator
│   └── screens/
│       ├── CameraScreen.tsx                         # Vision Camera + Reanimated controls
│       ├── SnapViewerScreen.tsx                     # Media stream + Countdown timer
│       └── ChatFeedScreen.tsx                       # Realtime inbox list
├── App.tsx                                          # App Root Wrapper
├── app.json                                         # Camera & Mic Permissions config
├── package.json                                     # Project dependencies
└── tsconfig.json                                    # TypeScript configuration
```

---

## Localhost Setup Guide

### 1. Start Local Supabase Stack

```bash
# Initialize and start Supabase local stack
npx supabase start

# Apply local migrations
npx supabase db reset

# Serve Edge Function locally
npx supabase functions serve delete-viewed-snap --no-verify-jwt
```

### 2. Run React Native App

```bash
# Install dependencies
npm install

# Start Expo dev server
npm run start
```

- **iOS Simulator**: Press `i` in the Expo terminal.
- **Android Emulator**: Press `a` in the Expo terminal (localhost mapping uses `http://10.0.2.2:54321`).
