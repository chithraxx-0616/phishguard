function showInterstitial(result) {
  if (document.getElementById('phishguard-interstitial')) return;

  var overlay = document.createElement('div');
  overlay.id = 'phishguard-interstitial';
  overlay.style.cssText =
    'all:initial;position:fixed;top:0;left:0;width:100%;height:100%;' +
    'z-index:2147483647;background:#0a0a0a;display:flex;align-items:center;' +
    'justify-content:center;font-family:-apple-system,sans-serif;';

  var topReason = result.ruleHits && result.ruleHits[0] ? result.ruleHits[0].reason : 'Potential phishing detected';
  var allReasons = (result.ruleHits || []).map(function(h) {
    return '<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #1a1a1a;font-size:13px;">' +
      '<span style="background:#2a0a0a;color:#f87171;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:700;flex-shrink:0;">+' + h.weight + '</span>' +
      '<span style="color:#c8c8e0;">' + h.reason + '</span>' +
      '</div>';
  }).join('');

  overlay.innerHTML =
    '<div style="all:initial;max-width:520px;width:90%;font-family:-apple-system,sans-serif;">' +

      '<div style="text-align:center;margin-bottom:32px;">' +
        '<div style="width:72px;height:72px;background:#2a0a0a;border:2px solid #ef4444;border-radius:50%;' +
          'display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px;color:#ef4444;font-weight:900;">!</div>' +
        '<div style="font-size:26px;font-weight:800;color:#ffffff;margin-bottom:8px;">Phishing Site Detected</div>' +
        '<div style="font-size:14px;color:#9090b0;">PhishGuard has blocked this page to protect you</div>' +
      '</div>' +

      '<div style="background:#0d0d1f;border:1px solid #2a1a1a;border-radius:12px;padding:16px;margin-bottom:16px;">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">' +
          '<div style="flex:1;">' +
            '<div style="font-size:11px;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Suspicious URL</div>' +
            '<div style="font-size:13px;color:#f87171;word-break:break-all;">' + (result.parsed ? result.parsed.hostname : 'Unknown') + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-size:32px;font-weight:900;color:#ef4444;line-height:1;">' + result.score + '</div>' +
            '<div style="font-size:10px;color:#6b6b8a;">Risk Score</div>' +
          '</div>' +
        '</div>' +
        '<div>' + allReasons + '</div>' +
      '</div>' +

      '<div style="display:flex;gap:10px;margin-bottom:12px;">' +
        '<button id="pg-block-back" style="all:initial;flex:1;background:#7c3aed;color:white;' +
          'padding:12px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;text-align:center;' +
          'font-family:-apple-system,sans-serif;">Go Back to Safety</button>' +
        '<button id="pg-block-proceed" style="all:initial;flex:1;background:#1a1a1a;color:#9090b0;' +
          'border:1px solid #2a2a2a;padding:12px;border-radius:8px;font-size:13px;cursor:pointer;' +
          'text-align:center;font-family:-apple-system,sans-serif;">Proceed Anyway (Risk)</button>' +
      '</div>' +

      '<div style="text-align:center;font-size:11px;color:#4a4a6a;">' +
        'Protected by PhishGuard v1.0 — If you trust this site, click "Proceed Anyway"' +
      '</div>' +
    '</div>';

  document.documentElement.appendChild(overlay);

  document.getElementById('pg-block-back').addEventListener('click', function() {
    history.back();
    setTimeout(function() { window.location.href = 'https://google.com'; }, 500);
  });

  document.getElementById('pg-block-proceed').addEventListener('click', function() {
    if (confirm('This site has been flagged as dangerous. Are you sure you want to continue?')) {
      overlay.remove();
    }
  });
}