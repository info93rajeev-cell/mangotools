"use strict";
(() => {
  // apps/chrome-extension/subscription.js
  var THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1e3;
  var storage = {
    async get(keys) {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
      }
      const result = {};
      for (const key of keys) {
        const val = localStorage.getItem(`beyondtheai_${key}`);
        if (val) {
          try {
            result[key] = JSON.parse(val);
          } catch (e) {
            result[key] = val;
          }
        }
      }
      return result;
    },
    async set(items) {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => chrome.storage.local.set(items, resolve));
      }
      for (const [k, v] of Object.entries(items)) {
        localStorage.setItem(`beyondtheai_${k}`, JSON.stringify(v));
      }
    }
  };
  async function getLicenseState() {
    const data = await storage.get(["subscription"]);
    let sub = data.subscription;
    const now = Date.now();
    if (!sub) {
      sub = {
        plan: "trial_30d",
        startDate: now,
        expiryDate: now + THIRTY_DAYS_MS,
        status: "active",
        forcedExpiredForTesting: false
      };
      await storage.set({ subscription: sub });
    }
    const isExpired = sub.forcedExpiredForTesting || now >= sub.expiryDate;
    const msRemaining = Math.max(0, sub.expiryDate - now);
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1e3));
    return {
      plan: sub.plan,
      status: isExpired ? "expired" : "active",
      startDate: new Date(sub.startDate).toLocaleDateString(),
      expiryDate: new Date(sub.expiryDate).toLocaleDateString(),
      daysRemaining: isExpired ? 0 : daysRemaining,
      forcedExpired: Boolean(sub.forcedExpiredForTesting),
      canConvert: !isExpired
    };
  }
  async function toggleForcedExpired(expired) {
    const data = await storage.get(["subscription"]);
    const sub = data.subscription || {
      plan: "trial_30d",
      startDate: Date.now(),
      expiryDate: Date.now() + THIRTY_DAYS_MS,
      status: "active"
    };
    sub.forcedExpiredForTesting = expired;
    await storage.set({ subscription: sub });
    return getLicenseState();
  }
  async function resetTrial() {
    const now = Date.now();
    const sub = {
      plan: "trial_30d",
      startDate: now,
      expiryDate: now + THIRTY_DAYS_MS,
      status: "active",
      forcedExpiredForTesting: false
    };
    await storage.set({ subscription: sub });
    return getLicenseState();
  }
  async function getHistory() {
    const data = await storage.get(["conversionHistory"]);
    return data.conversionHistory || [];
  }
  async function saveHistoryItem(item) {
    const history = await getHistory();
    const newItem = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleString(),
      originalName: item.originalName,
      outputName: item.outputName,
      originalFormat: item.originalFormat,
      outputFormat: item.outputFormat,
      originalSize: item.originalSize,
      outputSize: item.outputSize,
      dataUrl: item.dataUrl || null
      // thumbnail or data
    };
    history.unshift(newItem);
    if (history.length > 30) history.pop();
    await storage.set({ conversionHistory: history });
    return history;
  }
  async function clearHistory() {
    await storage.set({ conversionHistory: [] });
    return [];
  }

  // apps/chrome-extension/pdf-encoder.js
  async function imageBlobToPdf(imageBlob, width, height) {
    let jpegBlob = imageBlob;
    if (imageBlob.type !== "image/jpeg") {
      jpegBlob = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || width;
          canvas.height = img.naturalHeight || height;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
        };
        img.src = URL.createObjectURL(imageBlob);
      });
    }
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    const imgWidth = width || 800;
    const imgHeight = height || 600;
    const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
    const obj3 = `3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${imgWidth} ${imgHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>
endobj
`;
    const obj4Head = `4 0 obj
<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>
stream
`;
    const obj4Foot = "\nendstream\nendobj\n";
    const streamContent = `q
${imgWidth} 0 0 ${imgHeight} 0 0 cm
/Im1 Do
Q
`;
    const obj5 = `5 0 obj
<< /Length ${streamContent.length} >>
stream
${streamContent}endstream
endobj
`;
    const enc = new TextEncoder();
    const bHeader = enc.encode(header);
    const bObj1 = enc.encode(obj1);
    const bObj2 = enc.encode(obj2);
    const bObj3 = enc.encode(obj3);
    const bObj4Head = enc.encode(obj4Head);
    const bObj4Foot = enc.encode(obj4Foot);
    const bObj5 = enc.encode(obj5);
    const offsets = [
      0,
      bHeader.length,
      bHeader.length + bObj1.length,
      bHeader.length + bObj1.length + bObj2.length,
      bHeader.length + bObj1.length + bObj2.length + bObj3.length,
      bHeader.length + bObj1.length + bObj2.length + bObj3.length + bObj4Head.length + jpegBytes.length + bObj4Foot.length
    ];
    const xrefOffset = offsets[5] + bObj5.length;
    let xref = `xref
0 6
0000000000 65535 f 
`;
    for (let i = 1; i <= 5; i++) {
      xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    }
    const trailer = `trailer
<< /Size 6 /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF
`;
    const bXref = enc.encode(xref);
    const bTrailer = enc.encode(trailer);
    const totalLength = xrefOffset + bXref.length + bTrailer.length;
    const pdfBuffer = new Uint8Array(totalLength);
    let cur = 0;
    pdfBuffer.set(bHeader, cur);
    cur += bHeader.length;
    pdfBuffer.set(bObj1, cur);
    cur += bObj1.length;
    pdfBuffer.set(bObj2, cur);
    cur += bObj2.length;
    pdfBuffer.set(bObj3, cur);
    cur += bObj3.length;
    pdfBuffer.set(bObj4Head, cur);
    cur += bObj4Head.length;
    pdfBuffer.set(jpegBytes, cur);
    cur += jpegBytes.length;
    pdfBuffer.set(bObj4Foot, cur);
    cur += bObj4Foot.length;
    pdfBuffer.set(bObj5, cur);
    cur += bObj5.length;
    pdfBuffer.set(bXref, cur);
    cur += bXref.length;
    pdfBuffer.set(bTrailer, cur);
    return new Blob([pdfBuffer], { type: "application/pdf" });
  }

  // apps/chrome-extension/popup.js
  var fileInput = document.getElementById("fileInput");
  var dropzoneBox = document.getElementById("dropzoneBox");
  var loadedFileCard = document.getElementById("loadedFileCard");
  var fileThumb = document.getElementById("fileThumb");
  var fileNameEl = document.getElementById("fileName");
  var fileMetaEl = document.getElementById("fileMeta");
  var removeFileBtn = document.getElementById("removeFileBtn");
  var formatButtons = document.querySelectorAll(".format-btn");
  var qualityGroup = document.getElementById("qualityGroup");
  var qualitySlider = document.getElementById("qualitySlider");
  var qualityVal = document.getElementById("qualityVal");
  var customFileName = document.getElementById("customFileName");
  var convertBtn = document.getElementById("convertBtn");
  var resultCard = document.getElementById("resultCard");
  var sizeReductionBadge = document.getElementById("sizeReductionBadge");
  var originalSizeText = document.getElementById("originalSizeText");
  var convertedSizeText = document.getElementById("convertedSizeText");
  var downloadAgainBtn = document.getElementById("downloadAgainBtn");
  var copyClipboardBtn = document.getElementById("copyClipboardBtn");
  var expiredBanner = document.getElementById("expiredBanner");
  var licenseBadge = document.getElementById("licenseBadge");
  var licenseStatusText = document.getElementById("licenseStatusText");
  var licenseDaysText = document.getElementById("licenseDaysText");
  var licenseExpiryText = document.getElementById("licenseExpiryText");
  var simulateExpireBtn = document.getElementById("simulateExpireBtn");
  var resetTrialBtn = document.getElementById("resetTrialBtn");
  var tabButtons = document.querySelectorAll(".tab-btn");
  var tabContents = document.querySelectorAll(".tab-content");
  var historyList = document.getElementById("historyList");
  var historyCountEl = document.getElementById("historyCount");
  var clearHistoryBtn = document.getElementById("clearHistoryBtn");
  var currentFile = null;
  var currentImage = null;
  var originalWidth = 0;
  var originalHeight = 0;
  var selectedFormat = "png";
  var convertedBlob = null;
  var convertedFileName = "";
  var licenseState = null;
  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  async function refreshLicenseUI() {
    licenseState = await getLicenseState();
    if (licenseState.canConvert) {
      licenseBadge.textContent = `\u26A1 ${licenseState.daysRemaining} Days Trial`;
      licenseBadge.className = "license-badge";
      licenseStatusText.textContent = "Active (Trial)";
      licenseStatusText.className = "row-val status-active";
      expiredBanner.classList.add("hidden");
      updateConvertButtonState();
    } else {
      licenseBadge.textContent = "\u26A0\uFE0F Trial Expired";
      licenseBadge.className = "license-badge expired";
      licenseStatusText.textContent = "Expired";
      licenseStatusText.className = "row-val status-expired";
      expiredBanner.classList.remove("hidden");
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
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const targetTabId = btn.dataset.tab === "converter" ? "tabConverter" : btn.dataset.tab === "history" ? "tabHistory" : "tabLicense";
      document.getElementById(targetTabId)?.classList.add("active");
    });
  });
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  });
  dropzoneBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzoneBox.classList.add("dragover");
  });
  dropzoneBox.addEventListener("dragleave", () => {
    dropzoneBox.classList.remove("dragover");
  });
  dropzoneBox.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzoneBox.classList.remove("dragover");
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
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
        fileNameEl.textContent = file.name;
        fileMetaEl.textContent = `${originalWidth} \xD7 ${originalHeight} px \u2022 ${formatBytes(file.size)}`;
        fileThumb.style.backgroundImage = `url(${dataUrl})`;
        dropzoneBox.classList.add("hidden");
        loadedFileCard.classList.remove("hidden");
        resultCard.classList.add("hidden");
        if (!customFileName.value) {
          customFileName.value = file.name.replace(/\.[^/.]+$/, "");
        }
        updateConvertButtonState();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }
  removeFileBtn.addEventListener("click", () => {
    currentFile = null;
    currentImage = null;
    fileInput.value = "";
    dropzoneBox.classList.remove("hidden");
    loadedFileCard.classList.add("hidden");
    resultCard.classList.add("hidden");
    updateConvertButtonState();
  });
  formatButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      formatButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedFormat = btn.dataset.format;
      if (selectedFormat === "jpg" || selectedFormat === "webp") {
        qualityGroup.classList.remove("hidden");
      } else {
        qualityGroup.classList.add("hidden");
      }
    });
  });
  qualitySlider.addEventListener("input", (e) => {
    qualityVal.textContent = `${e.target.value}%`;
  });
  convertBtn.addEventListener("click", async () => {
    if (!licenseState.canConvert) {
      alert("Subscription required. Your 30-day trial has expired. Please renew to convert new images.");
      return;
    }
    if (!currentFile || !currentImage) return;
    convertBtn.disabled = true;
    convertBtn.querySelector("span").textContent = "\u23F3 Converting...";
    try {
      const quality = Number(qualitySlider.value) / 100;
      const baseName = customFileName.value.trim() || currentFile.name.replace(/\.[^/.]+$/, "") || "image";
      convertedFileName = `${baseName}.${selectedFormat}`;
      let blob;
      if (selectedFormat === "pdf") {
        blob = await imageBlobToPdf(currentFile, originalWidth, originalHeight);
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        const ctx = canvas.getContext("2d");
        if (selectedFormat === "jpg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(currentImage, 0, 0);
        const mimeType = selectedFormat === "jpg" ? "image/jpeg" : selectedFormat === "webp" ? "image/webp" : "image/png";
        blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
      }
      convertedBlob = blob;
      const origSize = currentFile.size;
      const newSize = blob.size;
      const diffPct = Math.round((newSize - origSize) / origSize * 100);
      originalSizeText.textContent = formatBytes(origSize);
      convertedSizeText.textContent = formatBytes(newSize);
      if (diffPct <= 0) {
        sizeReductionBadge.textContent = `${diffPct}%`;
        sizeReductionBadge.style.color = "var(--color-success)";
      } else {
        sizeReductionBadge.textContent = `+${diffPct}%`;
        sizeReductionBadge.style.color = "var(--color-accent)";
      }
      resultCard.classList.remove("hidden");
      triggerDownload(blob, convertedFileName);
      await saveHistoryItem({
        originalName: currentFile.name,
        outputName: convertedFileName,
        originalFormat: currentFile.name.split(".").pop()?.toUpperCase() || "IMG",
        outputFormat: selectedFormat.toUpperCase(),
        originalSize: origSize,
        outputSize: newSize
      });
      await refreshHistoryUI();
    } catch (err) {
      console.error("Conversion error:", err);
      alert("An error occurred while converting the image. Please try again.");
    } finally {
      convertBtn.disabled = false;
      convertBtn.querySelector("span").textContent = "\u26A1 Convert & Download Image";
    }
  });
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4e3);
  }
  downloadAgainBtn.addEventListener("click", () => {
    if (convertedBlob) triggerDownload(convertedBlob, convertedFileName);
  });
  copyClipboardBtn.addEventListener("click", async () => {
    if (!convertedBlob) return;
    try {
      let pngBlob = convertedBlob;
      if (convertedBlob.type !== "image/png") {
        const canvas = document.createElement("canvas");
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(currentImage, 0, 0);
        pngBlob = await new Promise((r) => canvas.toBlob(r, "image/png"));
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob })
      ]);
      copyClipboardBtn.querySelector("span").textContent = "\u2705 Copied!";
      setTimeout(() => {
        copyClipboardBtn.querySelector("span").textContent = "\u{1F4CB} Copy to Clipboard";
      }, 2e3);
    } catch (e) {
      console.warn("Clipboard write failed:", e);
      alert("Could not copy image to clipboard in this browser.");
    }
  });
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
          <span class="history-fmt-badge">${item.originalFormat} \u2192 ${item.outputFormat}</span>
          <span>${formatBytes(item.outputSize)}</span>
          <span>\u2022</span>
          <span>${item.timestamp}</span>
        </span>
      </div>
    </div>
  `).join("");
  }
  clearHistoryBtn.addEventListener("click", async () => {
    if (confirm("Clear all conversion history?")) {
      await clearHistory();
      await refreshHistoryUI();
    }
  });
  simulateExpireBtn.addEventListener("click", async () => {
    await toggleForcedExpired(true);
    await refreshLicenseUI();
    alert("Simulated 30-day expiration! New conversions are now locked. Notice that your History remains completely visible and protected.");
  });
  resetTrialBtn.addEventListener("click", async () => {
    await resetTrial();
    await refreshLicenseUI();
    alert("Trial reset to 30 days active! Conversions are now enabled again.");
  });
  refreshLicenseUI();
})();
