var SAFE_BROWSING_API_KEY = 'AIzaSyBO4rZKO-6QOUUqRijjJ7j3cTIy1wsFl70';
var SB_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=';

function checkSafeBrowsing(url) {
  var body = {
    client: { clientId: 'phishguard', clientVersion: '1.0.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url: url }]
    }
  };

  return fetch(SB_ENDPOINT + SAFE_BROWSING_API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.matches && data.matches.length > 0) {
      var threatType = data.matches[0].threatType;
      return {
        flagged: true,
        threatType: threatType,
        reason: 'Google Safe Browsing: ' + threatType.replace(/_/g, ' ')
      };
    }
    return { flagged: false };
  })
  .catch(function() {
    return { flagged: false };
  });
}