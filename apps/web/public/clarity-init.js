// Microsoft Clarity, loaded only on the production domain (an external file, so no inline script).
// Default is no-consent mode: Clarity sets no cookies and treats each page view separately.
// Cookies are allowed only after the visitor taps "Allow"; the choice is kept in localStorage.
const PROJECT_ID = 'z5r1hta492'; // Clarity project: BeyondTheAI (beyandtheai.com)
const CONSENT_KEY = 'mt.analyticsConsent'; // 'granted' | 'denied'

const readConsent = () => {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
};

const saveConsent = (state) => {
  try {
    localStorage.setItem(CONSENT_KEY, state);
  } catch {
    // Storage blocked: the notice is shown again on the next visit.
  }
};

const sendConsent = (state) =>
  window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: state });

const loadClarity = () => {
  const queue = [];
  window.clarity = window.clarity || Object.assign((...args) => queue.push(args), { q: queue });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.clarity.ms/tag/${PROJECT_ID}`;
  document.head.appendChild(tag);
};

const BOX_STYLE =
  'position:fixed;left:8px;bottom:8px;width:calc(100vw - 16px);max-width:520px;z-index:50;' +
  'background:#111827;color:#f9fafb;border-radius:12px;padding:12px 14px;' +
  'font:14px/1.45 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25);' +
  'display:flex;flex-wrap:wrap;gap:8px;box-sizing:border-box';
const BUTTON_STYLE =
  'flex:1 1 0;min-height:44px;padding:0 16px;border-radius:8px;cursor:pointer;' +
  'font:600 14px system-ui,sans-serif;';
const PRIMARY = 'background:#f59e0b;color:#111827;border:0';
const SECONDARY = 'background:transparent;color:#f9fafb;border:1px solid #6b7280';

const makeButton = (label, style, onChoose) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.cssText = BUTTON_STYLE + style;
  button.addEventListener('click', onChoose);
  return button;
};

const showNotice = () => {
  const box = document.createElement('div');
  box.setAttribute('role', 'region');
  box.setAttribute('aria-label', 'Analytics choice');
  box.style.cssText = BOX_STYLE;
  const text = document.createElement('p');
  text.style.cssText = 'margin:0;flex:1 1 100%';
  text.textContent =
    'We use Microsoft Clarity to find where pages are hard to use. ' +
    'What you type is masked. No cookies unless you allow. ';
  const link = document.createElement('a');
  link.href = '/privacy';
  link.textContent = 'Privacy';
  link.style.color = '#93c5fd';
  text.appendChild(link);
  const choose = (state) => () => {
    saveConsent(state);
    sendConsent(state);
    box.remove();
  };
  box.append(
    text,
    makeButton('No thanks', SECONDARY, choose('denied')),
    makeButton('Allow', PRIMARY, choose('granted')),
  );
  document.body.appendChild(box);
};

if (PROJECT_ID && location.hostname === 'beyandtheai.com') {
  loadClarity();
  const saved = readConsent();
  sendConsent(saved === 'granted' ? 'granted' : 'denied');
  if (!saved) {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', showNotice);
    else showNotice();
  }
}
