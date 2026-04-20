export function urlStructureCheck(parsed) {
  const hits = [];

  if (parsed.isIP) {
    hits.push({ weight: 45, reason: `IP address used as hostname: ${parsed.hostname}` });
  }
  if (parsed.subdomains.length > 3) {
    hits.push({ weight: 25, reason: `Excessive subdomains (${parsed.subdomains.length})` });
  }
  if (parsed.length > 200) {
    hits.push({ weight: 15, reason: `Abnormally long URL (${parsed.length} chars)` });
  }
  if (parsed.raw.includes('@')) {
    hits.push({ weight: 40, reason: 'URL contains @ — classic misdirection trick' });
  }
  if (/%[0-9a-fA-F]{2}/.test(parsed.hostname)) {
    hits.push({ weight: 35, reason: 'Encoded characters in hostname' });
  }

  return hits.length
    ? { triggered: true, weight: hits.reduce((s, h) => s + h.weight, 0), reason: hits.map(h => h.reason).join(' | ') }
    : { triggered: false };
}