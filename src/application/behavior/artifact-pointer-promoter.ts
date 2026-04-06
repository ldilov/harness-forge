import type { BehaviorEventEmitter } from './behavior-event-emitter.js';

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
  private readonly emitter?: BehaviorEventEmitter;

  constructor(inlineThresholdChars = 2000, emitter?: BehaviorEventEmitter) {
    this.inlineThresholdChars = inlineThresholdChars;
    this.emitter = emitter;
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

    this.emitter?.emitArtifactPointerPromoted({
      artifactId: item.id,
      sourcePath: item.sourcePath,
      originalChars: item.content.length,
      estimatedTokensSaved: savedTokens,
      reference: refText,
    });

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
