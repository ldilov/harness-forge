# Protobuf And Buf

## Protobuf compatibility rules

- never reuse field numbers for different meanings
- reserve removed field numbers and names when a field is retired
- be careful with required-like semantics implemented in application code even if the wire format stays compatible
- think about JSON mapping as well as binary wire compatibility when the schema is used through gateways

## Buf guidance

Buf breaking checks let a repo choose stricter or looser policies such as `FILE`, `PACKAGE`, `WIRE_JSON`, or `WIRE`. Treat the chosen category as a floor, not a substitute for reasoning about client behavior.
