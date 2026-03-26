# Automation Candidates

## High-value helpers

- OpenRewrite for large-scale source refactors in JVM-heavy estates
- modernize-dotnet or Upgrade Assistant style flows for .NET upgrade scaffolding
- Renovate for controlled dependency update intake and risk visibility
- language-native codemods, formatters, and linters for consistency fixes

## Use automation when

- the change pattern repeats many times
- the transformation can be validated mechanically
- humans should review policy, not hand-apply the same edit hundreds of times

## Avoid automation when

- the seam is still poorly understood
- generated diffs would overwhelm review without strong validation
