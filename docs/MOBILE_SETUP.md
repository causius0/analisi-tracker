# Mobile Application Setup Guide

## Progressive Web App (PWA) Installation

Analisi Tracker is built as a Progressive Web App (PWA), which means it can be installed on your mobile device and used like a native app, right from your browser.

### What is a PWA?

A Progressive Web App is a web application that:
- Works offline
- Can be installed on your home screen
- Has native-like performance
- Receives push notifications
- Provides an app-like experience

### Installation Instructions

#### iOS (iPhone/iPad)

1. **Open Safari** and navigate to your Analisi Tracker URL
2. **Tap the Share button** (square with arrow pointing up) at the bottom of the screen
3. **Scroll down** and tap "Add to Home Screen"
4. **Customize** the app name if desired
5. **Tap "Add"** in the top right corner
6. The app will appear on your home screen like any other app

#### Android (Chrome)

1. **Open Chrome** and navigate to your Analisi Tracker URL
2. **Tap the menu button** (three dots) in the top right corner
3. **Tap "Add to Home Screen"** or "Install App"
4. **Tap "Install"** or "Add Automatically"**
5. The app will appear on your home screen

#### Desktop (Chrome/Edge)

1. **Open your browser** and navigate to your Analisi Tracker URL
2. **Look for the install icon** (⊕ or computer with down arrow) in the address bar
3. **Click the install icon**
4. **Click "Install"** in the dialog
5. The app will open in its own window

## Features

### Offline Support

The app works offline by caching:
- Your lab results
- Charts and visualizations
- Dashboard data
- Previously viewed pages

**What works offline:**
- View all cached data
- Browse charts and trends
- Read health insights

**What requires internet:**
- Adding new lab results
- Syncing data across devices
- Receiving updates

### Mobile-Optimized UI

- **Bottom Navigation** - Easy thumb-friendly navigation
- **Pull to Refresh** - Update data with a gesture
- **Swipe Actions** - Quick actions on list items
- **Touch-Friendly Charts** - Interactive charts optimized for touch
- **Floating Action Button** - Quickly add new results
- **Large Touch Targets** - All buttons are at least 44x44px

### Performance Optimizations

- **Lazy Loading** - Images and components load as needed
- **Smart Caching** - Frequently used data is stored locally
- **Optimized Images** - Images compressed for mobile networks
- **Fast Loading** - App loads in under 3 seconds on 4G

## System Requirements

### Minimum Requirements

- **iOS 12+** or **Android 8+**
- Modern browser (Safari on iOS, Chrome on Android)
- 50MB free storage space
- Internet connection for initial setup

### Recommended

- **iOS 14+** or **Android 10+**
- Stable internet connection
- 100MB free storage space

## Setup for Developers

### 1. Install Dependencies

```bash
cd /path/to/analisi-tracker
npm install
```

### 2. Generate App Icons

```bash
node scripts/generate-icons.js
```

This generates SVG icons. For production, convert them to PNG:

```bash
# Install ImageMagick (Mac)
brew install imagemagick

# Convert SVG to PNG
cd client/public/icons
for f in *.svg; do convert "$f" "${f%.svg}.png"; done
```

### 3. Update Manifest

Edit `client/public/manifest.json` with your app details:

```json
{
  "name": "Analisi Tracker",
  "short_name": "Analisi",
  "description": "Your app description",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0d9488"
}
```

### 4. Configure Service Worker

The service worker (`client/public/sw.js`) is pre-configured with:
- Network-first strategy for API requests
- Stale-while-revalidate for JS/CSS
- Cache-first for images and fonts

Customize cache behavior as needed.

### 5. Build for Production

```bash
npm run build
```

The build will include:
- Optimized JavaScript bundle
- Minified CSS
- Compressed images
- PWA manifest and service worker

### 6. Deploy

Deploy the `client/build` (or `client/dist`) directory to your web server:

```bash
# Example: Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=client/build

# Example: Deploy to Vercel
npm install -g vercel
vercel --prod
```

## Troubleshooting

### App Won't Install

**iOS:**
- Make sure you're using Safari (not Chrome or Firefox)
- Check that you're not in Private Browsing mode
- Try reloading the page

**Android:**
- Make sure you're using Chrome (not Firefox)
- Clear browser cache and try again
- Check that you have enough storage space

### Offline Mode Not Working

**Check Service Worker:**
1. Open DevTools (F12)
2. Go to Application > Service Workers
3. Verify service worker is active
4. Clear site data and re-register

**Check Cache:**
1. Open DevTools > Application > Cache Storage
2. Verify caches are populated
3. Clear all caches and reload

### Push Notifications Not Working

**iOS:**
- Push notifications require iOS 16.4+
- Make sure notifications are enabled in Settings
- Check that the app has notification permissions

**Android:**
- Check Chrome notification permissions
- Make sure battery optimization doesn't block the app
- Verify notifications are enabled in app settings

### App Looks Blurry

- Make sure PNG icons are generated (not just SVG)
- Check that icon sizes match PWA requirements
- Regenerate icons at higher resolution

### Slow Performance

**Check Network:**
- Open DevTools > Network tab
- Verify assets are loading from cache
- Check bundle size (should be < 1MB)

**Optimize:**
- Enable lazy loading for images
- Reduce JavaScript bundle size
- Optimize image sizes
- Use code splitting

## Testing

### Test on Real Devices

1. **Deploy to staging environment**
2. **Open on mobile device**
3. **Test installation process**
4. **Test offline functionality**
5. **Test all gestures and interactions**

### Use Browser DevTools

1. **Open DevTools (F12)**
2. **Toggle device toolbar (Ctrl+Shift+M)**
3. **Select mobile device from dropdown**
4. **Test responsive design**
5. **Test touch gestures**

### Test Offline Mode

1. **Open app while online**
2. **Open DevTools > Network tab**
3. **Check "Offline" checkbox**
4. **Navigate through app**
5. **Verify cached content loads**

## Security Considerations

### HTTPS Required

PWAs require HTTPS to work (except on localhost). Ensure your site is served over HTTPS with a valid SSL certificate.

### Data Privacy

- All sensitive data is encrypted
- Credentials stored securely
- No data shared with third parties
- HIPAA compliance for healthcare data

### Cache Management

The service worker caches:
- Static assets (images, fonts, CSS, JS)
- API responses (configurable TTL)
- User data (encrypted)

Clear cache by:
1. Opening app settings
2. Tapping "Clear Cache"
3. Confirming action

## Support

For issues or questions:
- Check documentation: `/docs`
- Review troubleshooting above
- Open an issue on GitHub
- Contact support team

## Updates

The app automatically checks for updates every hour. When an update is available:
- You'll see a prompt to refresh
- Data is preserved during updates
- Old cache is cleared automatically

To manually update:
1. Pull down to refresh (if available)
2. Close and reopen the app
3. Clear cache and reload

---

**Last Updated:** April 2026
**Version:** 1.0.0
