// ============ BLOCKLIST ============
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

// ============ LOGGER ============
var logger = {
  info:  function() { console.log('[PhishGuard]', ...arguments); },
  warn:  function() { console.warn('[PhishGuard]', ...arguments); },
  error: function() { console.error('[PhishGuard]', ...arguments); }
};

// ============ URL PARSER ============
function parseURL(rawURL) {
  try {
    var url = new URL(rawURL);
    var hostParts = url.hostname.replace(/^www\./, '').split('.');
    return {
      raw: rawURL,
      protocol: url.protocol,
      hostname: url.hostname,
      domain: hostParts.slice(-2).join('.'),
      subdomains: hostParts.slice(0, -2),
      tld: hostParts[hostParts.length - 1],
      path: url.pathname,
      isIP: /^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname),
      length: rawURL.length
    };
  } catch(e) {
    return null;
  }
}

// ============ LEVENSHTEIN ============
function levenshtein(a, b) {
  var m = a.length, n = b.length;
  var dp = Array.from({ length: m + 1 }, function(_, i) {
    return Array.from({ length: n + 1 }, function(_, j) {
      return i === 0 ? j : j === 0 ? i : 0;
    });
  });
  for (var i = 1; i <= m; i++)
    for (var j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// ============ RULES ============
function httpCheck(parsed) {
  if (parsed.protocol === 'http:') {
    return { triggered: true, weight: 20, reason: 'Insecure HTTP - no encryption' };
  }
  return { triggered: false };
}

function urlStructureCheck(parsed) {
  var hits = [];
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
  var totalWeight = hits.reduce(function(s, h) { return s + h.weight; }, 0);
  var reason = hits.map(function(h) { return h.reason; }).join(' | ');
  return { triggered: true, weight: totalWeight, reason: reason };
}

function suspiciousKeywordsCheck(parsed) {
  var KEYWORDS = ['paypal','amazon','netflix','google','microsoft','apple',
    'facebook','instagram','twitter','bank','secure','verify',
    'update','login','signin','account','confirm','wallet'];
  var domain = parsed.domain.toLowerCase();
  var hit = KEYWORDS.find(function(k) { return domain.includes(k); });
  if (hit && !domain.endsWith(hit + '.com') && !domain.endsWith(hit + '.org')) {
    return { triggered: true, weight: 30, reason: 'Brand keyword "' + hit + '" in untrusted domain' };
  }
  return { triggered: false };
}

function lookalikeDomainCheck(parsed) {
  var TOP = ['paypal.com','amazon.com','google.com','microsoft.com',
    'apple.com','facebook.com','netflix.com','instagram.com',
    'twitter.com','linkedin.com','github.com','chase.com'];
  var candidate = parsed.domain.toLowerCase();
  for (var t = 0; t < TOP.length; t++) {
    var trusted = TOP[t];
    if (candidate === trusted) return { triggered: false };
    var dist = levenshtein(candidate, trusted);
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

function homoglyphCheck(parsed) {
  var HOMOGLYPH_REVERSE = {
    '0':'o','1':'l','3':'e','4':'a','5':'s','6':'b','7':'t','8':'B'
  };
  var domain = parsed.domain.toLowerCase();
  var suspiciousChars = [];
  for (var i = 0; i < domain.length; i++) {
    var ch = domain[i];
    if (HOMOGLYPH_REVERSE[ch]) {
      suspiciousChars.push('"' + ch + '" (looks like "' + HOMOGLYPH_REVERSE[ch] + '")');
    }
  }
  if (domain.indexOf('rn') !== -1) suspiciousChars.push('"rn" (looks like "m")');
  if (domain.indexOf('vv') !== -1) suspiciousChars.push('"vv" (looks like "w")');
  if (domain.indexOf('cl') !== -1) suspiciousChars.push('"cl" (looks like "d")');
  if (suspiciousChars.length > 0) {
    return { triggered: true, weight: 35, reason: 'Homoglyph characters: ' + suspiciousChars.join(', ') };
  }
  return { triggered: false };
}

// ============ ANALYZER ============
function analyzeURL(rawURL) {
  var parsed = parseURL(rawURL);
  if (!parsed) return null;
  var rules = [httpCheck, urlStructureCheck, suspiciousKeywordsCheck, lookalikeDomainCheck, homoglyphCheck];
  var hits = rules.map(function(fn) { return fn(parsed); }).filter(function(r) { return r.triggered; });
  var score = Math.min(100, hits.reduce(function(s, h) { return s + h.weight; }, 0));
  var risk = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  return { parsed: parsed, score: score, risk: risk, ruleHits: hits };
}

// ============ STATE ============
var tabState = new Map();
var redirectChains = new Map();

// ============ BADGE ============
function updateBadge(tabId, risk) {
  var colors = { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' };
  var labels = { high: '!', medium: '~', low: '' };
  chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: colors[risk] || '#888' });
  chrome.action.setBadgeText({ tabId: tabId, text: labels[risk] || '' });
}

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
    if (history.length > 200) history = history.slice(0, 200);
    chrome.storage.local.set({ threatHistory: history }, function() {
      logger.info('Saved threat: ' + result.parsed.domain);
    });
  });
}

// ============ SAFE BROWSING ============
var sbCache = new Map();

function checkSafeBrowsingAPI(url, tabId, currentResult) {
  if (sbCache.has(url)) {
    var cached = sbCache.get(url);
    if (cached.flagged) {
      currentResult.score = 100;
      currentResult.risk = 'high';
      currentResult.ruleHits.unshift({ triggered: true, weight: 100, reason: cached.reason });
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
      var sbResult = { flagged: true, reason: 'Google Safe Browsing: ' + threatType.replace(/_/g, ' ') };
      sbCache.set(url, sbResult);
      currentResult.score = 100;
      currentResult.risk = 'high';
      currentResult.ruleHits.unshift({ triggered: true, weight: 100, reason: sbResult.reason });
      tabState.set(tabId, currentResult);
      updateBadge(tabId, 'high');
      chrome.tabs.sendMessage(tabId, { type: 'PHISHGUARD_WARN', result: currentResult }).catch(function() {});
      logger.warn('Safe Browsing flagged: ' + url);
    } else {
      sbCache.set(url, { flagged: false });
    }
  })
  .catch(function(err) { logger.error('Safe Browsing error:', err); });
}

// ============ NAVIGATION LISTENERS ============
var SKIP = ['chrome://', 'chrome-extension://', 'about:', 'data:'];

chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  if (details.frameId !== 0) return;
  if (SKIP.some(function(s) { return details.url.startsWith(s); })) return;
  redirectChains.set(details.tabId, []);
  var result = analyzeURL(details.url);
  if (!result) return;
  if (!tabState.get(details.tabId)) {
    if (isBlocklisted(result.parsed.hostname)) {
      result.score = 100;
      result.risk = 'high';
      result.ruleHits = [{ triggered: true, weight: 100, reason: 'Domain found in PhishTank blocklist - confirmed phishing site' }];
    }
    tabState.set(details.tabId, result);
    updateBadge(details.tabId, result.risk);
    saveThreatToHistory(result);
  }
});

chrome.webNavigation.onCommitted.addListener(function(details) {
  if (details.frameId !== 0) return;
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

  var result = analyzeURL(details.url);
  if (!result) return;

  if (isBlocklisted(result.parsed.hostname)) {
    result.score = 100;
    result.risk = 'high';
    result.ruleHits = [{ triggered: true, weight: 100, reason: 'Domain found in PhishTank blocklist - confirmed phishing site' }];
  }

  tabState.set(details.tabId, result);
  updateBadge(details.tabId, result.risk);
  saveThreatToHistory(result);
  logger.info('[' + result.risk.toUpperCase() + '] ' + result.parsed.hostname + ' - score: ' + result.score);

  if (result.risk === 'high' || result.risk === 'medium') {
    chrome.tabs.sendMessage(details.tabId, { type: 'PHISHGUARD_WARN', result: result }).catch(function() {});
  }

  checkSafeBrowsingAPI(details.url, details.tabId, result);
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  tabState.delete(tabId);
  redirectChains.delete(tabId);
});

// ============ MESSAGE BUS ============
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