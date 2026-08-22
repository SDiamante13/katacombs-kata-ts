import { examine } from './behavior-sensor.mjs';
import { failing, unavailable } from './behavior-verdict.mjs';
import { inspect } from './edit-sensors.mjs';
import { cheapTierFirst, mutationUnavailable } from './stage-findings.mjs';

function crashed(error) {
  return unavailable([mutationUnavailable(String(error?.stack ?? error))]);
}

// Expensive sensors are gated on the cheap ones being green. This is that gate.
function gated(changed, cheapTier, expensiveTier) {
  const cheap = cheapTier(changed);

  if (cheap && !cheap.passed) return failing([cheapTierFirst(cheap.report)]);

  return expensiveTier(changed);
}

export function verdictFor(changed, tiers = {}) {
  const { cheapTier = inspect, expensiveTier = examine } = tiers;

  try {
    return gated(changed, cheapTier, expensiveTier);
  } catch (error) {
    return crashed(error);
  }
}
