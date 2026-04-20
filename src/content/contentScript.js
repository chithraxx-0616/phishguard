function showBanner(result) {
  if (document.getElementById('phishguard-banner')) return;

  const bar = document.createElement('div');
  bar.id = 'phishguard-banner';
  bar.style.cssText = [
    'all:initial',
    'position:fixed',
    'top:0',
    'left:0',
    'right:0',
    'z-index:2147483647',
    'background:' + (result.risk === 'high' ? '#c0392b' : '#e67e22'),
    'color:white',
    'font:500 14px/1.4 -apple-system,sans-serif',
    'padding:12px 16px',
    'display:flex',
    'align-items:center',
    'gap:12px',
    'box-shadow:0 2px 8px rgba(0,0,0,0.3)'
  ].join(';');

  const icon = document.createElement('span');
  icon.style.fontSize = '18px';
  icon.textContent = result.risk === 'high' ? 'DANGER' : 'WARNING';
  icon.style.cssText = 'font-weight:700;letter-spacing:1px;background:rgba(0,0,0,0.2);padding:2px 8px;border-radius:4px';

  const text = document.createElement('span');
  text.style.flex = '1';
  const topReason = result.ruleHits && result.ruleHits[0] ? result.ruleHits[0].reason : 'Potential phishing detected';
  text.textContent = 'PhishGuard Alert: ' + topReason;

  const score = document.createElement('span');
  score.textContent = 'Risk Score: ' + result.score + '/100';
  score.style.cssText = 'font-size:12px;opacity:0.85';

  const close = document.createElement('button');
  close.textContent = 'X';
  close.style.cssText = 'all:initial;color:white;font:bold 16px sans-serif;cursor:pointer;padding:0 6px;opacity:0.8';
  close.onclick = function() { bar.remove(); };

  bar.appendChild(icon);
  bar.appendChild(text);
  bar.appendChild(score);
  bar.appendChild(close);
  document.documentElement.prepend(bar);
}

chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.type === 'PHISHGUARD_WARN') {
    showBanner(msg.result);
  }
});