// Called by .githooks/post-commit: adds a commit's subject to the changelog's [Unreleased] section.
// Runs on plain node (type stripping), so it stays free of ts-node's start-up time on every commit.
import * as fs from "fs";
import * as path from "path";

const UNRELEASED_HEADING = "## [Unreleased]";
const SECTIONS = ["Added", "Changed", "Fixed"];
const SECTION_BY_TYPE: Record<string, string> = { feat: "Added", fix: "Fixed" };

export interface ChangelogEntry {
  section: string;
  text: string;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatScope(scope: string): string {
  return scope.length <= 2 ? scope.toUpperCase() : capitalize(scope);
}

/** Null for work in progress (`wip:`, `feat: wip`), which stays out of the changelog. */
export function parseSubject(subject: string): ChangelogEntry | null {
  const match = /^(\w+)(?:\(([^)]*)\))?!?:/.exec(subject.trim());
  if (!match) return { section: "Changed", text: capitalize(subject.trim()) };
  const type = match[1].toLowerCase();
  const scope = match[2];
  const description = subject.trim().slice(match[0].length).trim();
  if (type === "wip" || (type === "feat" && /^wip\b/i.test(description))) return null;
  const section = SECTION_BY_TYPE[type] ?? "Changed";
  const text = scope ? `${formatScope(scope)}: ${description}` : capitalize(description);
  return { section, text };
}

export function addEntry(markdown: string, entry: ChangelogEntry): string {
  const eol = markdown.includes("\r\n") ? "\r\n" : "\n";
  const lines = markdown.split(eol);
  const start = lines.indexOf(UNRELEASED_HEADING);
  if (start === -1) throw new Error(`no "${UNRELEASED_HEADING}" section`);
  const nextVersion = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  const end = nextVersion === -1 ? lines.length : nextVersion;

  const bullet = `- ${entry.text}`;
  const heading = `### ${entry.section}`;
  const sectionStart = lines.findIndex((line, i) => i > start && i < end && line === heading);
  if (sectionStart !== -1) {
    const nextSection = lines.findIndex(
      (line, i) => i > sectionStart && i < end && line.startsWith("### "),
    );
    let last = (nextSection === -1 ? end : nextSection) - 1;
    while (lines[last] === "") last--;
    // A heading with no bullets yet keeps its blank line before the first one.
    const insert = last === sectionStart ? ["", bullet] : [bullet];
    lines.splice(last + 1, 0, ...insert);
    return lines.join(eol);
  }

  // A missing section goes in front of the first one that follows it in SECTIONS.
  const following = SECTIONS.slice(SECTIONS.indexOf(entry.section) + 1).map((s) => `### ${s}`);
  const before = lines.findIndex((line, i) => i > start && i < end && following.includes(line));
  let at = before === -1 ? end : before;
  while (before === -1 && lines[at - 1] === "") at--;
  const block = before === -1 ? ["", heading, "", bullet] : [heading, "", bullet, ""];
  lines.splice(at, 0, ...block);
  return lines.join(eol);
}

function main(subject: string, file: string) {
  const entry = parseSubject(subject);
  if (!entry) return;
  fs.writeFileSync(file, addEntry(fs.readFileSync(file).toString(), entry));
}

if (path.basename(process.argv[1] ?? "") === "changelog-entry.ts") {
  main(process.argv[2], process.argv[3]);
}
