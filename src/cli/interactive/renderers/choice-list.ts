export function renderChoiceList(choices: string[], selected: string[] = []): string {
  return choices
    .map((choice, index) => {
      const marker = selected.includes(choice) ? "[x]" : "[ ]";
      return `${index + 1}. ${marker} ${choice}`;
    })
    .join("\n");
}
