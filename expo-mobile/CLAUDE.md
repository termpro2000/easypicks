# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native/Expo delivery management mobile application for furniture delivery services. The app manages delivery operations including scheduling, status tracking, photo/audio documentation, and customer signatures.

## Development Commands

### Core Development
```bash
# Start development server
npm start
# or
npx expo start

# Run on specific platforms
npx expo run:android
npx expo run:ios
npm run web

# Build APK locally (requires Android setup)
cd android && ./gradlew assembleRelease
```

### EAS Build & Update
```bash
# OTA Updates (Over-The-Air) - MUST use production branch for APK compatibility
eas update --branch production --message "Description"
eas update --branch production --auto  # Auto-generate message (ALWAYS use production branch)

# Build APK/AAB
eas build --platform android --profile production-apk  # APK
eas build --platform android --profile production      # AAB for Play Store
eas build --platform ios --profile production          # iOS

# Preview builds
eas build --platform android --profile preview
```

### Backend Deployment
The backend is auto-deployed to Railway via GitHub integration. Manual commands:
```bash
# Backend testing (Railway deployment)
curl "https://efficient-abundance-production-d603.up.railway.app/health"

# Test specific APIs
curl -X POST "https://efficient-abundance-production-d603.up.railway.app/api/deliveries/delay/TRACKING_NUMBER"
```

## Architecture

### State Management Pattern
- **Global State**: Uses global functions for app-wide state (logout, map preferences)
- **Local State**: React hooks for component-specific state
- **Persistence**: AsyncStorage for auth tokens, user info, and real-time status updates
- **Real-time Updates**: AsyncStorage-based mechanism for immediate UI updates without API refetch

### API Integration Architecture
- **Dynamic Environment Detection**: Automatically switches between development (Railway server) and production APIs
- **Authentication**: JWT token-based with automatic test-token fallback in development
- **Error Handling**: Automatic retry logic with graceful degradation
- **Request Interceptors**: Automatic token injection and logging

### File Storage Strategy
- **Firebase Storage**: For photos and audio files with upload progress tracking
- **Demo Mode**: Configurable Firebase integration that can run in demo mode without actual Firebase setup
- **Multi-file Upload**: Batch upload capabilities with individual progress tracking

### Screen Navigation Flow
```
LoginScreen → DeliveryListScreen ↔ DeliveryDetailScreen
                     ↓
              LoadingConfirmScreen (bulk status updates)
                     ↓
              MapSettingScreen, ProfileScreen
```

### Real-time Status Updates
- Uses AsyncStorage as a communication layer between screens
- Pattern: `updatedDeliveryStatus` key stores status changes with timestamps
- DeliveryListScreen monitors for changes on focus and updates UI immediately
- Prevents unnecessary API calls while maintaining data consistency

## Key Configuration Files

### Environment Configuration
- **app.json**: Contains production API URL, EAS project settings, OTA update configuration
- **eas.json**: Build profiles (development, preview, production, production-apk)
- **src/config/api.js**: Dynamic API endpoint resolution and axios configuration

### Firebase Integration
- **src/config/firebase.js**: Firebase configuration with demo mode support
- **src/utils/firebaseStorage.js**: Storage utilities with error handling and progress tracking
- Set `isFirebaseStorageConfigured()` to return `true` and provide real Firebase config to enable

## Critical Development Patterns

### Status Update Flow
1. User performs action (delay, cancel, complete) in DeliveryDetailScreen
2. API call updates backend database
3. Success response triggers AsyncStorage update with new status
4. Navigation back to DeliveryListScreen
5. DeliveryListScreen detects AsyncStorage change and updates UI immediately
6. No full page refresh or API refetch required

### API Error Handling
- Network errors automatically retry with Railway server fallback
- 401/403 errors trigger test-token retry in development
- Production builds remove debug tokens and enforce proper authentication
- All API requests include comprehensive logging for debugging

### EAS Update Strategy
- **Manual Updates Only**: Automatic updates disabled by default (`global.checkForUpdates()` available)
- **Runtime Version Matching**: Updates only apply to matching runtime versions
- **Production Branch**: All updates MUST deploy to `production` branch (APK compatibility)
- **Channel Configuration**: app.json configured with `expo-channel-name: production`
- **Critical**: APK builds use `production` channel - updates to other branches will NOT reach APK users
- **Fallback**: Apps gracefully handle update failures

### Database Integration
- Backend uses MySQL with connection retry mechanisms (`executeWithRetry`)
- Korean status values to prevent database truncation errors
- Consistent status mapping between English and Korean for UI display

## Testing & Debugging

### Development Authentication
- Uses `test-token` for API access in development mode
- Bypasses actual login requirements for faster development iteration
- Production builds require proper JWT authentication

### API Testing
- All API responses include detailed logging in development
- Error responses provide specific error messages for debugging
- Network failures automatically log connection details and retry attempts

### Firebase Storage Testing
- Demo mode allows development without Firebase setup
- Real Firebase integration requires updating `src/config/firebase.js` with actual credentials
- Upload progress and error states are fully testable in demo mode

## Production Deployment

### Backend (Railway)
- Auto-deploys from GitHub main branch
- Environment: Node.js + Express + MySQL
- Health check: `/health` endpoint
- Production URL configured in `app.json`

### Mobile App (EAS)
- Runtime Version: 1.2.1
- OTA Updates: Manual trigger only
- Build Profiles: Separate APK and AAB builds available
- Platform Support: Android and iOS

### Status Color Coding
- **배송연기 (Delay)**: Yellow (#FFC107)
- **배송취소 (Cancel)**: Red (#F44336) 
- **배송완료 (Complete)**: Green (#4CAF50)
- **Other statuses**: Orange/Blue based on progress state

## Recent Development Work

### Database Schema Updates (2025-09-21)
- **Action Date/Time Fields**: Added `action_date` (DATE) and `action_time` (TIME) columns to `deliveries` table
- **Migration Strategy**: Implemented automatic column detection and creation in backend API
- **Backward Compatibility**: API gracefully handles missing columns, returns null values when fields don't exist
- **Database Commands**:
```sql
ALTER TABLE deliveries ADD COLUMN action_date DATE NULL;
ALTER TABLE deliveries ADD COLUMN action_time TIME NULL;
```

### EAS Update Configuration Fixes
- **Channel Alignment**: Fixed mismatch between APK builds and update channels
- **Critical Fix**: APK builds were using `production` channel but updates were published to `master` branch
- **Solution**: Updated app.json to use `expo-channel-name: production` for all updates
- **Deployment Pattern**: All EAS updates MUST use `--branch production` for APK compatibility

### UI/UX Improvements
- **DeliveryListScreen**: 
  - Fixed visit_time display to show HH:MM format only (was showing full timestamp)
  - Added action_date/time field mapping with proper null handling
  - Enhanced left border color coding to match status background colors
- **AppInfoScreen**: 
  - Removed app description section for cleaner interface
  - Added manual update functionality with loading states
  - Improved update ID display (first 8 characters only)

### Push Notification Implementation Guide
Documented complete implementation strategy for notifications from frontend web app to mobile drivers:

#### Architecture Components
1. **Frontend Web App**: Uses expo-server-sdk to send notifications
2. **Backend API**: Stores driver push tokens, triggers notifications on assignment
3. **Mobile App**: Registers for push notifications, handles incoming messages
4. **Database**: Added `push_token` field to drivers table

#### Key Implementation Files
- **Frontend**: `services/pushNotificationService.js` (Expo SDK integration)
- **Backend**: `controllers/notificationController.js` (notification endpoints)
- **Mobile**: App.js notification setup with Expo Notifications SDK
- **Database**: `drivers` table with push_token column

#### Notification Flow
1. Driver login → Register push token with backend
2. Web assignment → Backend sends notification via Expo Push Service  
3. Mobile receipt → App shows notification and can navigate to delivery detail
4. Tap handling → Direct navigation to assigned delivery

### Code Quality Improvements
- **Error Handling**: Enhanced API error responses with detailed logging
- **Database Migration**: Implemented column existence checks before adding new fields
- **Consistent Formatting**: Standardized date (YYYY-MM-DD) and time (HH:MM) display formats
- **Manual Update Control**: Added user-initiated update checking in App Info screen

### Testing & Debugging Enhancements
- **Action Field Debugging**: Added comprehensive logging for action_date/time field mapping
- **Update Process Logging**: Detailed console output for EAS update checks and downloads
- **Database Migration Logging**: Clear feedback during column creation and validation
- **Push Token Validation**: Proper error handling for missing or invalid push tokens