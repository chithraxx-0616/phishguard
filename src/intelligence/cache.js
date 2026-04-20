const DB_NAME = 'phishguard';
const DB_VERSION = 1;
const STORE = 'blocklist';

function openDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'domain' });
      }
    };
    req.onsuccess = function(e) { resolve(e.target.result); };
    req.onerror   = function(e) { reject(e.target.error); };
  });
}

function addDomains(domains) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE, 'readwrite');
      var store = tx.objectStore(STORE);
      domains.forEach(function(d) {
        store.put({ domain: d.toLowerCase().trim() });
      });
      tx.oncomplete = resolve;
      tx.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function isDomainBlocked(domain) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE, 'readonly');
      var store = tx.objectStore(STORE);
      var req = store.get(domain.toLowerCase().trim());
      req.onsuccess = function(e) { resolve(!!e.target.result); };
      req.onerror   = function(e) { reject(e.target.error); };
    });
  });
}

function getBlocklistCount() {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE, 'readonly');
      var store = tx.objectStore(STORE);
      var req = store.count();
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror   = function(e) { reject(e.target.error); };
    });
  });
}