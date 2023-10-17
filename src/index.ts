import { ESLint } from "eslint";
import { ensureDirectoryOwners } from "./ensure-directory-owners";
import { processor } from "./processor";

const plugin: ESLint.Plugin = {
  configs: {
    recommended: {
      plugins: ["codeowners"],
      overrides: [
        {
          files: ["CODEOWNERS"],
          processor: "codeowners/codeowners",
        },
        {
          files: ["CODEOWNERS.js"],
          rules: {
            "codeowners/ensure-directory-owners": "error",
          },
        },
      ],
    },
  },
  processors: {
    codeowners: processor,
  },
  rules: {
    "ensure-directory-owners": ensureDirectoryOwners,
  },
};

module.exports = plugin;
