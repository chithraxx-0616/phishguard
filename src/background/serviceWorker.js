const logger = {
  info:  (...args) => console.log('[PhishGuard]', ...args),
  warn:  (...args) => console.warn('[PhishGuard]', ...args),
  error: (...args) => console.error('[PhishGuard]', ...args),
};

function parseURL(rawURL) {
  try {
    const url = new URL(rawURL);
    const hostParts = url.hostname.replace(/^www\./, '').split('.');
    return {
      raw: rawURL,
      protocol: url.protocol,
      hostname: url.hostname,
      domain: hostParts.slice(-2).join('.'),
      subdomains: hostParts.slice(0, -2),
      tld: hostParts.at(-1),
      path: url.pathname,
      isIP: /^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname),
      length: rawURL.length,
    };
  } catch {
    return null;
  }
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function httpCheck(parsed) {
  if (parsed.protocol === 'http:') {
    return { triggered: true, weight: 20, reason: 'Insecure HTTP - no encryption' };
  }
  return { triggered: false };
}

function urlStructureCheck(parsed) {
  const hits = [];
  if (parsed.isIP)
    hits.push({ weight: 45, reason: 'IP address used as hostname: ' + parsed.hostname });
  if (parsed.subdomains.length > 3)
    hits.push({ weight: 25, reason: 'Excessive subdomains (' + parsed.subdomains.length + ')' });
  if (parsed.length > 200)
    hits.push({ weight: 15, reason: 'Abnormally long URL (' + parsed.length + ' chars)' });
  if (parsed.raw.includes('@'))
    hits.push({ weight: 40, reason: 'URL contains @ symbol - misdirection trick' });
  if (/%[0-9a-fA-F]{2}/.test(parsed.hostname))
    hits.push({ weight: 35, reason: 'Encoded characters in hostname' });
  if (hits.length === 0) return { triggered: false };
  const totalWeight = hits.reduce((s, h) => s + h.weight, 0);
  const reason = hits.map(h => h.reason).join(' | ');
  return { triggered: true, weight: totalWeight, reason: reason };
}

function suspiciousKeywordsCheck(parsed) {
  const KEYWORDS = ['paypal','amazon','netflix','google','microsoft','apple',
    'facebook','instagram','twitter','bank','secure','verify',
    'update','login','signin','account','confirm','wallet'];
  const domain = parsed.domain.toLowerCase();
  const hit = KEYWORDS.find(k => domain.includes(k));
  if (hit && !domain.endsWith(hit + '.com') && !domain.endsWith(hit + '.org')) {
    return { triggered: true, weight: 30, reason: 'Brand keyword "' + hit + '" in untrusted domain' };
  }
  return { triggered: false };
}

function lookalikeDomainCheck(parsed) {
  const TOP = ['paypal.com','amazon.com','google.com','microsoft.com',
    'apple.com','facebook.com','netflix.com','instagram.com',
    'twitter.com','linkedin.com','github.com','chase.com'];
  const candidate = parsed.domain.toLowerCase();
  for (const trusted of TOP) {
    if (candidate === trusted) return { triggered: false };
    const dist = levenshtein(candidate, trusted);
    if (dist > 0 && dist <= 2) {
      return {
        triggered: true,
        weight: 60,
        reason: 'Lookalike domain - "' + candidate + '" is ' + dist + ' edit(s) from "' + trusted + '"'
      };
    }
  }
  return { triggered: false };
}

function analyzeURL(rawURL) {
  const parsed = parseURL(rawURL);
  if (!parsed) return null;
  const rules = [httpCheck, urlStructureCheck, suspiciousKeywordsCheck, lookalikeDomainCheck];
  const hits = rules.map(fn => fn(parsed)).filter(r => r.triggered);
  const score = Math.min(100, hits.reduce((s, h) => s + h.weight, 0));
  const risk = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  return { parsed, score, risk, ruleHits: hits };
}

const tabState = new Map();

function updateBadge(tabId, risk) {
  const colors = { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' };
  const labels = { high: '!', medium: '~', low: '' };
  chrome.action.setBadgeBackgroundColor({ tabId, color: colors[risk] || '#888' });
  chrome.action.setBadgeText({ tabId, text: labels[risk] || '' });
}

const SKIP = ['chrome://', 'chrome-extension://', 'about:', 'data:'];

chrome.webNavigation.onCommitted.addListener(function(details) {
  const url = details.url;
  const tabId = details.tabId;
  const frameId = details.frameId;
  if (frameId !== 0) return;
  if (SKIP.some(function(s) { return url.startsWith(s); })) return;
  const result = analyzeURL(url);
  if (!result) return;
  tabState.set(tabId, result);
  updateBadge(tabId, result.risk);
  logger.info('[' + result.risk.toUpperCase() + '] ' + result.parsed.hostname + ' - score: ' + result.score);
  if (result.risk === 'high' || result.risk === 'medium') {
    chrome.tabs.sendMessage(tabId, { type: 'PHISHGUARD_WARN', result: result }).catch(function() {});
  }
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  tabState.delete(tabId);
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === 'GET_TAB_STATE') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tab = tabs[0];
      sendResponse(tab ? (tabState.get(tab.id) || null) : null);
    });
    return true;
  }
});

logger.info('PhishGuard service worker started');