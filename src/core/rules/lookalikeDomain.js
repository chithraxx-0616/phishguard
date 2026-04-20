import { levenshtein } from '../utils/levenshtein.js';

const TOP_DOMAINS = ['paypal.com','amazon.com','google.com','microsoft.com',
  'apple.com','facebook.com','netflix.com','instagram.com','twitter.com',
  'linkedin.com','github.com','dropbox.com','chase.com','wellsfargo.com'];

export function lookalikeDomainCheck(parsed) {
  const candidate = parsed.domain.toLowerCase();
  for (const trusted of TOP_DOMAINS) {
    if (candidate === trusted) return { triggered: false };
    const dist = levenshtein(candidate, trusted);
    if (dist > 0 && dist <= 2) {
      return {
        triggered: true,
        weight: 60,
        reason: `Lookalike domain — "${candidate}" is ${dist} edit(s) from "${trusted}"`
      };
    }
  }
  return { triggered: false };
}