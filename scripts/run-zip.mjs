import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT_DIR } from "./lib/content.mjs";

const script = path.join(ROOT_DIR, "scripts", "create-zip.py");
const bundledPython = path.join(
  os.homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  process.platform === "win32" ? "python.exe" : "bin/python3"
);

const candidates = [
  process.env.PYTHON ? { command: process.env.PYTHON, prefix: [] } : null,
  existsSync(bundledPython) ? { command: bundledPython, prefix: [] } : null,
  { command: "python3", prefix: [] },
  { command: "python", prefix: [] },
  process.platform === "win32" ? { command: "py", prefix: ["-3"] } : null
].filter(Boolean);

for (const candidate of candidates) {
  const result = spawnSync(candidate.command, [...candidate.prefix, script], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    stdio: "inherit",
    windowsHide: true
  });

  if (!result.error) process.exit(result.status ?? 1);
  if (result.error.code !== "ENOENT") {
    console.error(`Could not start Python: ${result.error.message}`);
    process.exit(1);
  }
}

console.error("Python 3 was not found. Install Python 3 or set the PYTHON environment variable.");
process.exit(1);
