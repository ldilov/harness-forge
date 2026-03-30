# JavaScript Detailed Testing

## Priorities

- test changed behavior at the narrowest reliable layer
- cover invalid input and failure translation, not only happy paths
- keep at least one verification path close to the public contract

## Review prompts

- can a maintainer understand the behavior from the tests alone?
- are critical integration assumptions tested where mocks would hide breakage?
- do tests fail for the right reason when the contract changes?
