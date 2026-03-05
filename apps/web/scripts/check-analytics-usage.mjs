import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceDirs = ["app", "components", "lib"];
const allowedFiles = new Set([
  path.normalize("app/layout.tsx"),
  path.normalize("lib/analytics/client.ts")
]);
const ignoredDirs = new Set([".next", "node_modules", "playwright-report", "test-results", ".turbo"]);
const codeFilePattern = /\.(?:[cm]?[jt]sx?)$/;

const patterns = [
  {
    key: "gtag(",
    regex: /\bgtag\s*\(/g,
    message: "Direct gtag() usage is not allowed outside lib/analytics/client.ts."
  },
  {
    key: "dataLayer.push(",
    regex: /\bdataLayer\s*\.\s*push\s*\(/g,
    message: "Direct dataLayer.push() usage is not allowed outside lib/analytics/client.ts."
  }
];

async function collectFiles(dirPath, output) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath, output);
      continue;
    }
    if (entry.isFile() && codeFilePattern.test(entry.name)) {
      output.push(fullPath);
    }
  }
}

function getLineNumbers(source, regex) {
  const lines = source.split(/\r?\n/);
  const hits = [];
  for (let index = 0; index < lines.length; index += 1) {
    regex.lastIndex = 0;
    if (regex.test(lines[index])) hits.push(index + 1);
  }
  return hits;
}

async function run() {
  const files = [];
  for (const dir of sourceDirs) {
    const full = path.join(rootDir, dir);
    try {
      const details = await stat(full);
      if (!details.isDirectory()) continue;
      await collectFiles(full, files);
    } catch {
      // Directory may not exist in some environments.
    }
  }

  const violations = [];
  for (const filePath of files) {
    const relativePath = path.normalize(path.relative(rootDir, filePath));
    if (allowedFiles.has(relativePath)) continue;

    const source = await readFile(filePath, "utf8");
    for (const pattern of patterns) {
      const lines = getLineNumbers(source, pattern.regex);
      for (const line of lines) {
        violations.push(`${relativePath}:${line} ${pattern.message}`);
      }
    }
  }

  if (violations.length === 0) {
    process.stdout.write("analytics guard: OK\n");
    return;
  }

  process.stderr.write("analytics guard: found forbidden direct analytics calls\n");
  for (const violation of violations) {
    process.stderr.write(`- ${violation}\n`);
  }
  process.exitCode = 1;
}

await run();
