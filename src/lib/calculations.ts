export function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

export function computeNetIncome(income: number, deductionPct: number) {
  const safeIncome = Math.max(income, 0);
  const pct = clamp(deductionPct, 0, 60);
  return safeIncome * (1 - pct / 100);
}

export function computeSplitAmounts(netIncome: number, split: { needsPct: number; wantsPct: number; savingsPct: number }) {
  const needs = netIncome * (split.needsPct / 100);
  const wants = netIncome * (split.wantsPct / 100);
  const savings = netIncome * (split.savingsPct / 100);
  return { needs, wants, savings };
}

export function computeFutureValueMonthly(contributionMonthly: number, annualRatePct: number, years: number) {
  const c = Math.max(contributionMonthly, 0);
  const rAnnual = annualRatePct / 100;
  const rMonthly = rAnnual / 12;
  const n = Math.max(years, 0);
  const months = Math.round(n * 12);

  if (months === 0) {
    return { futureValue: 0, principal: 0, interest: 0 };
  }

  if (Math.abs(rMonthly) < 1e-9) {
    const principal = c * months;
    return { futureValue: principal, principal, interest: 0 };
  }

  const growth = Math.pow(1 + rMonthly, months);
  const futureValue = c * ((growth - 1) / rMonthly);
  const principal = c * months;
  const interest = futureValue - principal;
  return { futureValue, principal, interest };
}

export function computePassiveIncome(futureValue: number, annualRatePct: number) {
  const rAnnual = annualRatePct / 100;
  return futureValue * (rAnnual / 12);
}
