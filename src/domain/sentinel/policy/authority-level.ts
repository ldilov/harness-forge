import { AuthorityLevelSchema, type AuthorityLevel } from "../action/action-plan.js";

export { AuthorityLevelSchema, type AuthorityLevel };

const ORDER: Readonly<Record<AuthorityLevel, number>> = {
  A0: 0,
  A1: 1,
  A2: 2,
  A3: 3,
  A4: 4,
  A5: 5,
};

export function authorityRank(level: AuthorityLevel): number {
  const value = ORDER[level];
  return value === undefined ? -1 : value;
}

export function authorityAtLeast(actual: AuthorityLevel, required: AuthorityLevel): boolean {
  return authorityRank(actual) >= authorityRank(required);
}

export function maxAuthority(left: AuthorityLevel, right: AuthorityLevel): AuthorityLevel {
  return authorityRank(left) >= authorityRank(right) ? left : right;
}
