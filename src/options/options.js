var allowlist = [];

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2000);
}

function renderTags() {
  var container = document.getElementById('allowlist-tags');
  container.innerHTML = '';
  allowlist.forEach(function(domain, i) {
    var tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = domain +
      '<span class="tag-remove" data-index="' + i + '">x</span>';
    container.appendChild(tag);
  });
  container.querySelectorAll('.tag-remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      allowlist.splice(parseInt(btn.dataset.index), 1);
      renderTags();
    });
  });
}

function loadSettings() {
  chrome.storage.local.get({
    pgEnabled:        true,
    pgInterstitial:   true,
    pgHomoglyph:      true,
    pgSafeBrowsing:   true,
    pgNotifications:  false,
    pgHistory:        true,
    pgSensitivity:    30,
    pgAllowlist:      []
  }, function(s) {
    document.getElementById('toggle-enabled').checked       = s.pgEnabled;
    document.getElementById('toggle-interstitial').checked  = s.pgInterstitial;
    document.getElementById('toggle-homoglyph').checked     = s.pgHomoglyph;
    document.getElementById('toggle-safebrowsing').checked  = s.pgSafeBrowsing;
    document.getElementById('toggle-notifications').checked = s.pgNotifications;
    document.getElementById('toggle-history').checked       = s.pgHistory;
    document.getElementById('sensitivity').value            = s.pgSensitivity;
    document.getElementById('sensitivity-val').textContent  = s.pgSensitivity;
    allowlist = s.pgAllowlist || [];
    renderTags();
  });
}

document.getElementById('sensitivity').addEventListener('input', function() {
  document.getElementById('sensitivity-val').textContent = this.value;
});

document.getElementById('allowlist-add').addEventListener('click', function() {
  var val = document.getElementById('allowlist-input').value.trim().toLowerCase();
  if (!val) return;
  if (allowlist.includes(val)) { showToast('Already in allowlist'); return; }
  allowlist.push(val);
  renderTags();
  document.getElementById('allowlist-input').value = '';
});

document.getElementById('allowlist-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('allowlist-add').click();
});

document.getElementById('save-btn').addEventListener('click', function() {
  var settings = {
    pgEnabled:       document.getElementById('toggle-enabled').checked,
    pgInterstitial:  document.getElementById('toggle-interstitial').checked,
    pgHomoglyph:     document.getElementById('toggle-homoglyph').checked,
    pgSafeBrowsing:  document.getElementById('toggle-safebrowsing').checked,
    pgNotifications: document.getElementById('toggle-notifications').checked,
    pgHistory:       document.getElementById('toggle-history').checked,
    pgSensitivity:   parseInt(document.getElementById('sensitivity').value),
    pgAllowlist:     allowlist
  };
  chrome.storage.local.set(settings, function() {
    showToast('Settings saved!');
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings: settings });
  });
});

loadSettings();