# Contract: Hidden Working Memory

## Purpose

Define the hidden short-term cache model used to keep active tasks resumable
without turning working memory into a transcript archive.

## Required Guarantees

- Working memory records current objective, active plan, files in focus,
  confirmed facts, open questions, recent failed attempts, and next step.
- Working memory stays compact enough for one short read.
- Confirmed facts remain distinguishable from inference and unresolved
  questions.
- Durable learnings are promoted out of cache into the correct long-term
  hidden artifact when they stabilize.
- Working memory remains a hidden runtime surface rather than a visible product
  repo tree.

## Validation Expectations

- Working-memory checks fail when required fields disappear from active memory
  surfaces.
- Compactness and hygiene checks fail when working memory grows into raw logs or
  full transcripts.
- Promotion and lifecycle checks fail when durable knowledge is promised but
  remains stranded only in cache artifacts.
