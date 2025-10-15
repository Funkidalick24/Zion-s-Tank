// Trust score utilities
// Compute a weighted trust score with simple, explainable rules:
// - Base: average of 1..5 scores
// - Weight boost (+20%) when rating is from same denomination (isVerifiedDenominationMatch)
// - Time decay: newer ratings count slightly more (last 12 months up to +20% weight)
function computeTrustScore(ratings) {
  if (!ratings || ratings.length === 0) return null;

  const now = Date.now();
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

  let weightedSum = 0;
  let weightTotal = 0;

  for (const r of ratings) {
    const score = Number(r.score) || 0;

    // base weight
    let weight = 1;

    // denomination match boost
    if (r.isVerifiedDenominationMatch) {
      weight *= 1.2; // +20%
    }

    // time decay boost (up to +20% for newest ratings within last year)
    const created = new Date(r.createdAt || r.created_at || now).getTime();
    const age = Math.max(0, Math.min(ONE_YEAR_MS, now - created));
    const recencyFactor = 1.2 - (age / ONE_YEAR_MS) * 0.2; // from 1.2 down to 1.0
    weight *= recencyFactor;

    weightedSum += score * weight;
    weightTotal += weight;
  }

  const avg = weightedSum / (weightTotal || 1);
  // Clamp between 1 and 5, and round to 2 decimals for storage/display
  const clamped = Math.max(1, Math.min(5, avg));
  return Math.round(clamped * 100) / 100;
}

module.exports = {
  computeTrustScore
};