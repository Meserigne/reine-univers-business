/** 1 point = 250 F CFA (gagné et dépensé) */
export const POINT_VALUE_FCFA = 250

export function pointsFromAmount(amountFcfa: number) {
  return Math.max(0, Math.floor(amountFcfa / POINT_VALUE_FCFA))
}

export function discountFromPoints(points: number) {
  return Math.max(0, points) * POINT_VALUE_FCFA
}

export function maxRedeemable(availablePoints: number, totalFcfa: number) {
  return Math.min(availablePoints, pointsFromAmount(totalFcfa))
}

export function formatPoints(points: number) {
  return `${points} pt${points > 1 ? 's' : ''}`
}
