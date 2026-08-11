import childProcess from "child_process";
import fs from "fs";
import * as os from "os";
import * as path from "path";
import { extractStderr } from "../utils/process.utils";

class ReleaseGithubService {
  checkAuth(): void {
    try {
      // "gh" is resolved from PATH deliberately - this wraps the user's own GitHub CLI
      // installation for a local release CLI, not an untrusted/attacker-controlled PATH scenario.
      // eslint-disable-next-line sonarjs/no-os-command-from-path
      childProcess.execFileSync("gh", ["auth", "status"], { stdio: "pipe" });
    } catch (e: unknown) {
      throw new Error(
        "GitHub CLI is not installed or not authenticated - install gh and run `gh auth login` first",
        { cause: e },
      );
    }
  }

  publishRelease(tag: string, zipPath: string, notes: string): void {
    const notesFile = path.join(os.tmpdir(), `${tag}-notes.md`);
    fs.writeFileSync(notesFile, notes);
    try {
      childProcess.execFileSync(
        // "gh" is resolved from PATH deliberately - see checkAuth() above.
        // eslint-disable-next-line sonarjs/no-os-command-from-path
        "gh",
        ["release", "create", tag, zipPath, "--title", tag, "--notes-file", notesFile],
        { stdio: "pipe" },
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      const stderr = extractStderr(e);
      throw new Error(stderr ? `${message}: ${stderr}` : message, { cause: e });
    } finally {
      fs.rmSync(notesFile, { force: true });
    }
  }
}

const releaseGithubService = new ReleaseGithubService();
export default releaseGithubService;
