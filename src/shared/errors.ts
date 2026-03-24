export class HarnessForgeError extends Error {
  constructor(message: string, readonly code = "HARNESS_FORGE_ERROR") {
    super(message);
    this.name = "HarnessForgeError";
  }
}

export class ValidationError extends HarnessForgeError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}
