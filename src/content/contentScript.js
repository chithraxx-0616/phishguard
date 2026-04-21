var HOMOGLYPHS = {
  '0': 'o', '1': 'l', '3': 'e', '4': 'a',
  '5': 's', '6': 'g', '7': 't', '8': 'b'
};

var TOP_BRANDS = [
  'paypal','amazon','google','microsoft','apple','facebook',
  'netflix','instagram','twitter','linkedin','github','chase',
  'wellsfargo','bankofamerica','dropbox','coinbase','binance'
];

function normalizeForComparison(str) {
  var result = str.toLowerCase();
  Object.keys(HOMOGLYPHS).forEach(function(fake) {
    result = result.split(fake).join(HOMOGLYPHS[fake]);
  });
  return result;
}

function findImpersonatedBrand(hostname) {
  var clean = hostname.replace(/^www\./, '').split('.')[0].toLowerCase();
  var normalized = normalizeForComparison(clean);
  for (var i = 0; i < TOP_BRANDS.length; i++) {
    var brand = TOP_BRANDS[i];
    if (normalized === brand && clean !== brand) {
      return { original: clean, brand: brand };
    }
    if (normalized.includes(brand) && !clean.includes(brand)) {
      return { original: clean, brand: brand };
    }
  }
  return null;
}

function highlightHomoglyphs(hostname) {
  if (document.getElementById('phishguard-homoglyph-banner')) return;
  var impersonation = findImpersonatedBrand(hostname);
  if (!impersonation) return;

  var clean = impersonation.original;
  var brand = impersonation.brand;
  var highlightedChars = '';

  for (var i = 0; i < clean.length; i++) {
    var ch = clean[i];
    if (HOMOGLYPHS[ch]) {
      highlightedChars += '<span style="background:#ef4444;color:white;padding:1px 5px;border-radius:3px;font-weight:900;font-family:monospace;">' + ch + '</span>';
    } else {
      highlightedChars += '<span style="font-family:monospace;">' + ch + '</span>';
    }
  }

  var bar = document.createElement('div');
  bar.id = 'phishguard-homoglyph-banner';
  bar.style.cssText = 'all:initial;position:fixed;top:52px;left:0;right:0;z-index:2147483646;' +
    'background:#1a0505;color:white;font:13px -apple-system,sans-serif;' +
    'padding:8px 16px;display:flex;align-items:center;gap:10px;' +
    'border-bottom:2px solid #7f1d1d;';

  bar.innerHTML =
    '<span style="background:#7f1d1d;color:#fca5a5;padding:2px 8px;border-radius:4px;' +
    'font-size:11px;font-weight:700;flex-shrink:0;letter-spacing:0.5px;">HOMOGLYPH DETECTED</span>' +
    '<span style="flex:1;font-size:13px;">Domain <strong style="font-size:15px;letter-spacing:2px;">' +
    highlightedChars + '</strong> is impersonating <strong style="color:#4ade80;">' +
    brand + '</strong> — red characters are fakes</span>' +
    '<span id="pg-hg-close" style="cursor:pointer;font-size:18px;padding:0 6px;opacity:0.7;">X</span>';

  document.documentElement.appendChild(bar);

  document.getElementById('pg-hg-close').addEventListener('click', function() {
    bar.remove();
  });
}

function showBanner(result) {
  if (document.getElementById('phishguard-banner')) return;

  var bar = document.createElement('div');
  bar.id = 'phishguard-banner';
  bar.style.cssText = 'all:initial;position:fixed;top:0;left:0;right:0;z-index:2147483647;' +
    'background:' + (result.risk === 'high' ? '#c0392b' : '#e67e22') + ';' +
    'color:white;font:500 14px/1.4 -apple-system,sans-serif;' +
    'padding:10px 16px;display:flex;align-items:center;gap:12px;' +
    'box-shadow:0 2px 8px rgba(0,0,0,0.3);';

  var icon = document.createElement('span');
  icon.style.cssText = 'font-weight:700;letter-spacing:1px;background:rgba(0,0,0,0.2);padding:2px 8px;border-radius:4px;font-size:12px;';
  icon.textContent = result.risk === 'high' ? 'DANGER' : 'WARNING';

  var text = document.createElement('span');
  text.style.flex = '1';
  var topReason = result.ruleHits && result.ruleHits[0] ? result.ruleHits[0].reason : 'Potential phishing detected';
  text.textContent = 'PhishGuard Alert: ' + topReason;

  var score = document.createElement('span');
  score.textContent = 'Risk: ' + result.score + '/100';
  score.style.cssText = 'font-size:12px;opacity:0.85;';

  var close = document.createElement('button');
  close.textContent = 'X';
  close.style.cssText = 'all:initial;color:white;font:bold 16px sans-serif;cursor:pointer;padding:0 6px;';
  close.onclick = function() { bar.remove(); };

  bar.appendChild(icon);
  bar.appendChild(text);
  bar.appendChild(score);
  bar.appendChild(close);
  document.documentElement.prepend(bar);
}

chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.type === 'PHISHGUARD_WARN') {
    if (msg.result.risk === 'high') {
      showInterstitial(msg.result);
    } else {
      showBanner(msg.result);
    }
    if (msg.result && msg.result.parsed && msg.result.parsed.hostname) {
      highlightHomoglyphs(msg.result.parsed.hostname);
    }
  }
});