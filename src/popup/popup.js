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