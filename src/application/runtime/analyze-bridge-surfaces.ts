export interface BridgeSurfaceAnalysis {
  path: string;
  tokenEstimate: number;
  withinBudget: boolean;
  hasCanonicalPointer: boolean;
}

export function analyzeBridgeSurface(pathValue: string, content: string, maxTokens: number): BridgeSurfaceAnalysis {
  const tokenEstimate = Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length * 1.33));
  const hasCanonicalPointer = content.includes(".hforge/");
  return {
    path: pathValue,
    tokenEstimate,
    withinBudget: tokenEstimate <= maxTokens,
    hasCanonicalPointer
  };
}
