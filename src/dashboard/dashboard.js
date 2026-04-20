function timeAgo(ts) {
  var diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function getScoreColor(score) {
  if (score >= 60) return '#ef4444';
  if (score >= 30) return '#f59e0b';
  return '#22c55e';
}

function renderStats(history) {
  var high = history.filter(function(h) { return h.risk === 'high'; }).length;
  var medium = history.filter(function(h) { return h.risk === 'medium'; }).length;
  var today = history.filter(function(h) {
    return new Date(h.timestamp).toDateString() === new Date().toDateString();
  }).length;

  document.getElementById('stat-total').textContent = history.length;
  document.getElementById('stat-high').textContent = high;
  document.getElementById('stat-medium').textContent = medium;
  document.getElementById('stat-today').textContent = today;
  document.getElementById('last-updated').textContent = 'Updated ' + new Date().toLocaleTimeString();
}

function renderBarChart(history) {
  var chart = document.getElementById('bar-chart');
  chart.innerHTML = '';

  var days = [];
  for (var i = 13; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toDateString());
  }

  var maxCount = 1;
  var counts = days.map(function(day) {
    var count = history.filter(function(h) {
      return new Date(h.timestamp).toDateString() === day;
    }).length;
    if (count > maxCount) maxCount = count;
    return count;
  });

  days.forEach(function(day, i) {
    var count = counts[i];
    var heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
    var d = new Date(day);
    var label = (d.getMonth() + 1) + '/' + d.getDate();

    var riskLevel = 'low';
    var dayThreats = history.filter(function(h) {
      return new Date(h.timestamp).toDateString() === day;
    });
    if (dayThreats.some(function(h) { return h.risk === 'high'; })) riskLevel = 'high';
    else if (dayThreats.some(function(h) { return h.risk === 'medium'; })) riskLevel = 'medium';

    var wrap = document.createElement('div');
    wrap.className = 'bar-wrap';

    var bar = document.createElement('div');
    bar.className = 'bar ' + riskLevel;
    bar.style.height = Math.max(heightPct, count > 0 ? 8 : 2) + 'px';
    bar.title = count + ' threats on ' + label;

    var lbl = document.createElement('div');
    lbl.className = 'bar-label';
    lbl.textContent = label;

    wrap.appendChild(bar);
    wrap.appendChild(lbl);
    chart.appendChild(wrap);
  });
}

function renderTable(history) {
  var container = document.getElementById('table-container');
  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🛡️</div><div class="empty-text">No threats detected yet. Browse safely!</div></div>';
    return;
  }

  var rows = history.slice(0, 50).map(function(h) {
    var scoreColor = getScoreColor(h.score);
    var reason = h.reasons && h.reasons[0] ? h.reasons[0] : 'Unknown';
    return '<tr>' +
      '<td><span class="risk-pill ' + h.risk + '">' + h.risk.toUpperCase() + '</span></td>' +
      '<td class="domain-cell">' + (h.domain || h.url) + '</td>' +
      '<td><div class="score-bar-wrap">' +
        '<div class="score-bar-bg"><div class="score-bar-fill" style="width:' + h.score + '%;background:' + scoreColor + '"></div></div>' +
        '<span style="font-size:12px;color:' + scoreColor + ';font-weight:700">' + h.score + '</span>' +
      '</div></td>' +
      '<td class="reason-cell">' + reason + '</td>' +
      '<td class="time-cell">' + timeAgo(h.timestamp) + '</td>' +
      '</tr>';
  }).join('');

  container.innerHTML = '<table class="threat-table">' +
    '<thead><tr>' +
    '<th>Risk</th><th>Domain</th><th>Score</th><th>Reason</th><th>Time</th>' +
    '</tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '</table>';
}

function loadDashboard() {
  chrome.storage.local.get({ threatHistory: [] }, function(data) {
    var history = data.threatHistory;
    renderStats(history);
    renderBarChart(history);
    renderTable(history);
  });
}

document.getElementById('clear-btn').addEventListener('click', function() {
  if (confirm('Clear all threat history?')) {
    chrome.storage.local.set({ threatHistory: [] }, loadDashboard);
  }
});

loadDashboard();
setInterval(loadDashboard, 5000);