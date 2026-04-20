import { analyzeURL } from '../core/ruleEngine.js';
import { tabState }   from './tabStateManager.js';
import { updateBadge }from './badgeManager.js';
import { logger }     from '../utils/logger.js';

const SKIP = ['chrome://', 'chrome-extension://', 'about:', 'data:'];

export function registerNavigationListener() {
  chrome.webNavigation.onCommitted.addListener(({ url, tabId, frameId }) => {
    if (frameId !== 0) return;
    if (SKIP.some(s => url.startsWith(s))) return;

    const result = analyzeURL(url);
    if (!result) return;

    tabState.set(tabId, result);
    saveThreatToHistory(result);
    updateBadge(tabId, result.risk);
    logger.info(`[${result.risk.toUpperCase()}] ${result.parsed.hostname} — score: ${result.score}`);

    if (result.risk === 'high' || result.risk === 'medium') {
      chrome.tabs.sendMessage(tabId, { type: 'PHISHGUARD_WARN', result }).catch(() => {});
    }
  });

  chrome.tabs.onRemoved.addListener(tabId => tabState.clear(tabId));
}