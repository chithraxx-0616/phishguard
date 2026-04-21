var HOMOGLYPHS = {
  '0':'o','1':'l','3':'e','4':'a',
  '5':'s','6':'g','7':'t','8':'b'
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
    if (normalized === brand && clean !== brand) return { original: clean, brand: brand };
    if (normalized.includes(brand) && !clean.includes(brand)) return { original: clean, brand: brand };
  }
  return null;
}

function highlightHomoglyphs(hostname) {
  if (document.getElementById('phishguard-homoglyph-banner')) return;
  var imp = findImpersonatedBrand(hostname);
  if (!imp) return;

  var clean = imp.original;
  var brand = imp.brand;
  var highlighted = '';
  for (var i = 0; i < clean.length; i++) {
    var ch = clean[i];
    if (HOMOGLYPHS[ch]) {
      highlighted += '<span style="background:#ef4444;color:white;padding:1px 5px;border-radius:3px;font-weight:900;font-family:monospace;">' + ch + '</span>';
    } else {
      highlighted += '<span style="font-family:monospace;">' + ch + '</span>';
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
    'font-size:11px;font-weight:700;flex-shrink:0;">HOMOGLYPH DETECTED</span>' +
    '<span style="flex:1;font-size:13px;">Domain <strong style="font-size:15px;letter-spacing:2px;">' +
    highlighted + '</strong> is impersonating <strong style="color:#4ade80;">' +
    brand + '</strong> — red characters are fakes</span>' +
    '<span id="pg-hg-close" style="cursor:pointer;font-size:18px;padding:0 6px;opacity:0.7;">X</span>';

  document.documentElement.appendChild(bar);
  document.getElementById('pg-hg-close').addEventListener('click', function() { bar.remove(); });
}

function startParticleAnimation() {
  var existing = document.getElementById('pg-canvas');
  if (existing) existing.remove();

  var canvas = document.createElement('canvas');
  canvas.id = 'pg-canvas';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText =
    'all:initial;position:fixed;top:0;left:0;' +
    'width:' + window.innerWidth + 'px;' +
    'height:' + window.innerHeight + 'px;' +
    'z-index:2147483645;pointer-events:none;';

  document.documentElement.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var W = canvas.width;
  var H = canvas.height;

  var particles = [];
  for (var p = 0; p < 70; p++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.7,
      dy: (Math.random() - 0.5) * 0.7,
      op: Math.random() * 0.5 + 0.2
    });
  }

  var running = true;

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(239,68,68,0.07)';
    for (var gx = 0; gx < W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 0; gy < H; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    for (var i = 0; i < particles.length; i++) {
      var pt = particles[i];
      pt.x += pt.dx; pt.y += pt.dy;
      if (pt.x < 0 || pt.x > W) pt.dx *= -1;
      if (pt.y < 0 || pt.y > H) pt.dy *= -1;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239,68,68,' + pt.op + ')';
      ctx.fill();
    }

    for (var a = 0; a < particles.length; a++) {
      for (var b = a + 1; b < particles.length; b++) {
        var pa = particles[a], pb = particles[b];
        var dist = Math.sqrt((pa.x-pb.x)*(pa.x-pb.x) + (pa.y-pb.y)*(pa.y-pb.y));
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.strokeStyle = 'rgba(239,68,68,' + (0.18 * (1 - dist/100)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();

  return function stop() {
    running = false;
    canvas.remove();
  };
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

function showInterstitial(result) {
  if (document.getElementById('phishguard-interstitial')) return;

  var stopAnimation = startParticleAnimation();

  var overlay = document.createElement('div');
  overlay.id = 'phishguard-interstitial';
  overlay.style.cssText =
    'all:initial;position:fixed;top:0;left:0;right:0;bottom:0;' +
    'z-index:2147483647;' +
    'background:rgba(8,8,18,0.96);' +
    'color:#e8e8f0;' +
    'font-family:-apple-system,BlinkMacSystemFont,sans-serif;' +
    'display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;' +
    'padding:40px 20px;text-align:center;overflow:hidden;';

  var domain = result.parsed ? result.parsed.domain : window.location.hostname;

  var reasonsHTML = (result.ruleHits || []).map(function(hit) {
    return '<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;text-align:left;">' +
      '<span style="background:#3a0f0f;color:#f87171;font-size:11px;font-weight:700;padding:2px 7px;' +
      'border-radius:4px;white-space:nowrap;font-family:sans-serif;flex-shrink:0;">+' + hit.weight + '</span>' +
      '<span style="font-size:13px;color:#c8c8e0;line-height:1.4;font-family:sans-serif;">' + hit.reason + '</span>' +
      '</div>';
  }).join('');

  overlay.innerHTML =
    '<div style="width:80px;height:80px;background:#3a0f0f;border-radius:50%;' +
    'display:flex;align-items:center;justify-content:center;margin-bottom:24px;' +
    'border:2px solid #ef4444;box-shadow:0 0 40px rgba(239,68,68,0.4);">' +
      '<span style="font-size:36px;line-height:1;">&#9888;</span>' +
    '</div>' +
    '<div style="font-size:11px;font-weight:700;letter-spacing:3px;color:#ef4444;' +
    'font-family:sans-serif;margin-bottom:10px;">PHISHGUARD ALERT</div>' +
    '<div style="font-size:26px;font-weight:800;color:#fff;font-family:sans-serif;' +
    'margin-bottom:12px;line-height:1.2;">Phishing Site Blocked</div>' +
    '<div style="font-size:14px;color:#9898b0;max-width:460px;line-height:1.7;' +
    'font-family:sans-serif;margin-bottom:4px;">' +
      'The site <strong style="color:#ef4444;font-family:monospace;">' + domain + '</strong> ' +
      'has been identified as a phishing website that may steal your credentials or financial data.' +
    '</div>' +
    '<div style="background:#0d0d1f;border:1px solid #2a2a4a;border-radius:12px;' +
    'padding:16px 20px;margin:20px 0;max-width:460px;width:100%;">' +
      '<div style="font-size:10px;color:#6b6b8a;text-transform:uppercase;letter-spacing:1px;' +
      'margin-bottom:12px;font-family:sans-serif;text-align:left;">Why was this blocked?</div>' +
      reasonsHTML +
    '</div>' +
    '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">' +
      '<button id="pg-go-back" style="all:initial;background:#166534;color:#fff;' +
      'font:700 14px sans-serif;padding:12px 32px;border-radius:8px;cursor:pointer;' +
      'box-shadow:0 4px 15px rgba(22,101,52,0.4);">Go Back to Safety</button>' +
      '<button id="pg-ignore" style="all:initial;background:transparent;color:#6b6b8a;' +
      'font:600 13px sans-serif;padding:12px 24px;border-radius:8px;cursor:pointer;' +
      'border:1px solid #2a2a4a;">I understand the risk</button>' +
    '</div>' +
    '<div style="margin-top:20px;font-size:11px;color:#3a3a5a;font-family:sans-serif;">' +
      'Risk Score: <span style="color:#ef4444;font-weight:700;">' + result.score + '/100</span>' +
      ' &nbsp;&bull;&nbsp; Protected by <span style="color:#7c3aed;font-weight:700;">PhishGuard</span>' +
    '</div>';

  document.documentElement.appendChild(overlay);

  document.getElementById('pg-go-back').addEventListener('click', function() {
    stopAnimation();
    overlay.remove();
    history.back();
    setTimeout(function() { window.location.href = 'https://google.com'; }, 500);
  });

  document.getElementById('pg-ignore').addEventListener('click', function() {
    if (confirm('This site is dangerous. Are you sure you want to continue?')) {
      stopAnimation();
      overlay.remove();
    }
  });
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