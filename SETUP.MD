# SeniorShield — Developer Environment & Setup Guide

> Complete onboarding guide for team contributors to clone, configure, and run **SeniorShield** on their local machine.

---

## ⚡ Quickstart (TL;DR)

If your system already has **Node.js**, **JDK 17**, and **Android SDK / ADB**:

```bash
# 1. Clone the repository
git clone <YOUR_GIT_REPO_URL>
cd <REPO_FOLDER>

# 2. Install dependencies (Expo SDK 54)
npm install --legacy-peer-deps

# 3. Connect your Android phone via USB and reverse the bundler port
adb devices
adb reverse tcp:8081 tcp:8081

# 4. Start the development server
npx expo start --localhost --port 8081
```

---

## 1. Prerequisites Checklist

Ensure the following tools are installed on your machine before running the app:

| Component | Required Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v20.x` or `v22.x` | JavaScript runtime environment |
| **JDK (Java)** | **Java 17 (JDK 17)** | Required for Android build tools and React Native Gradle |
| **Android SDK** | API 34 (`platforms;android-34`, `build-tools;34.0.0`) | Android compilation and native libraries |
| **ADB (Platform Tools)**| Latest | Communicating with connected USB devices/emulators |
| **Expo Go App** | **SDK 54** (from Google Play Store) | Running the app on your physical Android phone |

---

## 2. Installing Prerequisites by Operating System

### 🐧 Linux (Arch / Ubuntu / Fedora)

#### A. Install Node.js & Git
```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y nodejs npm git

# Arch Linux / CachyOS
sudo pacman -S nodejs npm git
```

#### B. Install JDK 17
```bash
# Ubuntu / Debian
sudo apt install -y openjdk-17-jdk

# Arch Linux
sudo pacman -S jdk17-openjdk
```

#### C. Install Android SDK & Platform Tools
```bash
# Ubuntu / Debian
sudo apt install -y android-sdk adb

# Arch Linux
sudo pacman -S android-tools
```

---

### 🍏 macOS

```bash
# 1. Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node, JDK 17, and Android platform tools
brew install node
brew install openjdk@17
brew install android-platform-tools
```

---

### 🪟 Windows

1. Install **Node.js (LTS)** from [nodejs.org](https://nodejs.org/).
2. Install **OpenJDK 17** from [Adoptium Temurin](https://adoptium.net/temurin/releases/?version=17).
3. Install **Android Studio** (includes Android SDK, Platform-tools `adb`, and Emulator) from [developer.android.com](https://developer.android.com/studio).

---

## 3. Environment Variables Configuration

Set `JAVA_HOME`, `ANDROID_HOME`, and `PATH` so your terminal recognizes `java`, `javac`, and `adb`.

### On Linux / macOS (`~/.bashrc` or `~/.zshrc`)
Add the following lines to your `~/.bashrc` or `~/.zshrc` file:

```bash
# --- Java & Android SDK Toolchain ---
export JAVA_HOME=/path/to/your/jdk-17         # e.g., /usr/lib/jvm/java-17-openjdk or ~/.jdk/jdk-17
export ANDROID_HOME=$HOME/Android/Sdk         # On macOS: $HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
```

Then reload your shell:
```bash
source ~/.bashrc   # or source ~/.zshrc
```

### On Windows (System Environment Variables)
- Set `JAVA_HOME` to `C:\Program Files\Eclipse Adoptium\jdk-17.x.x`
- Set `ANDROID_HOME` to `%LOCALAPPDATA%\Android\Sdk`
- Add to `Path`: `%JAVA_HOME%\bin` and `%ANDROID_HOME%\platform-tools`

---

## 4. Setting Up the Project

### 4.1 Clone and Install
```bash
git clone <REPO_URL>
cd <REPO_FOLDER>

# Always install with --legacy-peer-deps to avoid React 19 / @types/react conflicts
npm install --legacy-peer-deps
```

### 4.2 Verify TypeScript Build
Run a type check to verify that all dependencies and types compile with zero errors:
```bash
npx tsc --noEmit
```

---

## 5. Running the App on Your Phone

### Option A: Via USB Cable (Recommended for Hackathons & College Wi-Fi)
> **Why USB?** College/Hackathon Wi-Fi networks often enable "AP Client Isolation", blocking laptops and phones on the same Wi-Fi from connecting to each other. USB mode bypasses this completely.

1. **Enable Developer Options on Android:**
   - Go to `Settings` > `About Phone`.
   - Tap **Build Number** (or *Software Version*) **7 times** until you see *"You are now a developer!"*.
2. **Enable USB Debugging:**
   - Go to `Settings` > `System` > `Developer Options`.
   - Toggle **USB Debugging** to `ON`.
   - (*Vivo/Oppo/Xiaomi users:* Also ensure USB Configuration is set to *File Transfer/MTP*).
3. **Plug phone into PC via USB cable.**
   - When the popup appears on phone (*"Allow USB debugging?"*), check **"Always allow"** and tap **"Allow"**.
4. **Reverse the Metro port and launch:**
   ```bash
   # Confirm phone is detected
   adb devices

   # Forward port 8081 over USB
   adb reverse tcp:8081 tcp:8081

   # Start Expo in localhost mode
   npx expo start --localhost --port 8081
   ```
5. Open the **Expo Go** app on your phone, and it will load `exp://127.0.0.1:8081` automatically.

---

### Option B: Wireless (Same Home Wi-Fi)
```bash
npx expo start
```
Scan the QR code shown in your terminal using the **Expo Go** app on Android.

---

### Option C: Cloud Tunnel (Restricted Hotspots)
```bash
npx expo start --tunnel
```

---

## 6. API Keys & AI Engine Configuration

SeniorShield connects directly to **Google Gemini 2.5 Flash** for deep threat reasoning.

### Setting Up a Gemini API Key:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Create a `.env` file in the project root:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyYourActualKeyHere
   ```
3. Alternatively, you can paste the API key directly into the app's in-app **⚙️ Setup Modal**.

> [!NOTE]
> **Zero Key / Offline Fallback:** If no API key is provided, SeniorShield automatically falls back to its built-in local heuristic engine. The app remains 100% operational for offline testing and judge presentations.

---

## 7. Architecture & Coding Rules for Contributors

When contributing code, please follow these project rules:

1. **Pure React Native Primitives ONLY:**
   - Use `View`, `Text`, `TouchableOpacity`, `ScrollView`, `StyleSheet`, `Modal`, `FlatList`, `ActivityIndicator`.
   - ❌ **NEVER use web HTML tags** (`<div>`, `<span>`, `<h1>`, `<p>`) or web CSS classes (`className`).
2. **Senior-Centric UI Guidelines:**
   - Minimum font size: `18px` for body, `22px+` for titles.
   - High visual contrast (Red `#DC2626`, Amber `#D97706`, Green `#16A34A`, Dark `#0F172A`).
   - Ergonomic touch targets: Minimum `56px` button heights.
   - Jargon-free explanations (use *"Dangerous Link"*, *"Thief trying to steal money"*, never technical jargon).
3. **Type Safety:**
   - Define all data models and interfaces in `src/types/scam.ts`.
   - Run `npx tsc --noEmit` before committing to ensure 0 type errors.

---

## 8. Directory Overview

```
├── App.tsx                      # Main app coordinator & exposure gauge
├── index.ts                     # Root Expo entry point
├── app.json                     # Android permissions & Expo config
├── package.json                 # Dependencies (Expo SDK 54, React 19, RN 0.81)
├── tsconfig.json                # Strict TypeScript configuration
├── PRD.MD                       # Product Requirements Document (Challenge 04)
├── AGENTS.MD                    # AI Agent & Solo Builder principles
├── SETUP.MD                     # This onboarding guide
└── src/
    ├── components/
    │   ├── Header.tsx           # High-contrast header with 1930 helpline
    │   ├── ThreatCard.tsx       # Dynamic severity card with action buttons
    │   ├── CampaignTimeline.tsx # Multi-step attack progression chain
    │   └── SimulationDrawer.tsx # Judge demo hub for one-tap scenario testing
    ├── constants/
    │   └── mockScams.ts         # 4 realistic Indian scam vectors (EB, Digital Arrest, KYC, Safe Bank)
    ├── services/
    │   ├── gemini.ts            # Gemini 2.5 Flash client + offline heuristic fallback
    │   ├── deviceScanner.ts     # Native SMS & Call Log reader
    │   └── campaignTracker.ts   # Multi-channel correlation & cumulative risk score
    └── types/
        └── scam.ts              # TypeScript interfaces
```

---

## 9. Troubleshooting & FAQ

### Q1: `ERROR Project is incompatible with this version of Expo Go`
- **Cause:** Your phone has a different Expo Go SDK version than the project.
- **Fix:** This project uses **Expo SDK 54**. Make sure your Expo Go app from the Google Play Store is updated to the latest version.

### Q2: Phone says "Could not connect to Metro" or stays on loading
- **Cause:** Wi-Fi network isolation or missing port forwarding.
- **Fix:** Connect via USB and run:
  ```bash
  adb reverse tcp:8081 tcp:8081
  npx expo start --localhost --port 8081
  ```

### Q3: `npm install` fails with `ERESOLVE could not resolve`
- **Cause:** React 19 peer dependency resolution.
- **Fix:** Always run with the legacy peer deps flag:
  ```bash
  npm install --legacy-peer-deps
  ```

### Q4: `adb devices` shows `unauthorized` or empty
- **Fix:** Unplug USB, re-plug, look at your phone screen, and tap **"Always allow from this computer"** when prompted.
