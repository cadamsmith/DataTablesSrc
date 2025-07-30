import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log(__dirname);

export function loadTestContent(name) {
  // Loads the content to be inserted (e.g. just the table HTML)
  const filePath = resolve(__dirname, "html", name);
  return readFileSync(filePath, "utf8");
}

export function getBaseUrl() {
  // Adjust path if you use a local server
  return "file://" + resolve(__dirname, "html/test_container.html");
}
