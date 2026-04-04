interface ValidationContext {
  objective?: string;
  acceptedPlan?: string[];
  unresolved?: string[];
  artifacts?: string[];
  criticalEventsPreserved?: boolean;
}

interface ValidationResult {
  passed: boolean;
  checks: string[];
  failures: string[];
}

export function validateCompaction(context: ValidationContext): ValidationResult {
  const checks: string[] = [];
  const failures: string[] = [];

  if (context.objective && context.objective.length > 0) {
    checks.push('objective exists and non-empty');
  } else {
    failures.push('objective missing or empty');
  }

  if (context.acceptedPlan !== undefined) {
    checks.push('acceptedPlan present');
  } else {
    failures.push('acceptedPlan missing');
  }

  if (context.unresolved !== undefined) {
    checks.push('unresolved present');
  } else {
    failures.push('unresolved missing');
  }

  if (context.artifacts !== undefined && context.artifacts.length >= 0) {
    checks.push('artifact paths provided');
  } else {
    failures.push('artifact paths missing');
  }

  if (context.criticalEventsPreserved === true) {
    checks.push('critical events preserved');
  } else {
    failures.push('critical events not preserved');
  }

  return {
    passed: failures.length === 0,
    checks,
    failures,
  };
}
