// ============ INDEXEDDB BLOCKLIST ============
var phishDB = null;
var blockedDomains = new Set([
  "paypal-secure-login.com","accounts-google-verify.com",
  "amazon-security-alert.com","appleid-verify-account.com",
  "microsoft-account-verify.com","netflix-billing-update.com",
  "secure-bankofamerica-login.com","chase-secure-login.net",
  "wellsfargo-verify.com","instagram-verify-account.com",
  "facebook-security-check.com","twitter-account-suspended.com",
  "linkedin-account-verify.net","dropbox-secure-share.com",
  "steam-trade-offer.net","coinbase-wallet-verify.com",
  "blockchain-wallet-login.net","binance-secure-login.com",
  "crypto-wallet-verify.net","irs-tax-refund-2024.com",
  "fedex-delivery-tracking.net","dhl-package-tracking.com",
  "usps-delivery-failed.net","amazon-prime-renewal.net",
  "netflix-account-suspended.com","apple-id-locked-verify.com",
  "google-account-recovery.net","microsoft-security-alert.net",
  "paypal-account-limited.net","ebay-account-verify.com"
]);

function isBlocklisted(hostname) {
  var clean = hostname.replace(/^www\./, '').toLowerCase();
  if (blockedDomains.has(clean)) return true;
  for (var d of blockedDomains) {
    if (clean.endsWith('.' + d) || clean === d) return true;
  }
  return false;
}
const logger = {
  info:  (...args) => console.log('[PhishGuard]', ...args),
  warn:  (...args) => console.warn('[PhishGuard]', ...args),
  error: (...args) => console.error('[PhishGuard]', ...args),
};
// ============ SAFE BROWSING CACHE ============
var sbCache = new Map();

function checkSafeBrowsingAPI(url, tabId, currentResult) {
  if (sbCache.has(url)) {
    var cached = sbCache.get(url);
    if (cached.flagged) {
      currentResult.score = 100;
      currentResult.risk = 'high';
      currentResult.ruleHits.unshift({
        triggered: true,
        weight: 100,
        reason: cached.reason
      });
      chrome.tabs.sendMessage(tabId, { type: 'PHISHGUARD_WARN', result: currentResult }).catch(function() {});
      updateBadge(tabId, 'high');
    }
    return;
  }

  var API_KEY = 'AIzaSyBO4rZKO-6QOUUqRijjJ7j3cTIy1wsFl70';
  var body = {
    client: { clientId: 'phishguard', clientVersion: '1.0.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url: url }]
    }
  };

  fetch('https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.matches && data.matches.length > 0) {
      var threatType = data.matches[0].threatType;
      var sbResult = {
        flagged: true,
        reason: 'Google Safe Browsing flagged: ' + threatType.replace(/_/g, ' ')
      };
      sbCache.set(url, sbResult);

      currentResult.score = 100;
      currentResult.risk = 'high';
      currentResult.ruleHits.unshift({ triggered: true, weight: 100, reason: sbResult.reason });
      tabState.set(tabId, currentResult);
      updateBadge(tabId, 'high');
      chrome.tabs.sendMessage(tabId, { type: 'PHISHGUARD_WARN', result: currentResult }).catch(function() {});
      logger.warn('Google Safe Browsing flagged: ' + url);
    } else {
      sbCache.set(url, { flagged: false });
    }
  })
  .catch(function(err) {
    logger.error('Safe Browsing API error:', err);
  });
}

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
// ============ REDIRECT CHAIN TRACKER ============
var redirectChains = new Map();

chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  if (details.frameId !== 0) return;
  if (!redirectChains.has(details.tabId)) {
    redirectChains.set(details.tabId, []);
  }
});

chrome.webNavigation.onCommitted.addListener(function(details) {
  if (details.frameId !== 0) return;
  var SKIP = ['chrome://', 'chrome-extension://', 'about:', 'data:'];
  if (SKIP.some(function(s) { return details.url.startsWith(s); })) return;

  var chain = redirectChains.get(details.tabId) || [];
  var isRedirect = details.transitionQualifiers &&
    details.transitionQualifiers.indexOf('server_redirect') !== -1;

  if (isRedirect || chain.length === 0) {
    try {
      var u = new URL(details.url);
      chain.push({
        url: details.url,
        domain: u.hostname,
        protocol: u.protocol,
        isRedirect: isRedirect,
        timestamp: Date.now()
      });
      redirectChains.set(details.tabId, chain);
    } catch(e) {}
  }
}, { url: [{ schemes: ['http', 'https'] }] });

chrome.tabs.onRemoved.addListener(function(tabId) {
  redirectChains.delete(tabId);
});
// ============ THREAT HISTORY ============
function saveThreatToHistory(result) {
  if (result.risk === 'low') return;
  chrome.storage.local.get({ threatHistory: [] }, function(data) {
    var history = data.threatHistory;
    history.unshift({
      url: result.parsed.raw,
      domain: result.parsed.domain,
      score: result.score,
      risk: result.risk,
      reasons: result.ruleHits.map(function(h) { return h.reason; }),
      timestamp: Date.now()
    });
    if (history.length > 100) history = history.slice(0, 100);
    chrome.storage.local.set({ threatHistory: history });
  });
}

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
  var result = analyzeURL(url);
  if (!result) return;

   if (isBlocklisted(result.parsed.hostname)) {
    result.score = 100;
    result.risk = 'high';
    result.ruleHits = [{
      triggered: true,
      weight: 100,
      reason: 'Domain found in PhishTank blocklist - confirmed phishing site'
    }];
  }
  tabState.set(tabId, result);
  updateBadge(tabId, result.risk);
  saveThreatToHistory(result);
  logger.info('[' + result.risk.toUpperCase() + '] ' + result.parsed.hostname + ' - score: ' + result.score);
  if (result.risk === 'high' || result.risk === 'medium') {
    chrome.tabs.sendMessage(tabId, { type: 'PHISHGUARD_WARN', result: result }).catch(function() {});
  } 
   checkSafeBrowsingAPI(url, tabId, result);
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  tabState.delete(tabId);
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === 'GET_TAB_STATE') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tab = tabs[0];
      var state = tab ? (tabState.get(tab.id) || null) : null;
      if (state) {
        state.redirectChain = redirectChains.get(tab.id) || [];
      }
      sendResponse(state);
    });
    return true;
  }
});

logger.info('PhishGuard service worker started');