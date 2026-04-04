/**
 * Promotes long inline content to artifact pointer references.
 * Implements AC-9: Artifact Pointer Promotion.
 *
 * When content exceeds a threshold, it is replaced with a reference
 * to the canonical file path rather than being pasted inline.
 */

export interface InlineContent {
  readonly id: string;
  readonly content: string;
  readonly sourcePath?: string;
}

export interface PromotionResult {
  readonly promoted: boolean;
  readonly reference: string;
  readonly estimatedTokensSaved: number;
}

export class ArtifactPointerPromoter {
  private readonly inlineThresholdChars: number;

  constructor(inlineThresholdChars = 2000) {
    this.inlineThresholdChars = inlineThresholdChars;
  }

  evaluate(item: InlineContent): PromotionResult {
    if (item.content.length <= this.inlineThresholdChars) {
      return {
        promoted: false,
        reference: item.content,
        estimatedTokensSaved: 0,
      };
    }

    const refText = item.sourcePath
      ? `[See ${item.sourcePath}]`
      : `[See artifact ${item.id}]`;

    const savedChars = item.content.length - refText.length;
    const savedTokens = Math.max(0, Math.floor(savedChars / 4));

    return {
      promoted: true,
      reference: refText,
      estimatedTokensSaved: savedTokens,
    };
  }

  evaluateAll(items: readonly InlineContent[]): readonly PromotionResult[] {
    return items.map((item) => this.evaluate(item));
  }
}
