# Examples

## Safe additive change

- add nullable column
- write both old and new fields from the app
- backfill historical rows in chunks
- switch reads after validation
- drop old field in a later release

## Risky contract change

- rename column through ORM model edit only
- generated SQL drops and re-creates the column
- no dual-read path or backfill plan exists
- verdict: blocked until the migration is rewritten as a preserve-data rename or expand-and-contract sequence
