# Mobile App Setup Guide

Complete setup guide for the Znak Lavki mobile application.

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)

   ```bash
   node --version  # Should be v18+
   ```

2. **npm or Yarn**

   ```bash
   npm --version   # v9+
   ```

3. **React Native CLI**

   ```bash
   npm install -g react-native-cli
   ```

4. **Watchman** (macOS only)
   ```bash
   brew install watchman
   ```

### iOS Development (macOS only)

1. **Xcode** (v14+)
   - Install from Mac App Store
   - Install Command Line Tools:
     ```bash
     xcode-select --install
     ```

2. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

### Android Development

1. **Android Studio**
   - Download from https://developer.android.com/studio
   - Install Android SDK
   - Configure ANDROID_HOME environment variable:
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/tools/bin
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

2. **Java Development Kit** (JDK 11)
   ```bash
   brew install openjdk@11
   ```

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd Знак\ лавки/apps/mobile-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. iOS Setup

```bash
cd ios
pod install
cd ..
```

If you encounter issues:

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### 4. Android Setup

No additional setup required, but ensure Android SDK is properly configured.

### 5. Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
API_BASE_URL=http://localhost:3000/api
SENTRY_DSN=your-sentry-dsn
```

## Running the App

### iOS

#### Development Mode

```bash
# Start Metro bundler
npm start

# In another terminal, run iOS
npm run ios

# Or run on specific device
npm run ios -- --simulator="iPhone 14 Pro"
```

#### Physical Device

1. Open `ios/ZnakLavki.xcworkspace` in Xcode
2. Select your device from the device menu
3. Configure signing in project settings
4. Click "Run" button

### Android

#### Development Mode

```bash
# Start Metro bundler
npm start

# In another terminal, run Android
npm run android
```

#### Physical Device

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run:
   ```bash
   adb devices  # Verify device is connected
   npm run android
   ```

## Common Issues & Solutions

### iOS Issues

#### 1. Pod Install Fails

```bash
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install
cd ..
```

#### 2. Build Fails in Xcode

- Clean build folder: `Product > Clean Build Folder` (Cmd+Shift+K)
- Derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`

#### 3. Module Not Found

```bash
npm start -- --reset-cache
```

### Android Issues

#### 1. Gradle Build Fails

```bash
cd android
./gradlew clean
cd ..
npm start -- --reset-cache
```

#### 2. SDK Licenses

```bash
cd $ANDROID_HOME
./tools/bin/sdkmanager --licenses
```

#### 3. Device Not Detected

```bash
adb kill-server
adb start-server
adb devices
```

### General Issues

#### 1. Metro Bundler Port in Use

```bash
lsof -ti:8081 | xargs kill
```

#### 2. Clear Cache

```bash
# Clear npm cache
npm cache clean --force

# Clear Metro cache
npm start -- --reset-cache

# Clear watchman
watchman watch-del-all
```

#### 3. Reinstall Dependencies

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## Camera Setup

### iOS

Ensure `Info.plist` has camera permissions:

```xml
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to scan barcodes</string>
```

### Android

Ensure `AndroidManifest.xml` has camera permissions:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

## Push Notifications Setup

### iOS

1. Enable Push Notifications capability in Xcode
2. Configure APNs certificate in Apple Developer Portal
3. Update `AppDelegate.m` with FCM configuration

### Android

1. Add `google-services.json` to `android/app/`
2. Configure Firebase Cloud Messaging

## Deep Linking Setup

### iOS

Configure Associated Domains in Xcode:

```
applinks:znak-lavki.com
```

### Android

Intent filters are already configured in `AndroidManifest.xml`

## Testing Deep Links

### iOS

```bash
xcrun simctl openurl booted znak-lavki://scan
```

### Android

```bash
adb shell am start -W -a android.intent.action.VIEW -d "znak-lavki://scan" com.znakllavki
```

## Production Build

### iOS

1. Open Xcode
2. Select "Any iOS Device (arm64)"
3. Product > Archive
4. Distribute App > App Store Connect

### Android

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Environment-Specific Builds

### Development

```bash
npm run ios -- --configuration Debug
npm run android -- --variant=debug
```

### Staging

```bash
npm run ios -- --configuration Staging
npm run android -- --variant=staging
```

### Production

```bash
npm run ios -- --configuration Release
npm run android -- --variant=release
```

## Debugging

### React Native Debugger

1. Install React Native Debugger
2. Open app in development mode
3. Shake device > "Debug"

### Chrome DevTools

1. Open app in development mode
2. Shake device > "Debug"
3. Open Chrome: `chrome://inspect`

### Flipper

1. Install Flipper: https://fbflipper.com/
2. Open app in development mode
3. Flipper will automatically connect

## Performance Monitoring

### Enable Performance Metrics

```typescript
// In App.tsx
import { enableScreens } from 'react-native-screens';
enableScreens();
```

### Sentry Performance

```typescript
Sentry.init({
  tracesSampleRate: 1.0,
  enableAutoSessionTracking: true,
});
```

## Code Signing (iOS)

1. Open Xcode
2. Select project in navigator
3. Go to "Signing & Capabilities"
4. Select your team
5. Enable "Automatically manage signing"

## Next Steps

1. Configure backend API endpoint
2. Set up Sentry project
3. Configure Firebase for push notifications
4. Set up deep linking domains
5. Configure analytics platforms
6. Test on physical devices

## Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://reactnativepaper.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Query](https://tanstack.com/query)

## Support

For issues or questions:

- Create an issue in the repository
- Contact: support@znak-lavki.com
