function setGaugeColor(score) {
  var color = score >= 60 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#22c55e';
  var arc = document.getElementById('gauge-arc');
  var offset = 157 - (score / 100) * 157;
  arc.style.stroke = color;
  arc.style.strokeDashoffset = offset;
  arc.style.transition = 'stroke-dashoffset 0.8s ease, stroke 0.5s ease';
}

function renderBreakdown(ruleHits) {
  var list = document.getElementById('breakdown-list');
  list.innerHTML = '';
  if (!ruleHits || ruleHits.length === 0) {
    list.innerHTML = '<div class="no-threats">No threats detected on this page</div>';
    return;
  }
  ruleHits.forEach(function(hit) {
    var item = document.createElement('div');
    item.className = 'rule-item';
    var weight = document.createElement('span');
    weight.className = 'rule-weight';
    weight.textContent = '+' + hit.weight;
    var reason = document.createElement('span');
    reason.className = 'rule-reason';
    reason.textContent = hit.reason;
    item.appendChild(weight);
    item.appendChild(reason);
    list.appendChild(item);
  });
}

function renderRedirectChain(chain) {
  if (!chain || chain.length <= 1) return;

  var section = document.getElementById('redirect-section');
  var container = document.getElementById('redirect-chain');
  section.style.display = 'block';
  container.innerHTML = '';

  chain.forEach(function(step, i) {
    var isHttp = step.protocol === 'http:';
    var dotClass = isHttp ? 'danger' : 'safe';

    var div = document.createElement('div');
    div.className = 'redirect-step';

    var col = document.createElement('div');
    col.style.display = 'flex';
    col.style.flexDirection = 'column';
    col.style.alignItems = 'center';

    var dot = document.createElement('div');
    dot.className = 'redirect-dot ' + dotClass;

    col.appendChild(dot);

    if (i < chain.length - 1) {
      var line = document.createElement('div');
      line.className = 'redirect-line';
      col.appendChild(line);
    }

    var info = document.createElement('div');
    info.style.flex = '1';

    var domain = document.createElement('span');
    domain.className = 'redirect-domain';
    domain.textContent = (i === 0 ? 'Origin: ' : i === chain.length - 1 ? 'Final: ' : 'Hop ' + i + ': ') + step.domain;

    info.appendChild(domain);

    if (isHttp) {
      var badge = document.createElement('span');
      badge.className = 'redirect-badge';
      badge.textContent = 'HTTP';
      info.appendChild(badge);
    }

    if (step.isRedirect) {
      var rbadge = document.createElement('span');
      rbadge.className = 'redirect-badge';
      rbadge.style.background = '#1e1e3a';
      rbadge.style.color = '#a78bfa';
      rbadge.textContent = 'redirected';
      info.appendChild(rbadge);
    }

    div.appendChild(col);
    div.appendChild(info);
    container.appendChild(div);
  });
}

function renderPopup(result) {
  if (!result) {
    document.getElementById('risk-badge').textContent = 'SAFE';
    document.getElementById('risk-badge').className = 'badge badge-low';
    document.getElementById('score-number').textContent = '0';
    document.getElementById('meta-domain').textContent = 'Clean';
    document.getElementById('meta-protocol').textContent = '--';
    document.getElementById('meta-threats').textContent = '0';
    setGaugeColor(0);
    return;
  }

  var badge = document.getElementById('risk-badge');
  badge.textContent = result.risk.toUpperCase();
  badge.className = 'badge badge-' + result.risk;

  document.getElementById('score-number').textContent = result.score;
  document.getElementById('meta-domain').textContent = result.parsed.domain || '--';
  document.getElementById('meta-protocol').textContent = result.parsed.protocol || '--';
  document.getElementById('meta-threats').textContent = result.ruleHits ? result.ruleHits.length : '0';

  setGaugeColor(result.score);
  renderBreakdown(result.ruleHits);
  // Show homoglyph warning in popup
if (result.parsed && result.parsed.domain) {
  var map = {'0':'o','1':'l','3':'e','4':'a','5':'s','6':'b','7':'t','8':'B'};
  var domain = result.parsed.domain;
  var found = [];
  for (var i = 0; i < domain.length; i++) {
    if (map[domain[i]]) {
      found.push('"' + domain[i] + '" looks like "' + map[domain[i]] + '"');
    }
  }
  if (found.length > 0) {
    if (document.getElementById('homoglyph-warn')) document.getElementById('homoglyph-warn').remove();
    var homoglyphDiv = document.createElement('div');
    homoglyphDiv.id = 'homoglyph-warn';
    homoglyphDiv.style.cssText = 'padding:8px 16px;background:#1a0a0a;border-top:1px solid #2a1a1a;font-size:11px;color:#fca5a5';
    homoglyphDiv.innerHTML = 'Suspicious characters: ' + found.join(', ');
    document.getElementById('app').insertBefore(homoglyphDiv, document.querySelector('footer'));
  }
}
  renderRedirectChain(result.redirectChain); // <-- added here
}

chrome.runtime.sendMessage({ type: 'GET_TAB_STATE' }, function(result) {
  renderPopup(result);
});

document.getElementById('btn-safe').addEventListener('click', function() {
  alert('Site marked as safe. We will remember this.');
});

document.getElementById('btn-report').addEventListener('click', function() {
  alert('Thank you! This site has been reported as phishing.');
});

document.getElementById('dashboard-link').addEventListener('click', function(e) {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/dashboard.html') });
});
