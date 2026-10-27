// BeyondTheAI - Image Format Converter Chrome Extension (Manifest V3)
import {
  getLicenseState,
  toggleForcedExpired,
  resetTrial,
  getHistory,
  saveHistoryItem,
  clearHistory
} from './subscription.js';
import { imageBlobToPdf } from './pdf-encoder.js';

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropzoneBox = document.getElementById('dropzoneBox');
const loadedFileCard = document.getElementById('loadedFileCard');
const fileThumb = document.getElementById('fileThumb');
const fileNameEl = document.getElementById('fileName');
const fileMetaEl = document.getElementById('fileMeta');
const removeFileBtn = document.getElementById('removeFileBtn');

const formatButtons = document.querySelectorAll('.format-btn');
const qualityGroup = document.getElementById('qualityGroup');
const qualitySlider = document.getElementById('qualitySlider');
const qualityVal = document.getElementById('qualityVal');
const customFileName = document.getElementById('customFileName');
const convertBtn = document.getElementById('convertBtn');

const resultCard = document.getElementById('resultCard');
const sizeReductionBadge = document.getElementById('sizeReductionBadge');
const originalSizeText = document.getElementById('originalSizeText');
const convertedSizeText = document.getElementById('convertedSizeText');
const downloadAgainBtn = document.getElementById('downloadAgainBtn');
const copyClipboardBtn = document.getElementById('copyClipboardBtn');

const expiredBanner = document.getElementById('expiredBanner');
const licenseBadge = document.getElementById('licenseBadge');
const licenseStatusText = document.getElementById('licenseStatusText');
const licenseDaysText = document.getElementById('licenseDaysText');
const licenseExpiryText = document.getElementById('licenseExpiryText');
const simulateExpireBtn = document.getElementById('simulateExpireBtn');
const resetTrialBtn = document.getElementById('resetTrialBtn');

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const historyList = document.getElementById('historyList');
const historyCountEl = document.getElementById('historyCount');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// State
let currentFile = null;
let currentImage = null;
let originalWidth = 0;
let originalHeight = 0;
let selectedFormat = 'png';
let convertedBlob = null;
let convertedFileName = '';
let licenseState = null;

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// 1. INITIALIZE & LICENSE CHECK
async function refreshLicenseUI() {
  licenseState = await getLicenseState();

  if (licenseState.canConvert) {
    licenseBadge.textContent = `⚡ ${licenseState.daysRemaining} Days Trial`;
    licenseBadge.className = 'license-badge';
    licenseStatusText.textContent = 'Active (Trial)';
    licenseStatusText.className = 'row-val status-active';
    expiredBanner.classList.add('hidden');
    updateConvertButtonState();
  } else {
    licenseBadge.textContent = '⚠️ Trial Expired';
    licenseBadge.className = 'license-badge expired';
    licenseStatusText.textContent = 'Expired';
    licenseStatusText.className = 'row-val status-expired';
    expiredBanner.classList.remove('hidden');
    convertBtn.disabled = true;
  }

  licenseDaysText.textContent = `${licenseState.daysRemaining} Days`;
  licenseExpiryText.textContent = licenseState.expiryDate;
  await refreshHistoryUI();
}

function updateConvertButtonState() {
  if (!licenseState || !licenseState.canConvert) {
    convertBtn.disabled = true;
    return;
  }
  convertBtn.disabled = !currentFile || !currentImage;
}

// 2. TAB SWITCHING
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.remove('active'));
    tabContents.forEach((c) => c.classList.remove('active'));

    btn.classList.add('active');
    const targetTabId = btn.dataset.tab === 'converter' ? 'tabConverter'
      : btn.dataset.tab === 'history' ? 'tabHistory'
      : 'tabLicense';
    document.getElementById(targetTabId)?.classList.add('active');
  });
});

// 3. FILE SELECTION & DRAG-AND-DROP
fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) handleFileSelected(file);
});

dropzoneBox.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzoneBox.classList.add('dragover');
});

dropzoneBox.addEventListener('dragleave', () => {
  dropzoneBox.classList.remove('dragover');
});

dropzoneBox.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzoneBox.classList.remove('dragover');
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    handleFileSelected(file);
  }
});

function handleFileSelected(file) {
  currentFile = file;
  const reader = new FileReader();

  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const img = new Image();

    img.onload = () => {
      currentImage = img;
      originalWidth = img.naturalWidth || img.width;
      originalHeight = img.naturalHeight || img.height;

      // Update UI
      fileNameEl.textContent = file.name;
      fileMetaEl.textContent = `${originalWidth} × ${originalHeight} px • ${formatBytes(file.size)}`;
      fileThumb.style.backgroundImage = `url(${dataUrl})`;

      dropzoneBox.classList.add('hidden');
      loadedFileCard.classList.remove('hidden');
      resultCard.classList.add('hidden');

      // Autofill custom file name base
      if (!customFileName.value) {
        customFileName.value = file.name.replace(/\.[^/.]+$/, '');
      }

      updateConvertButtonState();
    };

    img.src = dataUrl;
  };

  reader.readAsDataURL(file);
}

removeFileBtn.addEventListener('click', () => {
  currentFile = null;
  currentImage = null;
  fileInput.value = '';
  dropzoneBox.classList.remove('hidden');
  loadedFileCard.classList.add('hidden');
  resultCard.classList.add('hidden');
  updateConvertButtonState();
});

// 4. FORMAT SELECTION & QUALITY
formatButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    formatButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedFormat = btn.dataset.format;

    if (selectedFormat === 'jpg' || selectedFormat === 'webp') {
      qualityGroup.classList.remove('hidden');
    } else {
      qualityGroup.classList.add('hidden');
    }
  });
});

qualitySlider.addEventListener('input', (e) => {
  qualityVal.textContent = `${e.target.value}%`;
});

// 5. CONVERSION LOGIC
convertBtn.addEventListener('click', async () => {
  if (!licenseState.canConvert) {
    alert('Subscription required. Your 30-day trial has expired. Please renew to convert new images.');
    return;
  }

  if (!currentFile || !currentImage) return;

  convertBtn.disabled = true;
  convertBtn.querySelector('span').textContent = '⏳ Converting...';

  try {
    const quality = Number(qualitySlider.value) / 100;
    const baseName = customFileName.value.trim() || currentFile.name.replace(/\.[^/.]+$/, '') || 'image';
    convertedFileName = `${baseName}.${selectedFormat}`;

    let blob;

    if (selectedFormat === 'pdf') {
      // PDF conversion
      blob = await imageBlobToPdf(currentFile, originalWidth, originalHeight);
    } else {
      // Canvas raster conversion (PNG, JPG, WebP)
      const canvas = document.createElement('canvas');
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      const ctx = canvas.getContext('2d');

      // Fill white background for JPEG to prevent black transparent areas
      if (selectedFormat === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(currentImage, 0, 0);

      const mimeType = selectedFormat === 'jpg' ? 'image/jpeg'
        : selectedFormat === 'webp' ? 'image/webp'
        : 'image/png';

      blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
    }

    convertedBlob = blob;

    // Show result metrics
    const origSize = currentFile.size;
    const newSize = blob.size;
    const diffPct = Math.round(((newSize - origSize) / origSize) * 100);

    originalSizeText.textContent = formatBytes(origSize);
    convertedSizeText.textContent = formatBytes(newSize);

    if (diffPct <= 0) {
      sizeReductionBadge.textContent = `${diffPct}%`;
      sizeReductionBadge.style.color = 'var(--color-success)';
    } else {
      sizeReductionBadge.textContent = `+${diffPct}%`;
      sizeReductionBadge.style.color = 'var(--color-accent)';
    }

    resultCard.classList.remove('hidden');

    // Automatically trigger initial download
    triggerDownload(blob, convertedFileName);

    // Save to local history
    await saveHistoryItem({
      originalName: currentFile.name,
      outputName: convertedFileName,
      originalFormat: currentFile.name.split('.').pop()?.toUpperCase() || 'IMG',
      outputFormat: selectedFormat.toUpperCase(),
      originalSize: origSize,
      outputSize: newSize
    });

    await refreshHistoryUI();
  } catch (err) {
    console.error('Conversion error:', err);
    alert('An error occurred while converting the image. Please try again.');
  } finally {
    convertBtn.disabled = false;
    convertBtn.querySelector('span').textContent = '⚡ Convert & Download Image';
  }
});

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

downloadAgainBtn.addEventListener('click', () => {
  if (convertedBlob) triggerDownload(convertedBlob, convertedFileName);
});

copyClipboardBtn.addEventListener('click', async () => {
  if (!convertedBlob) return;
  try {
    // If not PNG, convert to PNG blob for clipboard compatibility
    let pngBlob = convertedBlob;
    if (convertedBlob.type !== 'image/png') {
      const canvas = document.createElement('canvas');
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(currentImage, 0, 0);
      pngBlob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    }

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob })
    ]);
    copyClipboardBtn.querySelector('span').textContent = '✅ Copied!';
    setTimeout(() => {
      copyClipboardBtn.querySelector('span').textContent = '📋 Copy to Clipboard';
    }, 2000);
  } catch (e) {
    console.warn('Clipboard write failed:', e);
    alert('Could not copy image to clipboard in this browser.');
  }
});

// 6. HISTORY UI (SAVE LEVEL DATA)
async function refreshHistoryUI() {
  const history = await getHistory();
  historyCountEl.textContent = String(history.length);

  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <span>No conversions recorded yet. Converted images will appear here and can be re-downloaded at any time.</span>
      </div>
    `;
    return;
  }

  historyList.innerHTML = history.map((item) => `
    <div class="history-item">
      <div class="history-details">
        <span class="history-name" title="${item.outputName}">${item.outputName}</span>
        <span class="history-meta">
          <span class="history-fmt-badge">${item.originalFormat} → ${item.outputFormat}</span>
          <span>${formatBytes(item.outputSize)}</span>
          <span>•</span>
          <span>${item.timestamp}</span>
        </span>
      </div>
    </div>
  `).join('');
}

clearHistoryBtn.addEventListener('click', async () => {
  if (confirm('Clear all conversion history?')) {
    await clearHistory();
    await refreshHistoryUI();
  }
});

// 7. DEVELOPER & SUBSCRIPTION TEST CONTROLS
simulateExpireBtn.addEventListener('click', async () => {
  await toggleForcedExpired(true);
  await refreshLicenseUI();
  alert('Simulated 30-day expiration! New conversions are now locked. Notice that your History remains completely visible and protected.');
});

resetTrialBtn.addEventListener('click', async () => {
  await resetTrial();
  await refreshLicenseUI();
  alert('Trial reset to 30 days active! Conversions are now enabled again.');
});

// INITIAL RUN
refreshLicenseUI();
