# Analisi Tracker - User Testing Guide

**Quick Start Guide for Testing the Application**

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Application

Open your terminal and run:

```bash
cd /Users/causius/Documents/GitHub/analisi-tracker
npm run dev
```

**Expected Output:**
```
✓ Starting...
✓ Ready in 1038ms
- Local: http://localhost:3001
```

---

### Step 2: Open in Browser

1. Open your web browser
2. Navigate to: **http://localhost:3001**
3. Wait 2-3 seconds for the page to load

**What You Should See:**
- Clean homepage with "Analisi Tracker" heading
- Welcome section describing the platform
- Blue banner saying "Demo Mode Active"
- Quick stats showing zeros
- Sample chart placeholders
- Getting started guide

---

### Step 3: Basic Testing

#### ✅ Test 1: Page Load
- [ ] Page loads without errors
- [ ] No spinning loader forever
- [ ] All sections visible

#### ✅ Test 2: Visual Check
- [ ] Text is readable (not too small)
- [ ] Colors look good (not broken)
- [ ] Layout is organized

#### ✅ Test 3: Responsive Design
- [ ] Resize browser window
- [ ] Layout adjusts to mobile (single column)
- [ ] Layout adjusts to desktop (multiple columns)

#### ✅ Test 4: Console Check
1. Right-click anywhere on page
2. Select "Inspect" or "Inspect Element"
3. Click "Console" tab
4. [ ] No red error messages
5. [ ] No warnings (or only minor ones)

---

## 📋 Testing Checklist

### Basic Functionality

**Homepage:**
- [ ] Heading displays correctly: "Analisi Tracker"
- [ ] Subtitle visible: "Advanced Medical Lab Test Analytics Platform"
- [ ] Welcome section loads
- [ ] Feature highlights show 3 cards
- [ ] Demo mode banner is blue and visible
- [ ] Quick stats show 4 cards with zeros
- [ ] Sample charts show placeholder boxes
- [ ] Getting started guide shows 3 steps

**Navigation:**
- [ ] Page scrolls smoothly
- [ ] No broken links
- [ ] No missing images

**Layout:**
- [ ] Content is centered
- [ ] Spacing is consistent
- [ ] Borders are visible
- [ ] Background colors render

---

### Browser Compatibility

Test in these browsers (if available):

- [ ] **Chrome/Edge** (Chromium)
- [ ] **Firefox**
- [ ] **Safari** (if on Mac)
- [ ] **Mobile Safari** (iPhone)
- [ ] **Chrome Mobile** (Android)

**What to Check:**
- Page loads
- Layout looks correct
- No console errors
- Text is readable

---

### Device Testing

**Desktop (1920x1080):**
- [ ] Full 4-column stats grid
- [ ] 2-column chart layout
- [ ] Content not too wide

**Tablet (768x1024):**
- [ ] Stats stack to 2 columns
- [ ] Charts stack vertically
- [ ] Text still readable

**Mobile (375x667):**
- [ ] Everything single column
- [ ] Text large enough to read
- [ ] No horizontal scrolling
- [ ] Buttons easy to tap

---

## 🐛 Known Issues

### 1. TypeScript Warnings
**Issue:** Some TypeScript type errors in console
**Impact:** None - cosmetic only
**Status:** Temporary workaround in place

### 2. Chart Placeholders
**Issue:** Charts show "Chart placeholder" message
**Reason:** No data in demo mode
**Expected:** This is normal behavior

### 3. Stats Show Zero
**Issue:** All stats show "0"
**Reason:** No backend connected in demo mode
**Expected:** This is normal behavior

---

## 🔧 Troubleshooting

### Problem: Page Won't Load

**Try These:**
1. Check terminal - is server still running?
2. Try refreshing the page (Cmd+R or F5)
3. Clear browser cache
4. Try different browser
5. Check port 3001 is correct

**Still Not Working:**
```bash
# Stop server (Ctrl+C)
# Restart server
npm run dev
```

---

### Problem: Console Errors

**Minor Errors (OK to Ignore):**
- Warning about missing `critters` module
- TypeScript type warnings
- React warnings about useEffect

**Critical Errors (Not OK):**
- "Failed to fetch"
- "Module not found"
- "Cannot read property of undefined"

**If Critical Errors:**
1. Copy the error message
2. Check the Integration Report
3. Report in issues

---

### Problem: Page Looks Broken

**Check These:**
1. Is browser zoom at 100%?
2. Is browser window very narrow?
3. Is dark mode enabled? (may look different)

**Try:**
1. Reset browser zoom
2. Widen browser window
3. Refresh page
4. Try different browser

---

## 📸 Screenshots to Take

During testing, capture screenshots of:

1. **Full Homepage** (desktop view)
2. **Mobile View** (narrow browser or phone)
3. **Console** (DevTools open)
4. **Any Errors** (if they occur)

**How to Screenshot:**
- **Mac:** Cmd+Shift+4 (select area)
- **Windows:** Win+Shift+S (select area)
- **Full Page:** Use browser extension or print to PDF

---

## ✅ Success Criteria

The application is **working correctly** if:

- [x] Page loads in under 5 seconds
- [x] All text is visible and readable
- [x] Layout is organized and professional
- [x] No critical console errors
- [x] Responsive design works
- [x] Demo mode banner is visible
- [x] Getting started guide is clear

---

## 🎯 What to Test Next

After basic testing works, try:

### Advanced Testing (Optional)

1. **Add Sample Data**
   - Create a simple data entry form
   - Enter mock lab results
   - Verify data displays

2. **Connect Backend**
   - Follow "Connecting to Real Backend" guide
   - Start PostgreSQL database
   - Run migrations
   - Test with real data

3. **Export Features**
   - Try exporting to CSV
   - Try exporting to PDF
   - Verify downloaded files

4. **Mobile Testing**
   - Test on actual phone
   - Check touch interactions
   - Verify mobile performance

---

## 📝 Feedback Template

When reporting issues, include:

```
**Issue Title:** [Brief description]

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Browser:** [Chrome/Firefox/Safari + version]

**Device:** [Desktop/Mobile/Tablet]

**Screenshot:** [Attach if applicable]

**Console Errors:** [Copy any red errors]
```

---

## 🎉 Testing Complete!

If everything works:

✅ **Great!** The application is ready for development

**Next Steps:**
1. Fix TypeScript errors
2. Implement real chart components
3. Connect to backend API
4. Add user authentication
5. Deploy to staging

**Need Help?**
- Check Integration Report: `INTEGRATION_REPORT.md`
- Read README: `README.md`
- Check docs: `/docs` folder

---

**Happy Testing! 🚀**

_Last Updated: April 7, 2026_
