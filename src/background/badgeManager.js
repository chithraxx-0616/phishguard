const COLORS = { high: '#e74c3c', medium: '#f39c12', low: '#27ae60', none: '#888' };
const LABELS = { high: '!', medium: '~', low: '', none: '' };

export function updateBadge(tabId, risk = 'none') {
  chrome.action.setBadgeBackgroundColor({ tabId, color: COLORS[risk] });
  chrome.action.setBadgeText({ tabId, text: LABELS[risk] });
}