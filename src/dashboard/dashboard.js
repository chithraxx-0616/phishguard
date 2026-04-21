var allHistory = [];
var currentFilter = 'all';
var chartMode = 'stacked';

function isToday(ts) {
  return new Date(ts).toDateString() === new Date().toDateString();
}
function isYesterday(ts) {
  var y = new Date();
  y.setDate(y.getDate() - 1);
  return new Date(ts).toDateString() === y.toDateString();
}
function isThisWeek(ts) {
  var now = new Date();
  var weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);
  return new Date(ts) >= weekAgo;
}
function formatTime(ts) {
  var d = new Date(ts);
  var hh = d.getHours().toString().padStart(2, '0');
  var mm = d.getMinutes().toString().padStart(2, '0');
  if (isToday(ts))     return 'Today ' + hh + ':' + mm;
  if (isYesterday(ts)) return 'Yesterday ' + hh + ':' + mm;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + hh + ':' + mm;
}
function getDayKey(ts) {
  if (isToday(ts))     return 'Today';
  if (isYesterday(ts)) return 'Yesterday';
  return new Date(ts).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 2500);
}

function applyFilter(history) {
  var search = document.getElementById('search-box').value.toLowerCase();
  var filtered = history;
  if (currentFilter === 'today')     filtered = history.filter(function (h) { return isToday(h.timestamp); });
  if (currentFilter === 'yesterday') filtered = history.filter(function (h) { return isYesterday(h.timestamp); });
  if (currentFilter === 'week')      filtered = history.filter(function (h) { return isThisWeek(h.timestamp); });
  if (currentFilter === 'high')      filtered = history.filter(function (h) { return h.risk === 'high'; });
  if (currentFilter === 'medium')    filtered = history.filter(function (h) { return h.risk === 'medium'; });
  if (search) {
    filtered = filtered.filter(function (h) {
      return (h.domain || '').toLowerCase().includes(search) ||
             (h.url || '').toLowerCase().includes(search);
    });
  }
  return filtered;
}

function setFilter(f, el) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn, .stat-card').forEach(function (b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderList();
}

function setChartMode(m, el) {
  chartMode = m;
  document.querySelectorAll('.chart-tab').forEach(function (b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderChart();
}

function renderStats(h) {
  var today     = h.filter(function (x) { return isToday(x.timestamp); }).length;
  var yesterday = h.filter(function (x) { return isYesterday(x.timestamp); }).length;
  var high      = h.filter(function (x) { return x.risk === 'high'; }).length;
  var medium    = h.filter(function (x) { return x.risk === 'medium'; }).length;

  document.getElementById('stat-total').textContent     = h.length;
  document.getElementById('stat-high').textContent      = high;
  document.getElementById('stat-medium').textContent    = medium;
  document.getElementById('stat-today').textContent     = today;
  document.getElementById('stat-yesterday').textContent = yesterday;

  var now = new Date();
  document.getElementById('last-updated').textContent =
    'Updated ' + now.getHours().toString().padStart(2, '0') + ':' +
    now.getMinutes().toString().padStart(2, '00') + ':' +
    now.getSeconds().toString().padStart(2, '0');
}

function renderChart() {
  var wrap = document.getElementById('activity-chart');
  var days = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var key = d.toDateString();
    var label = i === 0 ? 'Today' : i === 1 ? 'Yest.' :
      d.toLocaleDateString('en-IN', { weekday: 'short' });
    var items = allHistory.filter(function (h) {
      return new Date(h.timestamp).toDateString() === key;
    });
    days.push({
      label:  label,
      high:   items.filter(function (h) { return h.risk === 'high'; }).length,
      medium: items.filter(function (h) { return h.risk === 'medium'; }).length,
      total:  items.length
    });
  }

  var maxVal = Math.max(1, Math.max.apply(null, days.map(function (d) {
    return chartMode === 'high' ? d.high : d.total;
  })));

  var html = '<div class="bar-wrap">';
  days.forEach(function (d) {
    var highH  = Math.round((d.high   / maxVal) * 100);
    var medH   = Math.round((d.medium / maxVal) * 100);
    var totalH = Math.round((d.total  / maxVal) * 100);

    html += '<div class="bar-col" style="position:relative">';

    if (chartMode === 'stacked') {
      html += '<div style="width:100%;display:flex;flex-direction:column;justify-content:flex-end;height:100%">';
      if (d.high > 0)   html += '<div class="bar-inner bar-high"   style="height:' + highH + '%" title="' + d.high + ' high risk"></div>';
      if (d.medium > 0) html += '<div class="bar-inner bar-medium" style="height:' + medH  + '%" title="' + d.medium + ' medium risk"></div>';
      if (d.total === 0) html += '<div class="bar-inner bar-empty" style="height:4px"></div>';
      html += '</div>';
    } else if (chartMode === 'high') {
      html += '<div style="width:100%;display:flex;flex-direction:column;justify-content:flex-end;height:100%">' +
        '<div class="bar-inner ' + (d.high > 0 ? 'bar-high' : 'bar-empty') + '" style="height:' + (d.high > 0 ? highH : 4) + '%" title="' + d.high + ' high risk"></div></div>';
    } else {
      html += '<div style="width:100%;display:flex;flex-direction:column;justify-content:flex-end;height:100%">' +
        '<div class="bar-inner ' + (d.total > 0 ? 'bar-high' : 'bar-empty') + '" style="height:' + (d.total > 0 ? totalH : 4) + '%" title="' + d.total + ' total"></div></div>';
    }

    html += '<span class="bar-label">' + d.label + '</span></div>';
  });
  html += '</div>';
  wrap.innerHTML = html;
}

function renderDonut(h) {
  var high   = h.filter(function (x) { return x.risk === 'high'; }).length;
  var medium = h.filter(function (x) { return x.risk === 'medium'; }).length;
  var total  = high + medium || 1;
  var svg    = document.getElementById('donut-svg');
  var r = 35, cx = 50, cy = 50, sw = 14;
  var circ  = 2 * Math.PI * r;
  var highD = circ * (high   / total);
  var medD  = circ * (medium / total);

  svg.innerHTML =
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#1a1a3a" stroke-width="' + sw + '"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#ef4444" stroke-width="' + sw + '"' +
      ' stroke-dasharray="' + highD + ' ' + circ + '" stroke-dashoffset="' + (-(circ * 0.25)) + '" stroke-linecap="round"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#f59e0b" stroke-width="' + sw + '"' +
      ' stroke-dasharray="' + medD + ' ' + circ + '" stroke-dashoffset="' + (-(circ * 0.25 + highD)) + '" stroke-linecap="round"/>' +
    '<text x="50" y="54" text-anchor="middle" fill="#e8e8f0" font-size="14" font-weight="800">' + (high + medium) + '</text>';

  document.getElementById('donut-legend').innerHTML =
    '<div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div>' +
      '<span class="legend-label">High</span><span class="legend-count c-red">' + high + '</span></div>' +
    '<div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div>' +
      '<span class="legend-label">Medium</span><span class="legend-count c-amber">' + medium + '</span></div>' +
    '<div class="legend-item"><div class="legend-dot" style="background:#7c3aed"></div>' +
      '<span class="legend-label">Total</span><span class="legend-count c-purple">' + (high + medium) + '</span></div>';
}

function renderTopDomains(h) {
  var counts = {};
  h.forEach(function (item) {
    var d = item.domain || 'unknown';
    counts[d] = (counts[d] || 0) + 1;
  });
  var sorted = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 5);
  var max = sorted.length ? counts[sorted[0]] : 1;
  var html = '';
  sorted.forEach(function (domain, i) {
    var pct = Math.round((counts[domain] / max) * 100);
    html +=
      '<div class="top-domain">' +
        '<span class="td-rank">' + (i + 1) + '</span>' +
        '<span class="td-domain" title="' + domain + '">' + domain + '</span>' +
        '<div class="td-bar-wrap"><div class="td-bar" style="width:' + pct + '%"></div></div>' +
        '<span class="td-count">' + counts[domain] + '</span>' +
      '</div>';
  });
  document.getElementById('top-domains').innerHTML = html ||
    '<div style="font-size:12px;color:#4a4a6a;padding:8px 0">No data yet — visit some phishing URLs</div>';
}

function renderList() {
  var list     = document.getElementById('threat-list');
  var filtered = applyFilter(allHistory);

  if (filtered.length === 0) {
    list.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">PG</div>' +
        '<div class="empty-text">No threats found' +
          (currentFilter !== 'all' ? ' for this filter' : '') +
          '.<br>Visit <strong>http://paypa1.com</strong> or <strong>http://paypal-secure-login.com</strong> to generate history.</div>' +
      '</div>';
    return;
  }

  list.innerHTML = '';
  var lastDay = '';

  filtered.forEach(function (item) {
    var day = getDayKey(item.timestamp);

    if (day !== lastDay) {
      var dayCount = filtered.filter(function (x) { return getDayKey(x.timestamp) === day; }).length;
      var dh = document.createElement('div');
      dh.className = 'day-header';
      dh.innerHTML = day + '<span class="day-count">' + dayCount + ' threat' + (dayCount > 1 ? 's' : '') + '</span>';
      list.appendChild(dh);
      lastDay = day;
    }

    var reasons    = (item.reasons || []).slice(0, 2).join(' • ');
    var allReasons = (item.reasons || []).map(function (r) {
      return '<div class="reason-item"><span class="reason-weight">rule</span><span class="reason-text">' + r + '</span></div>';
    }).join('');

    var el = document.createElement('div');
    el.className = 'threat-item';
    el.innerHTML =
      '<div class="risk-indicator ' + item.risk + '"></div>' +
      '<div class="threat-main">' +
        '<div class="threat-top">' +
          '<span class="threat-domain">' + (item.domain || 'Unknown') + '</span>' +
          '<span class="risk-pill ' + item.risk + '">' + item.risk.toUpperCase() + '</span>' +
        '</div>' +
        '<div class="threat-reasons">' + reasons + '</div>' +
        '<div class="threat-expanded">' +
          allReasons +
          '<div class="threat-url">' + (item.url || '') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="threat-right">' +
        '<div class="threat-score ' + item.risk + '">' + item.score + '</div>' +
        '<div class="threat-time">' + formatTime(item.timestamp) + '</div>' +
      '</div>';

    el.addEventListener('click', function () { el.classList.toggle('expanded'); });
    list.appendChild(el);
  });
}

function clearHistory() {
  if (!confirm('Clear all threat history?')) return;
  chrome.storage.local.set({ threatHistory: [] }, function () {
    allHistory = [];
    renderStats([]);
    renderChart();
    renderDonut([]);
    renderTopDomains([]);
    renderList();
    showToast('History cleared');
  });
}

function loadHistory() {
  chrome.storage.local.get({ threatHistory: [] }, function (data) {
    allHistory = data.threatHistory || [];
    renderStats(allHistory);
    renderChart();
    renderDonut(allHistory);
    renderTopDomains(allHistory);
    renderList();
  });
}

document.querySelectorAll('.stat-card').forEach(function (card) {
  card.addEventListener('click', function () { setFilter(card.dataset.filter, card); });
});
document.querySelectorAll('.chart-tab').forEach(function (btn) {
  btn.addEventListener('click', function () { setChartMode(btn.dataset.mode, btn); });
});
document.querySelectorAll('.filter-btn').forEach(function (btn) {
  btn.addEventListener('click', function () { setFilter(btn.dataset.filter, btn); });
});
document.getElementById('search-box').addEventListener('input', function () { renderList(); });
document.getElementById('clear-btn').addEventListener('click', function () { clearHistory(); });

document.getElementById('debug-btn').addEventListener('click', function () {
  chrome.storage.local.get({ threatHistory: [] }, function (data) {
    console.log('Raw threat history:', data.threatHistory);
    showToast('Raw data logged to console — press F12');
  });
});

loadHistory();
setInterval(loadHistory, 3000);