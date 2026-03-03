/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const DIST_DIR = path.join(__dirname, "..", "dist");

const disallowedStyleChecks = [
  { name: "position:fixed", pattern: /position\s*:\s*fixed/i },
  { name: "@font-face", pattern: /@font-face/i },
  { name: "CSS gradients", pattern: /(linear-gradient|radial-gradient)\s*\(/i },
  { name: "CSS animations", pattern: /animation\s*:/i }
];

function listHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listHtmlFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function relative(filePath) {
  return path.relative(path.join(__dirname, ".."), filePath).replaceAll("\\", "/");
}

function findLinksAndSources(html) {
  const urls = [];
  const regex = /\b(?:href|src)="([^"]+)"/gi;
  let match = regex.exec(html);
  while (match) {
    urls.push(match[1]);
    match = regex.exec(html);
  }
  return urls;
}

function run() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error("Compatibility check failed: packages/emails/dist not found.");
    process.exit(1);
  }

  const htmlFiles = listHtmlFiles(DIST_DIR);
  if (htmlFiles.length === 0) {
    console.error("Compatibility check failed: no HTML files found in packages/emails/dist.");
    process.exit(1);
  }

  const errors = [];

  for (const filePath of htmlFiles) {
    const html = fs.readFileSync(filePath, "utf8");

    if (!/max-width:\s*600px/i.test(html)) {
      errors.push(`${relative(filePath)}: missing expected max-width:600px container.`);
    }

    for (const check of disallowedStyleChecks) {
      if (check.pattern.test(html)) {
        errors.push(`${relative(filePath)}: uses disallowed style pattern "${check.name}".`);
      }
    }

    const urls = findLinksAndSources(html);
    for (const url of urls) {
      if (url.startsWith("http://") && !url.startsWith("http://localhost:")) {
        errors.push(`${relative(filePath)}: contains non-HTTPS URL "${url}".`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("Email compatibility check failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Email compatibility check passed for ${htmlFiles.length} templates.`);
}

run();
