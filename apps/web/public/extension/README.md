# BeyondTheAI — Image Format Converter (Google Chrome Extension)

An ultra-fast, 100% offline-capable **Manifest V3 Google Chrome Extension** for converting images across JPG, PNG, WebP, and PDF with official **BeyondTheAI** branding.

---

## 🌟 Key Features

1. **Official BeyondTheAI Branding**:
   - Signature `[B]` logo mark in gold (`#ffb000`) and rich dark slate theme (`#0c0a09` / `#1c1917`).
   - Clean, modern layout matching the web suite.
   - Tagline: *“100% In-Browser. No Files Uploaded to External Servers.”*

2. **Universal Upload Dropzone**:
   - Unified dropzone matching the web tools: Cloud icon (`☁️↑`), `"Drag and drop images here"`, `"or"`, `[ ⬆ Upload Image ]` browse button, and file support hints.
   - Loaded card state with thumbnail preview, dimensions, and file size.

3. **Multi-Format Conversion**:
   - Target formats: **PNG** (lossless & alpha), **JPG** (photo standard), **WebP** (high compression), and **PDF** (single-page document wrapper).
   - Adjustable quality slider (1% – 100%) for JPG and WebP.
   - Automatic alpha-transparency handling for PNG ➔ JPG (clean white background fill, preventing black transparent borders).
   - Instant file comparison metrics: Old size ➔ New size, percentage saved.
   - One-click direct download and "Copy to Clipboard" support.

4. **Conversion History ("Save Level")**:
   - Automatically saves records of previous conversions in local storage (`chrome.storage.local`).
   - Users can review past conversions, formats, timestamps, and sizes anytime.

5. **30-Day Trial & Subscription Timer Architecture**:
   - Initializes a 30-day active trial.
   - When the trial expires:
     - The extension cleanly blocks new file conversions with a prominent notice.
     - **Data Protection:** Previously saved conversion history remains 100% intact and visible (data is never deleted).
   - **One-Click Test Controls:** Under the **License** tab, you can click **"Simulate 30-Day Expiry"** to immediately test the expired lock behavior, or **"Reset 30-Day Trial"** to reactivate.

---

## 🚀 How to Install and Test in Google Chrome

Follow these 4 simple steps to test the extension in Google Chrome:

1. **Open Chrome Extensions Page**:
   - In Google Chrome, type or navigate to: `chrome://extensions` in the address bar.

2. **Enable Developer Mode**:
   - Turn ON the **"Developer mode"** toggle switch in the top-right corner of the page.

3. **Load Unpacked Extension**:
   - Click the **"Load unpacked"** button in the top-left corner.
   - In the file picker, navigate to:
     ```
     E:\Tools\mangotools\apps\chrome-extension
     ```
   - Click **Select Folder**.

4. **Pin & Test the Extension**:
   - Click the puzzle piece icon (Extensions) in Chrome's top toolbar.
   - Pin **BeyondTheAI - Image Format Converter**.
   - Click the BeyondTheAI `[B]` icon in your toolbar to open the extension popup!

---

## 🧪 Testing Guide

- **Test Image Conversion**:
  - Drag and drop an image (or click `Upload Image`).
  - Choose `WebP`, `JPG`, `PNG`, or `PDF`.
  - Adjust quality or custom filename.
  - Click `⚡ Convert & Download Image`.
  - Verify that the image converts instantly and saves to your Downloads folder.

- **Test History Tab**:
  - Switch to the **History** tab to see your converted files saved.

- **Test Subscription Lock**:
  - Switch to the **License** tab.
  - Click **"Simulate 30-Day Expiry"**.
  - Switch back to the **Converter** tab.
  - Notice the expired warning banner appears and the `Convert` button is safely locked.
  - Switch back to **History** to verify that all previous conversion records are still completely intact and safe.
  - Switch back to **License** and click **"Reset 30-Day Trial"** to re-enable conversions!
