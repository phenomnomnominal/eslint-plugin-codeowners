import type { Rule } from "eslint";

import * as fs from "node:fs";
import * as path from "node:path";

import * as codeownersUtils from "codeowners-utils";
import * as findUp from "find-up";
import ignore from "ignore";

export const ensureDirectoryOwners: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce that all directories have an owner declared in the CODEOWNERS file.",
    },
    messages: {
      missingOwner: `The "{{directory}}" directory doesn't have an owner listed in "{{codeowners}}"`,
    },
  },
  create(context) {
    const { sourceCode } = context;

    function parse(codeowners: string) {
      const groups = [];
      const entries = [];

      let lines = codeowners.split("\n");

      for (let line of lines) {
        // Grab everything up to the comment delimiter:
        let [content] = line.split("#");
        let trimmed = content.trim();
        if (trimmed === "") {
          continue;
        }

        const result = trimmed.match(/(\S+)\s+(.*)/);
        if (!result) {
          continue;
        }

        let [, head, rest] = result;
        const owners = rest
          .split(/@/)
          .filter(Boolean)
          .map((owner) => owner.trim())
          .map((owner) => `@${owner}`);
        if (head.startsWith("@")) {
          groups.push({ name: head, owners });
        } else {
          entries.push({ pattern: head, owners });
        }
      }

      return { groups, entries };
    }

    const directories = fs
      .readdirSync(context.cwd, { withFileTypes: true })
      .filter((f) => f.isDirectory());

    const ignored = ignore();

    const gitignore = findUp.sync(".gitignore");
    if (gitignore) {
      ignored.add(fs.readFileSync(gitignore, "utf-8"));
    }
    const eslintignore = findUp.sync(".eslintignore");
    if (eslintignore) {
      ignored.add(fs.readFileSync(eslintignore, "utf-8"));
    }

    return {
      Program: (node) => {
        const comments = sourceCode.getAllComments();
        const codeowners = comments.map((comment) => comment.value).join("\n");
        const parsed = parse(codeowners);

        const relativePath = path.relative(
          context.getCwd(),
          context.getPhysicalFilename()
        );

        codeownersUtils
          .filterUnmatchedFiles(
            directories.map((directory) => directory.name),
            parsed.entries
          )
          .forEach((unmatched) => {
            if (
              ignored.ignores(unmatched) ||
              ignored.ignores(`${unmatched}/`)
            ) {
              return;
            }

            context.report({
              node: node,
              messageId: "missingOwner",
              data: {
                directory: unmatched,
                codeowners: relativePath,
              },
            });
          });
      },
    };
  },
};
