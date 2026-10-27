// BeyondTheAI - Image Format Converter Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  // Initialize context menu item
  chrome.contextMenus.create({
    id: 'beyondtheai-convert-image',
    title: 'Convert Image with BeyondTheAI',
    contexts: ['image']
  });

  // Initialize trial storage if not already set
  chrome.storage.local.get(['subscription'], (res) => {
    if (!res.subscription) {
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      chrome.storage.local.set({
        subscription: {
          plan: 'trial_30d',
          startDate: now,
          expiryDate: now + thirtyDaysMs,
          status: 'active', // 'active' | 'expired'
          forcedExpiredForTesting: false
        },
        conversionHistory: []
      });
    }
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'beyondtheai-convert-image' && info.srcUrl) {
    // Save image URL to storage for the popup to pick up
    await chrome.storage.local.set({ pendingImageUrl: info.srcUrl });
    // Open popup or notification
    chrome.action.openPopup();
  }
});
