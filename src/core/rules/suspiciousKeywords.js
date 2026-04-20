const BRAND_KEYWORDS = [
  'paypal', 'amazon', 'netflix', 'google', 'microsoft', 'apple',
  'facebook', 'instagram', 'twitter', 'bank', 'secure', 'verify',
  'update', 'login', 'signin', 'account', 'confirm', 'wallet'
];

export function suspiciousKeywordsCheck(parsed) {
  const domain = parsed.domain.toLowerCase();
  const hit = BRAND_KEYWORDS.find(k => domain.includes(k));
  if (hit && !domain.endsWith(`${hit}.com`) && !domain.endsWith(`${hit}.org`)) {
    return { triggered: true, weight: 30, reason: `Brand keyword "${hit}" in untrusted domain` };
  }
  return { triggered: false };
}