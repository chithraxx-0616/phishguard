export function scoreResult(ruleHits) {
  const total = ruleHits.reduce((sum, h) => sum + (h.weight || 0), 0);
  const score = Math.min(100, total);
  return {
    score,
    risk: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low',
    ruleHits,
  };
}