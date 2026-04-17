#!/usr/bin/env node
/**
 * Fail CI if disallowed trademark-style tokens appear in source or bundled HTML.
 * Complements human review; see CLAUDE.md.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const banned = [
  { re: /\bF1\b/i, name: "F1" },
  { re: /\bFormula\s+1\b/i, name: "Formula 1" },
  { re: /\bFormula\s+One\b/i, name: "Formula One" },
  { re: /\bFIA\b/i, name: "FIA" },
  { re: /\bGrand\s+Prix\b/i, name: "Grand Prix" },
];

/** Three-letter real team codes to avoid per CLAUDE.md (whole-word). */
const bannedCodes = /\b(FER|MER|MCL|RBR|ALP|AST|WIL|ALF|HAA|SAU)\b/;

const extensions = new Set([".ts", ".tsx", ".html", ".json", ".css"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".git") continue;
    const full = join(dir, name);
    const st = statSync(full, { throwIfNoEntry: false });
    if (!st) continue;
    if (st.isDirectory()) walk(full, out);
    else {
      const ext = full.slice(full.lastIndexOf("."));
      if (extensions.has(ext)) out.push(full);
    }
  }
  return out;
}

const files = [...walk(join(root, "src")), join(root, "index.html")];

let exit = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rel = relative(root, file);

  for (const { re, name } of banned) {
    if (re.test(text)) {
      console.error(`[legal-scan] Disallowed token "${name}" in ${rel}`);
      exit = 1;
    }
  }
  if (bannedCodes.test(text)) {
    console.error(`[legal-scan] Disallowed team-style code token in ${rel}`);
    exit = 1;
  }
}

if (exit !== 0) {
  console.error("\nlegal-scan failed — remove or rewrite the flagged strings (see CLAUDE.md).");
}
process.exit(exit);
