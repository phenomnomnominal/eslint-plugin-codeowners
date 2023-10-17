import type { Linter } from "eslint";

function preprocess(text: string, filename: string) {
  return [
    {
      text: text
        .split("\n")
        .map((line) => `// ${line}`)
        .join("\n"),
      filename: `${filename}.js`,
    },
  ];
}

function postprocess(
  messages: Array<Array<Linter.LintMessage>>
): Array<Linter.LintMessage> {
  const [codeownersIssues] = messages;
  return codeownersIssues;
}

export const processor: Linter.Processor = {
  preprocess,
  postprocess,
  supportsAutofix: false,
};
