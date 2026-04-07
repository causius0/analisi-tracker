# Mobile Application - Quick Start

The Analisi Tracker is now available as a **Progressive Web App (PWA)** that works on iOS, Android, and Desktop!

## Install the App

### iOS (iPhone/iPad)
1. Open Safari and navigate to your app URL
2. Tap Share (↑) → "Add to Home Screen"
3. Tap "Add"

### Android
1. Open Chrome and navigate to your app URL
2. Tap menu (⋮) → "Add to Home Screen" or "Install App"
3. Tap "Install"

### Desktop
1. Open Chrome/Edge and navigate to your app URL
2. Click install icon (⊕) in address bar
3. Click "Install"

## Features

✅ **Works Offline** - View cached data without internet
✅ **Installable** - Add to home screen like a native app
✅ **Fast** - Loads in under 3 seconds on 4G
✅ **Touch-Optimized** - Swipe, pull-to-refresh, tap interactions
✅ **Mobile Charts** - Interactive charts optimized for touch
✅ **Bottom Navigation** - Easy thumb-friendly navigation
✅ **Push Notifications** - Get notified of updates (optional)
✅ **Auto-Updates** - Always get the latest version

## Quick Links

- 📱 [Installation Guide](/docs/MOBILE_SETUP.md)
- 🧪 [Testing Guide](/docs/MOBILE_TESTING_GUIDE.md)
- 📚 [Components Guide](/docs/MOBILE_COMPONENTS_GUIDE.md)
- 🔧 [Implementation Details](/docs/MOBILE_IMPLEMENTATION_SUMMARY.md)

## Requirements

- iOS 12+ or Android 8+
- Modern browser (Safari on iOS, Chrome on Android)
- 50MB free storage space

## What Works Offline

- View all cached lab results
- Browse charts and trends
- Read health insights
- Navigate previously viewed pages

## What Requires Internet

- Adding new lab results
- Syncing data across devices
- Receiving updates

## Troubleshooting

**App won't install?**
- iOS: Use Safari (not Chrome)
- Android: Use Chrome (not Firefox)
- Check storage space
- Clear browser cache

**Offline mode not working?**
- Open DevTools > Application > Service Workers
- Verify service worker is active
- Clear site data and reload

**More help:** See [Installation Guide](/docs/MOBILE_SETUP.md)

## For Developers

```bash
# Generate icons
node scripts/generate-icons.js

# Build for production
npm run build

# Deploy
npm run deploy
```

See [Implementation Summary](/docs/MOBILE_IMPLEMENTATION_SUMMARY.md) for details.

---

**Version:** 1.0.0 | **Last Updated:** April 2026
