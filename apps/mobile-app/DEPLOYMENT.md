# Mobile App Deployment Guide

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing
- [ ] No linting errors
- [ ] TypeScript compilation successful
- [ ] Code reviewed and approved
- [ ] Documentation updated

### Configuration

- [ ] Environment variables set for production
- [ ] API endpoints configured
- [ ] Sentry DSN configured
- [ ] Push notification keys configured
- [ ] Deep linking domains configured

### Security

- [ ] API keys not hardcoded
- [ ] Sensitive data encrypted
- [ ] HTTPS enforced
- [ ] Code obfuscation enabled
- [ ] ProGuard configured (Android)

## iOS Deployment

### 1. Prepare for App Store

#### Update Version & Build Number

Edit `ios/ZnakLavki/Info.plist`:

```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

#### Configure App Store Connect

1. Create app in App Store Connect
2. Fill in app information:
   - App name
   - Description
   - Keywords
   - Screenshots (required sizes):
     - 6.5" iPhone (1242 x 2688)
     - 5.5" iPhone (1242 x 2208)
     - iPad Pro (2048 x 2732)
3. Set privacy policy URL
4. Configure age rating

### 2. Create Archive

```bash
cd ios
xcodebuild clean archive \
  -workspace ZnakLavki.xcworkspace \
  -scheme ZnakLavki \
  -configuration Release \
  -archivePath ./build/ZnakLavki.xcarchive
```

Or use Xcode:

1. Open `ios/ZnakLavki.xcworkspace`
2. Select "Any iOS Device (arm64)"
3. Product > Archive
4. Window > Organizer
5. Select archive > Distribute App

### 3. Upload to App Store

```bash
xcodebuild -exportArchive \
  -archivePath ./build/ZnakLavki.xcarchive \
  -exportOptionsPlist exportOptions.plist \
  -exportPath ./build
```

Or use Xcode Organizer:

1. Click "Distribute App"
2. Select "App Store Connect"
3. Click "Upload"
4. Wait for processing

### 4. Submit for Review

1. Go to App Store Connect
2. Select your app
3. Fill in version information
4. Add build
5. Submit for review

### 5. TestFlight (Beta Testing)

1. Upload build to App Store Connect
2. Wait for processing (15-30 minutes)
3. Add internal/external testers
4. Testers receive email invitation

## Android Deployment

### 1. Prepare for Google Play

#### Update Version

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
    }
}
```

#### Generate Keystore

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore znak-lavki-release.keystore \
  -alias znak-lavki \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

#### Configure Signing

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('znak-lavki-release.keystore')
            storePassword 'your-store-password'
            keyAlias 'znak-lavki'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2. Build AAB (Android App Bundle)

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 3. Build APK (Alternative)

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### 4. Upload to Google Play Console

1. Go to Google Play Console
2. Create application
3. Fill in store listing:
   - Title
   - Short description
   - Full description
   - Screenshots (required):
     - Phone (minimum 2)
     - 7" Tablet (minimum 1)
     - 10" Tablet (minimum 1)
   - Feature graphic (1024 x 500)
   - App icon (512 x 512)
4. Set content rating
5. Set pricing & distribution

### 5. Create Release

1. Go to "Release" > "Production"
2. Click "Create new release"
3. Upload AAB file
4. Add release notes
5. Review and roll out

### 6. Internal Testing Track

1. Go to "Release" > "Internal testing"
2. Create new release
3. Add testers by email
4. Testers can download via Play Store

## Over-The-Air (OTA) Updates

### CodePush Setup (Optional)

For non-native code updates:

```bash
# Install CodePush CLI
npm install -g code-push-cli

# Register
code-push register

# Add app
code-push app add ZnakLavki-iOS ios react-native
code-push app add ZnakLavki-Android android react-native

# Release update
code-push release-react ZnakLavki-iOS ios
code-push release-react ZnakLavki-Android android
```

## Continuous Deployment

### GitHub Actions (iOS)

`.github/workflows/ios-deploy.yml`:

```yaml
name: iOS Deploy
on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile-app/**'

jobs:
  deploy:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - name: Install dependencies
        run: cd apps/mobile-app && npm install
      - name: Install pods
        run: cd apps/mobile-app/ios && pod install
      - name: Build
        run: cd apps/mobile-app/ios && xcodebuild ...
      - name: Upload to TestFlight
        run: # Upload command
```

### GitHub Actions (Android)

`.github/workflows/android-deploy.yml`:

```yaml
name: Android Deploy
on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile-app/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - uses: actions/setup-java@v2
      - name: Install dependencies
        run: cd apps/mobile-app && npm install
      - name: Build AAB
        run: cd apps/mobile-app/android && ./gradlew bundleRelease
      - name: Upload to Play Console
        run: # Upload command
```

## Monitoring Post-Deployment

### 1. Sentry

Monitor crashes and errors:

- Check error rates
- Review crash reports
- Monitor performance issues

### 2. Analytics

Track user behavior:

- Active users
- Screen views
- Feature usage
- Conversion rates

### 3. App Store/Play Store

Monitor reviews:

- Rating trends
- User feedback
- Common issues

## Rollback Strategy

### iOS

1. Go to App Store Connect
2. Remove version from sale
3. Submit previous version

### Android

1. Go to Google Play Console
2. Create release with previous version
3. Roll out to production

## Version Management

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Example progression:

- `1.0.0` - Initial release
- `1.0.1` - Bug fix
- `1.1.0` - New feature
- `2.0.0` - Breaking change

### Build Numbers

- iOS: Increment for each build
- Android: `versionCode` must increase

## Post-Deployment Tasks

- [ ] Verify app is live on stores
- [ ] Test download and installation
- [ ] Monitor crash reports
- [ ] Monitor analytics
- [ ] Respond to user reviews
- [ ] Update documentation
- [ ] Notify stakeholders
- [ ] Create release notes
- [ ] Tag release in git

## Support & Maintenance

### Regular Updates

- Weekly: Review analytics and crashes
- Monthly: Update dependencies
- Quarterly: Major feature releases
- Annually: Major version updates

### Emergency Hotfixes

1. Create hotfix branch
2. Fix critical issue
3. Test thoroughly
4. Fast-track review (if available)
5. Deploy immediately

## Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policy](https://play.google.com/about/developer-content-policy/)
- [React Native Deployment](https://reactnative.dev/docs/signed-apk-android)
- [Fastlane for Automation](https://fastlane.tools/)

## Contact

For deployment issues:

- DevOps Team: devops@znak-lavki.com
- Mobile Team: mobile@znak-lavki.com
