# Token Budget Scoring Model

Use a simple score to compare candidate context surfaces.

## Formula

`score = authority + freshness + reuseValue - tokenCost - ambiguityPenalty`

Each dimension can be scored from `0` to `3`.

## Guidance

- authority:
  - `3` canonical machine-readable runtime truth
  - `2` maintained human-readable canonical docs
  - `1` narrow ad-hoc notes or inferred summaries
  - `0` stale or untrusted context
- freshness:
  - `3` generated or edited after the relevant change
  - `2` likely current but not recently verified
  - `1` possibly stale
  - `0` known stale
- reuseValue:
  - `3` directly answers the next question
  - `2` sharply narrows what must be read next
  - `1` weakly helpful
  - `0` mostly decorative
- tokenCost:
  - `3` large or diffuse
  - `2` moderate
  - `1` small
  - `0` tiny
- ambiguityPenalty:
  - `3` likely to mislead without verification
  - `2` needs careful cross-checking
  - `1` low ambiguity
  - `0` explicit and stable

## Usage rule

Prefer the smallest set of surfaces with the highest positive score, then
validate any high-risk claim with one focused evidence read instead of a broad
context expansion.
