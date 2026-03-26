# Examples

## Additive HTTP change

- add optional response field
- keep existing status codes and error shapes unchanged
- update OpenAPI examples and client snapshots
- verdict: usually safe if consumers tolerate unknown fields

## Breaking schema change

- rename a required request field
- tighten validation without versioning
- generated clients now serialize a different property name
- verdict: breaking unless versioned or migrated with a compatibility window
