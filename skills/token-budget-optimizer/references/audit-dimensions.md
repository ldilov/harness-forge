# Token Surface Audit Dimensions

Use these dimensions when deciding whether a surface deserves active context.

## Authority

- highest: generated or maintained runtime truth such as `.hforge/agent-manifest.json`, `.hforge/generated/agent-command-catalog.json`, and current runtime indexes
- medium: maintained docs and active skill contracts
- lower: old notes, ad-hoc chat summaries, or broad source scans without task focus

## Freshness

- prefer artifacts regenerated after the latest repo changes
- downgrade summaries that predate major install, refresh, or architecture changes
- if freshness is unclear, verify with `status`, `refresh`, or a targeted file read

## Reuse value

- high when the surface already answers the current question directly
- medium when the surface narrows the search space meaningfully
- low when the surface only restates generic repo facts or marketing prose

## Token cost

- very low: compact JSON summaries, short skill wrappers, direct command catalogs
- medium: short markdown guides and specific reference docs
- high: large source trees, broad recursive scans, or entire repo reviews with no focus

## Risk of omission

- high risk means the surface guards support claims, release gates, migrations, security rules, or architecture decisions
- low risk means the surface is descriptive but not safety-critical

## Recommended decision rule

Keep in active context only the smallest set of high-authority, sufficiently
fresh surfaces that answer the current question without hiding a known risk.
