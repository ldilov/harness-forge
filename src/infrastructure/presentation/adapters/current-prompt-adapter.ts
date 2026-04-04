import type {
  PromptAdapter,
  SelectOptions,
  MultiSelectOptions,
  ProgressStep,
} from "../prompt-adapter.js";

export class CurrentPromptAdapter implements PromptAdapter {
  async select(options: SelectOptions): Promise<string> {
    const { createInterface } = await import("node:readline");
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    return new Promise((resolve) => {
      console.log(options.message);
      for (let i = 0; i < options.choices.length; i++) {
        const choice = options.choices[i]!;
        console.log(`  ${i + 1}) ${choice.label}`);
      }

      rl.question("> ", (answer) => {
        rl.close();
        const idx = parseInt(answer, 10) - 1;
        const selected = options.choices[idx];
        resolve(selected?.value ?? options.choices[0]?.value ?? "");
      });
    });
  }

  async confirm(message: string): Promise<boolean> {
    const { createInterface } = await import("node:readline");
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    return new Promise((resolve) => {
      rl.question(`${message} (y/n) `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase().startsWith("y"));
      });
    });
  }

  async textInput(prompt: string): Promise<string> {
    const { createInterface } = await import("node:readline");
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    return new Promise((resolve) => {
      rl.question(`${prompt}: `, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  async multiSelect(options: MultiSelectOptions): Promise<string[]> {
    const selected = await this.select({
      message: options.message,
      choices: options.choices,
    });
    return [selected];
  }

  showProgress(steps: ProgressStep[]): void {
    for (const step of steps) {
      const icon = step.status === "done" ? "\u2714" : step.status === "failed" ? "\u2717" : step.status === "running" ? "\u2026" : " ";
      console.log(`${icon} ${step.label}`);
    }
  }
}
