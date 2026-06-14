export function projectedHbA1c(avgMmol) {
  const avg = Number(avgMmol);

  if (!Number.isFinite(avg) || avg <= 0) {
    return null;
  }

  return ((avg + 2.59) / 1.59).toFixed(1);
}
