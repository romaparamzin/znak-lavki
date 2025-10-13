# Znak Lavki Mobile App

React Native mobile application for warehouse workers to scan and validate products.

## Features

✅ **Barcode & QR Code Scanning**

- Camera-based scanning with react-native-vision-camera
- Manual code entry fallback
- Torch/flashlight toggle
- Scan history tracking

✅ **Product Validation**

- Real-time product information display
- Accept/Reject/Report actions
- Expiry date warnings
- Product status indicators

✅ **Offline Support**

- AsyncStorage for local data persistence
- Automatic sync queue when offline
- Background sync when connection restored
- Offline indicator

✅ **Authentication & Security**

- Biometric authentication (Face ID / Touch ID)
- JWT token management with auto-refresh
- Secure credential storage

✅ **Push Notifications**

- Product alerts
- Sync status notifications
- Custom notification channels

✅ **Multi-language Support**

- English, Russian, Spanish
- i18next for internationalization

✅ **Analytics & Monitoring**

- Sentry for crash reporting
- Custom analytics events
- Screen view tracking
- Performance monitoring

✅ **A/B Testing**

- Experiment framework
- Variant assignment
- Conversion tracking

✅ **Deep Linking**

- Universal link support
- Custom URL scheme (znak-lavki://)
- Navigation from external sources

## Tech Stack

- **React Native** 0.73+
- **TypeScript** 5.3+
- **React Navigation** 6
- **React Native Paper** (Material Design)
- **Redux Toolkit** with Redux Persist
- **React Query** (TanStack Query)
- **React Native Vision Camera** 3
- **AsyncStorage**
- **Sentry** for error tracking
- **i18next** for internationalization

## Prerequisites

- Node.js 18+
- npm 9+ or Yarn
- React Native CLI
- Xcode 14+ (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS)

## Installation

### 1. Install dependencies

```bash
cd apps/mobile-app
npm install
```

### 2. iOS Setup

```bash
cd ios
pod install
cd ..
```

### 3. Android Setup

No additional setup required for Android.

## Running the App

### iOS

```bash
npm run ios
```

Or open `ios/ZnakLavki.xcworkspace` in Xcode and run.

### Android

```bash
npm run android
```

## Project Structure

```
apps/mobile-app/
├── src/
│   ├── navigation/          # Navigation configuration
│   │   ├── types.ts
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/             # Screen components
│   │   ├── Auth/
│   │   ├── ErrorScreens/
│   │   ├── HomeScreen.tsx
│   │   ├── ScanScreen.tsx
│   │   ├── ProductValidationScreen.tsx
│   │   ├── ScanHistoryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── store/               # Redux store
│   │   ├── index.ts
│   │   ├── hooks.ts
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── scannerSlice.ts
│   │       ├── offlineSyncSlice.ts
│   │       └── settingsSlice.ts
│   ├── services/            # Service layers
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   └── queries.ts
│   │   ├── biometric/
│   │   ├── feedback/
│   │   ├── i18n/
│   │   ├── notifications/
│   │   ├── offline/
│   │   ├── analytics/
│   │   ├── deeplink/
│   │   └── ab-testing/
│   └── utils/               # Utility functions
├── android/                 # Android native code
├── ios/                     # iOS native code
├── App.tsx                  # Root component
├── package.json
└── README.md
```

## Key Features Implementation

### Barcode Scanning

```typescript
import { Camera, useCodeScanner } from 'react-native-vision-camera';

const codeScanner = useCodeScanner({
  codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128'],
  onCodeScanned: (codes) => {
    // Handle scanned code
  },
});
```

### Offline Sync

```typescript
// Add to sync queue
dispatch(
  addToQueue({
    id: 'unique-id',
    type: 'scan',
    data: scanData,
    timestamp: new Date().toISOString(),
  })
);

// Sync automatically when online
syncService.startAutoSync();
```

### Deep Linking

```bash
# Open scan screen
znak-lavki://scan

# Open product validation
znak-lavki://product/12345

# Open settings
znak-lavki://settings
```

### Analytics

```typescript
import { analyticsService } from '@services/analytics/analyticsService';

// Track event
analyticsService.trackEvent({
  category: 'scanner',
  action: 'scan_product',
  label: productName,
});

// Track screen view
analyticsService.trackScreenView('ProductValidation');
```

### A/B Testing

```typescript
import { abTestService, EXPERIMENTS } from '@services/ab-testing/abTestService';

// Get variant
const buttonColor = abTestService.getVariant(EXPERIMENTS.SCAN_BUTTON_COLOR);

// Track conversion
abTestService.trackConversion(EXPERIMENTS.SCAN_BUTTON_COLOR, 'button_clicked');
```

## Configuration

### Environment Variables

Create a `.env` file:

```env
API_BASE_URL=https://api.znak-lavki.com
SENTRY_DSN=your-sentry-dsn
```

### API Configuration

Update `src/services/api/client.ts`:

```typescript
const API_BASE_URL = __DEV__ ? 'http://localhost:3000/api' : process.env.API_BASE_URL;
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Building

### iOS

```bash
# Debug build
npm run ios

# Release build
cd ios
xcodebuild -workspace ZnakLavki.xcworkspace -scheme ZnakLavki -configuration Release
```

### Android

```bash
# Debug build
npm run android

# Release build
cd android
./gradlew assembleRelease
```

## Troubleshooting

### Camera Permission Issues

Make sure camera permissions are properly configured:

- iOS: Check `Info.plist` for `NSCameraUsageDescription`
- Android: Check `AndroidManifest.xml` for `CAMERA` permission

### Build Errors

```bash
# Clean iOS build
cd ios
pod deintegrate
pod install
cd ..

# Clean Android build
cd android
./gradlew clean
cd ..
```

### Metro Bundler Issues

```bash
# Reset Metro bundler cache
npm start -- --reset-cache
```

## Performance Optimization

- **Code Splitting**: Dynamic imports for large screens
- **Image Optimization**: Using proper image formats and sizes
- **Memoization**: React.memo and useMemo for expensive computations
- **List Optimization**: FlatList with proper keyExtractor and getItemLayout

## Security Best Practices

✅ API tokens stored securely with Redux Persist encryption
✅ Biometric authentication for sensitive operations
✅ HTTPS only for production API calls
✅ No sensitive data in logs
✅ Regular security audits with npm audit

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - Znak Lavki

## Support

For support, email support@znak-lavki.com or open an issue in the repository.
