// BeyondTheAI - Subscription & Trial Manager
// Manages trial timing (30 days), license checks, and local conversion history.
// When expired, new conversions are locked, while past saved history remains visible.

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const storage = {
  async get(keys) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
    }
    const result = {};
    for (const key of keys) {
      const val = localStorage.getItem(`beyondtheai_${key}`);
      if (val) {
        try { result[key] = JSON.parse(val); } catch (e) { result[key] = val; }
      }
    }
    return result;
  },
  async set(items) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => chrome.storage.local.set(items, resolve));
    }
    for (const [k, v] of Object.entries(items)) {
      localStorage.setItem(`beyondtheai_${k}`, JSON.stringify(v));
    }
  }
};

export async function getLicenseState() {
  const data = await storage.get(['subscription']);
  let sub = data.subscription;
  const now = Date.now();

  if (!sub) {
    sub = {
      plan: 'trial_30d',
      startDate: now,
      expiryDate: now + THIRTY_DAYS_MS,
      status: 'active',
      forcedExpiredForTesting: false
    };
    await storage.set({ subscription: sub });
  }

  // Check if forced expired for testing or actual expiry
  const isExpired = sub.forcedExpiredForTesting || now >= sub.expiryDate;
  const msRemaining = Math.max(0, sub.expiryDate - now);
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

  return {
    plan: sub.plan,
    status: isExpired ? 'expired' : 'active',
    startDate: new Date(sub.startDate).toLocaleDateString(),
    expiryDate: new Date(sub.expiryDate).toLocaleDateString(),
    daysRemaining: isExpired ? 0 : daysRemaining,
    forcedExpired: Boolean(sub.forcedExpiredForTesting),
    canConvert: !isExpired
  };
}

export async function toggleForcedExpired(expired) {
  const data = await storage.get(['subscription']);
  const sub = data.subscription || {
    plan: 'trial_30d',
    startDate: Date.now(),
    expiryDate: Date.now() + THIRTY_DAYS_MS,
    status: 'active'
  };
  sub.forcedExpiredForTesting = expired;
  await storage.set({ subscription: sub });
  return getLicenseState();
}

export async function resetTrial() {
  const now = Date.now();
  const sub = {
    plan: 'trial_30d',
    startDate: now,
    expiryDate: now + THIRTY_DAYS_MS,
    status: 'active',
    forcedExpiredForTesting: false
  };
  await storage.set({ subscription: sub });
  return getLicenseState();
}

export async function getHistory() {
  const data = await storage.get(['conversionHistory']);
  return data.conversionHistory || [];
}

export async function saveHistoryItem(item) {
  const history = await getHistory();
  const newItem = {
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleString(),
    originalName: item.originalName,
    outputName: item.outputName,
    originalFormat: item.originalFormat,
    outputFormat: item.outputFormat,
    originalSize: item.originalSize,
    outputSize: item.outputSize,
    dataUrl: item.dataUrl || null // thumbnail or data
  };

  history.unshift(newItem);
  // Keep last 30 items
  if (history.length > 30) history.pop();

  await storage.set({ conversionHistory: history });
  return history;
}

export async function clearHistory() {
  await storage.set({ conversionHistory: [] });
  return [];
}
