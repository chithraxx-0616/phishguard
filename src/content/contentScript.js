function highlightDomainInText(domain) {
  var map = {'0':'o','1':'l','3':'e','4':'a','5':'s','6':'b','7':'t','8':'B'};
  var result = '';
  for (var i = 0; i < domain.length; i++) {
    var c = domain[i];
    if (map[c]) {
      result += '<span style="background:#7f1d1d;color:#fca5a5;font-weight:900;border-radius:2px;padding:0 2px" title="Looks like ' + map[c] + '">' + c + '</span>';
    } else {
      result += c;
    }
  }
  return result;
}

function showBanner(result) {
  if (document.getElementById('phishguard-banner')) return;

  var bar = document.createElement('div');
  bar.id = 'phishguard-banner';
  bar.style.cssText = [
    'all:initial',
    'position:fixed',
    'top:0','left:0','right:0',
    'z-index:2147483647',
    'background:' + (result.risk === 'high' ? 'linear-gradient(135deg,#7f1d1d,#991b1b)' : 'linear-gradient(135deg,#78350f,#92400e)'),
    'color:white',
    'font:500 13px/1.4 -apple-system,BlinkMacSystemFont,sans-serif',
    'padding:10px 16px',
    'display:flex',
    'align-items:center',
    'gap:10px',
    'box-shadow:0 4px 20px rgba(0,0,0,0.5)',
    'border-bottom:2px solid ' + (result.risk === 'high' ? '#ef4444' : '#f59e0b')
  ].join(';');

  var left = document.createElement('div');
  left.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1';

  var icon = document.createElement('div');
  icon.style.cssText = 'width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0';
  icon.textContent = result.risk === 'high' ? '🛑' : '⚠️';

  var textWrap = document.createElement('div');

  var title = document.createElement('div');
  title.style.cssText = 'font-weight:700;font-size:12px;letter-spacing:0.5px;color:' + (result.risk === 'high' ? '#fca5a5' : '#fcd34d');
  title.textContent = result.risk === 'high' ? 'PHISHING SITE DETECTED' : 'SUSPICIOUS SITE';

  var detail = document.createElement('div');
  detail.style.cssText = 'font-size:11px;opacity:0.85;margin-top:1px';
  var topReason = result.ruleHits && result.ruleHits[0] ? result.ruleHits[0].reason : 'Potential phishing detected';

  var hostname = window.location.hostname;
  var map = {'0':'o','1':'l','3':'e','4':'a','5':'s','6':'b','7':'t','8':'B'};
  var hasHomoglyph = Array.from(hostname).some(function(c) { return map[c]; });

  if (hasHomoglyph) {
    detail.innerHTML = 'Suspicious domain: <span style="font-family:monospace">' + highlightDomainInText(hostname) + '</span>';
  } else {
    detail.textContent = topReason;
  }

  textWrap.appendChild(title);
  textWrap.appendChild(detail);
  left.appendChild(icon);
  left.appendChild(textWrap);

  var right = document.createElement('div');
  right.style.cssText = 'display:flex;align-items:center;gap:8px;flex-shrink:0';

  var scoreBadge = document.createElement('div');
  scoreBadge.style.cssText = 'background:rgba(0,0,0,0.3);padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700';
  scoreBadge.textContent = 'Risk: ' + result.score + '/100';

  var close = document.createElement('button');
  close.style.cssText = 'all:initial;color:rgba(255,255,255,0.7);font:bold 16px sans-serif;cursor:pointer;padding:0 4px;line-height:1';
  close.textContent = '✕';
  close.onclick = function() { bar.remove(); };

  right.appendChild(scoreBadge);
  right.appendChild(close);

  bar.appendChild(left);
  bar.appendChild(right);
  document.documentElement.prepend(bar);

  // Auto-pulse animation
  var pulse = 0;
  var interval = setInterval(function() {
    pulse++;
    bar.style.opacity = pulse % 2 === 0 ? '1' : '0.92';
    if (pulse >= 6) { clearInterval(interval); bar.style.opacity = '1'; }
  }, 300);
}

function showInterstitial(result) {
  if (document.getElementById('phishguard-interstitial')) return;

  var overlay = document.createElement('div');
  overlay.id = 'phishguard-interstitial';
  overlay.style.cssText = [
    'all:initial',
    'position:fixed','top:0','left:0','right:0','bottom:0',
    'z-index:2147483647',
    'background:#080812',
    'color:#e8e8f0',
    'font-family:-apple-system,BlinkMacSystemFont,sans-serif',
    'display:flex','flex-direction:column',
    'align-items:center','justify-content:center',
    'padding:40px 20px',
    'text-align:center'
  ].join(';');

  var domain = result.parsed ? result.parsed.domain : window.location.hostname;

  var reasonsHTML = (result.ruleHits || []).map(function(hit) {
    return '<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;text-align:left">' +
      '<span style="background:#3a0f0f;color:#f87171;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap;font-family:sans-serif;flex-shrink:0">+' + hit.weight + '</span>' +
      '<span style="font-size:13px;color:#c8c8e0;line-height:1.4;font-family:sans-serif">' + hit.reason + '</span>' +
      '</div>';
  }).join('');

  overlay.innerHTML =
    '<div style="width:80px;height:80px;background:linear-gradient(135deg,#3a0f0f,#7f1d1d);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:24px;border:2px solid #ef4444;box-shadow:0 0 30px rgba(239,68,68,0.3)">' +
      '<span style="font-size:36px">🛑</span>' +
    '</div>' +

    '<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#ef4444;font-family:sans-serif;margin-bottom:8px">PHISHGUARD ALERT</div>' +

    '<h1 style="all:initial;font-size:26px;font-weight:800;color:#fff;font-family:sans-serif;display:block;margin-bottom:12px;line-height:1.2">Phishing Site Blocked</h1>' +

    '<p style="all:initial;font-size:14px;color:#9898b0;max-width:460px;line-height:1.7;font-family:sans-serif;display:block;margin-bottom:4px">' +
      'This site <strong style="color:#ef4444;font-family:monospace">' + domain + '</strong> has been identified as a phishing or malicious website that may steal your passwords, financial data, or personal information.' +
    '</p>' +

    '<div style="background:#0d0d1f;border:1px solid #2a2a4a;border-radius:12px;padding:16px 20px;margin:20px 0;max-width:460px;width:100%">' +
      '<div style="font-size:10px;color:#6b6b8a;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-family:sans-serif;text-align:left">Detection reasons</div>' +
      reasonsHTML +
    '</div>' +

    '<div style="display:flex;gap:12px;margin-top:4px;flex-wrap:wrap;justify-content:center">' +
      '<button id="pg-go-back" style="all:initial;background:linear-gradient(135deg,#166534,#15803d);color:#fff;font:700 14px sans-serif;padding:12px 32px;border-radius:8px;cursor:pointer;box-shadow:0 4px 15px rgba(22,101,52,0.4)">Go Back to Safety</button>' +
      '<button id="pg-ignore" style="all:initial;background:transparent;color:#4a4a6a;font:600 13px sans-serif;padding:12px 24px;border-radius:8px;cursor:pointer;border:1px solid #2a2a4a">I understand the risk</button>' +
    '</div>' +

    '<div style="margin-top:20px;font-size:11px;color:#3a3a5a;font-family:sans-serif">' +
      'Risk Score: <span style="color:#ef4444;font-weight:700">' + result.score + '/100</span>' +
      ' &nbsp;•&nbsp; Protected by <span style="color:#7c3aed;font-weight:700">PhishGuard</span>' +
    '</div>';

  document.documentElement.appendChild(overlay);

  document.getElementById('pg-go-back').onclick = function() { history.back(); };
  document.getElementById('pg-ignore').onclick = function() { overlay.remove(); };
}

chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.type === 'PHISHGUARD_WARN') {
    if (msg.result.risk === 'high') {
      showInterstitial(msg.result);
    } else {
      showBanner(msg.result);
    }
  }
});