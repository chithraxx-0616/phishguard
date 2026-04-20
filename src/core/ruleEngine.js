import { parseURL }               from './urlParser.js';
import { httpCheck }              from './rules/httpCheck.js';
import { urlStructureCheck }      from './rules/urlStructure.js';
import { suspiciousKeywordsCheck }from './rules/suspiciousKeywords.js';
import { lookalikeDomainCheck }   from './rules/lookalikeDomain.js';
import { scoreResult }            from './scorer.js';

export function analyzeURL(rawURL) {
  const parsed = parseURL(rawURL);
  if (!parsed) return null;

  const rules = [httpCheck, urlStructureCheck, suspiciousKeywordsCheck, lookalikeDomainCheck];
  const hits = rules.map(fn => fn(parsed)).filter(r => r.triggered);

  return { parsed, ...scoreResult(hits) };
}