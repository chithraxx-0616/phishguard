export function httpCheck(parsed) {
  if (parsed.protocol === 'http:') {
    return { triggered: true, weight: 20, reason: 'Uses insecure HTTP — no encryption' };
  }
  return { triggered: false };
}