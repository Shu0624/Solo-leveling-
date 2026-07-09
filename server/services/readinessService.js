// Single source of truth for the composite "career readiness" score.
//
// Every component is expected on a 0–100 scale. The score is a weighted
// average: sum(score * weight) / sum(weight). Passing only a subset of
// components renormalizes over the weights actually provided, so callers that
// don't have (say) interview or module data still produce a correctly-scaled
// 0–100 result. This replaces three divergent inline copies that previously
// lived in dashboard.js and analytics.js.

// Canonical weights for the full component set.
export const READINESS_WEIGHTS = {
  quiz: 15,
  interview: 15,
  resume: 15,
  dsa: 15,
  focus: 10,
  modules: 10,
  academics: 10,
  language: 10,
};

// components: { quiz: 82, resume: 60, ... } — any subset of READINESS_WEIGHTS keys.
export const computeReadinessScore = (components = {}) => {
  let weighted = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(READINESS_WEIGHTS)) {
    const value = components[key];
    if (value == null || Number.isNaN(value)) continue;
    weighted += Math.min(Math.max(value, 0), 100) * weight;
    weightSum += weight;
  }
  if (weightSum === 0) return 0;
  return Math.round(weighted / weightSum);
};

export default computeReadinessScore;
