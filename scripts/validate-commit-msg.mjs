import { readFileSync } from "node:fs";

const commitMessageFile = process.argv[2];

if (!commitMessageFile) {
  console.error("Missing commit message file.");
  process.exit(1);
}

const message = readFileSync(commitMessageFile, "utf8").trim();
const conventionalCommitPattern =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9-\/]+\))?!?: .+/;

if (conventionalCommitPattern.test(message)) {
  process.exit(0);
}

console.error("Invalid commit message.");
console.error("Use the conventional commit format: type(scope): subject");
console.error("Example: feat(api): add authentication");
process.exit(1);
