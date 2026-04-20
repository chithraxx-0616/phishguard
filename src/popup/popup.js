chrome.runtime.sendMessage({ type: 'GET_TAB_STATE' }, (result) => {
  if (!result) {
    document.getElementById('risk-badge').textContent = 'Safe';
    document.getElementById('risk-badge').className = 'badge low';
    document.getElementById('score-number').textContent = '0';
    return;
  }

  const badge = document.getElementById('risk-badge');
  badge.textContent = result.risk.toUpperCase();
  badge.className = `badge ${result.risk}`;
  document.getElementById('score-number').textContent = result.score;

  const breakdown = document.getElementById('breakdown');
  result.ruleHits.forEach(hit => {
    const item = document.createElement('div');
    item.className = 'rule-item';
    item.innerHTML = `<span class="rule-weight">+${hit.weight}</span><span>${hit.reason}</span>`;
    breakdown.appendChild(item);
  });
});