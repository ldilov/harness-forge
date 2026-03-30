# Java Detailed Tooling

## Preferred verification categories

- gradle test
- mvn test
- JUnit 5
- Testcontainers if infra is real

## Tooling discipline

- keep one obvious local verification path
- do not add parallel tools that solve the same problem without a migration plan
- prefer formatter/linter/typecheck/test/build sequencing that matches repo-native CI
- for libraries and CLIs, validate the packaged surface before release when possible
