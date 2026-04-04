---
id: django-name-shadowing-mini-case-study
kind: example
title: Django Name Shadowing Mini Case Study
summary: Why semi-formal tracing beats surface reasoning on the format() shadowing example.
status: stable
version: 1
---

# Django Name Shadowing Mini Case Study

## Task

Determine whether two patches for 2-digit year formatting are equivalent.

## Surface-level trap

Both patches look like they should yield the same string result for a year like `476`:

- Patch 1 pads to 4 digits and takes the last 2
- Patch 2 takes modulo 100 and pads to 2 digits

An informal reasoner may stop there and conclude equivalence.

## What semi-formal reasoning forces

### Premise pressure

The investigator must first state what each patch changes and what tests are supposed to check.

### Trace pressure

The investigator must then trace the actual call path of Patch 1.
That means asking:

- which `format()` is this?
- where is it resolved from?
- what type does it expect?

### Critical discovery

The module defines its own `format(value, format_string)` helper.
Because Python resolves names local -> module -> builtins, the patch does **not** call the builtin `format()`.

That helper expects a date-like object, not an integer.

### Counterexample

A test using a year like `476` reaches:

- `format(476, "04d")`
- module helper creates `DateFormat(476)`
- downstream code expects date-like fields such as `.day`
- integer input causes failure

Patch 2 does not take that path and succeeds.

## Why this matters for template design

This example is the strongest reason to require:

- function trace tables
- explicit hidden-semantics notes
- counterexample sections
- no equivalence claim without actual path tracing

## Reusable lesson

Whenever two changes look equivalent from syntax alone, ask:

1. are they calling the same resolved definition?
2. do they pass through the same helpers and wrappers?
3. do hidden framework or module semantics make one path fail?
4. can I name a concrete test or input that separates them?

If those questions are not answered, the equivalence claim is not yet trustworthy.
