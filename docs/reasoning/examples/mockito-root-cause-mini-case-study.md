---
id: mockito-root-cause-mini-case-study
kind: example
title: Mockito Root Cause Mini Case Study
summary: How the four-phase semi-formal fault-localization pattern finds the cause rather than the crash site.
status: stable
version: 1
---

# Mockito Root Cause Mini Case Study

## Problem shape

A failing test eventually produces infinite recursion and a stack overflow.
A shallow reasoner naturally points to the recursive method where the crash happens.

That is often the wrong fix location.

## What the semi-formal method changes

### Phase 1 - Test semantics analysis

The investigation first extracts what the test is actually asserting.
This stops the agent from optimizing around the loudest symptom.

### Phase 2 - Code path tracing

The method traces the path from the test through generic-type handling and registration logic.
This expands the search beyond the crash site.

### Phase 3 - Divergence analysis

Competing hypotheses are formed and tested.
The critical question becomes:

- where does the system create the self-referential mapping that makes recursion inevitable?

### Phase 4 - Ranked predictions

The method then ranks the likely fault regions based on the divergence claims, not on where the exception finally appears.

## Root-cause lesson

The bug is not merely "recursive code without cycle detection."
The deeper issue is that earlier registration logic overwrites a safe mapping with a self-referential one.
That earlier overwrite is the real root cause.

## Why this matters for universal engineering templates

This case shows why a strong investigation template must demand:

- premise -> claim -> prediction linkage
- explicit competing hypotheses
- distinction between root cause and crash site
- multi-step path tracing across files and abstractions

## Reusable lesson

Whenever the most obvious buggy line is where the system explodes, ask:

1. what earlier state mutation made that explosion possible?
2. which earlier function converted a safe state into an unsafe one?
3. is the current candidate the root cause or only the manifestation point?

If that distinction is not made, bug localization is incomplete.
