# How to Generate an Android APK for Paw Print AI

This guide explains how to wrap the Paw Print web application into a native Android APK using **Capacitor**.

## 🚀 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18+)
- **Android Studio** (with Android SDK and Build Tools)
- **Java Development Kit (JDK) 17**

## 📦 2. Initialize Capacitor

Run the following commands in the project root directory:

```bash
# 1. Install Capacitor dependencies
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize Capacitor configuration
# Use 'Paw Print' as app name and 'ai.pawprint.app' as bundle ID
npx cap init
```

## 🏗️ 3. Prepare the Web Build

Capacitor wraps the production build of your React app.

```bash
# 1. Create a production build
npm run build

# 2. Add the Android platform
npx cap add android
```

## 📱 4. Configure & Sync

Every time you change your React code, you need to sync the changes to the Android project:

```bash
# Sync web assets to the native project
npx cap copy android
```

## 🛠️ 5. Build the APK

1. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
2. Wait for Gradle to sync.
3. In the top menu, go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
4. Once finished, a notification will appear with a link to "locate" the `app-debug.apk`.

## 🧪 6. Testing on a Phone

1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect your phone via USB.
3. In Android Studio, select your phone in the device dropdown and click the **Run** (Play) button.
4. The app will be installed and launched on your device.

## 📝 Important Notes for Paw Print

- **Firebase Configuration:** Ensure your Google Sign-In and Magic Link URLs are authorized for your app's bundle ID in the Firebase Console.
- **Permissions:** You may need to add `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />` to the `AndroidManifest.xml` if location services are not working automatically.
- **Icons:** Use the `cordova-res` or `@capacitor/assets` tool to generate high-resolution splash screens and icons for the APK.
