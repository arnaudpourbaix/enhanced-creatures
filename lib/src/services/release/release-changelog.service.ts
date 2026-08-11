import * as fs from "fs";

const UNRELEASED_HEADING = "## [Unreleased]";

class ReleaseChangelogService {
  rollover(changelogPath: string, version: string, date: string): void {
    const content = fs.readFileSync(changelogPath, "utf-8");
    if (!content.includes(UNRELEASED_HEADING)) {
      throw new Error(`${changelogPath} has no "${UNRELEASED_HEADING}" section`);
    }
    const updated = content.replace(
      UNRELEASED_HEADING,
      `${UNRELEASED_HEADING}\n\n## [${version}] - ${date}`,
    );
    fs.writeFileSync(changelogPath, updated);
  }

  extractNotes(changelogPath: string, version: string): string {
    const heading = `## [${version}]`;
    const lines = fs.readFileSync(changelogPath, "utf-8").split("\n");
    const startIndex = lines.findIndex((line) => line.startsWith(heading));
    if (startIndex === -1) {
      throw new Error(`${changelogPath} has no "${heading}" section`);
    }
    let endIndex = lines.findIndex((line, i) => i > startIndex && line.startsWith("## "));
    if (endIndex === -1) endIndex = lines.length;
    return lines
      .slice(startIndex + 1, endIndex)
      .join("\n")
      .trim();
  }
}

const releaseChangelogService = new ReleaseChangelogService();
export default releaseChangelogService;
