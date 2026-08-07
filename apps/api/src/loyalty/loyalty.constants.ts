/** 1 point gagné / dépensé = 250 F CFA */
export const POINT_VALUE_FCFA = 250;

export function pointsFromAmount(amountFcfa: number) {
  return Math.max(0, Math.floor(amountFcfa / POINT_VALUE_FCFA));
}

export function discountFromPoints(points: number) {
  return Math.max(0, points) * POINT_VALUE_FCFA;
}
