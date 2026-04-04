export interface PromptAdapter {
  select(options: SelectOptions): Promise<string>;
  confirm(message: string): Promise<boolean>;
  textInput(prompt: string): Promise<string>;
  multiSelect(options: MultiSelectOptions): Promise<string[]>;
  showProgress(steps: ProgressStep[]): void;
}

export interface SelectOptions {
  readonly message: string;
  readonly choices: readonly SelectChoice[];
}

export interface SelectChoice {
  readonly label: string;
  readonly value: string;
  readonly description?: string;
}

export interface MultiSelectOptions {
  readonly message: string;
  readonly choices: readonly SelectChoice[];
}

export interface ProgressStep {
  readonly label: string;
  readonly status: "pending" | "running" | "done" | "failed";
}
