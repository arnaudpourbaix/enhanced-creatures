import childProcess from "child_process";
import fs from "fs";
import * as os from "os";
import * as path from "path";

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
      const stderr = this.extractStderr(e);
      throw new Error(stderr ? `${message}: ${stderr}` : message, { cause: e });
    } finally {
      fs.rmSync(notesFile, { force: true });
    }
  }

  // execFileSync with stdio: "pipe" captures gh's stderr onto the thrown error as `.stderr`
  // (a Buffer, since no `encoding` option is set), but Node doesn't fold it into `.message` -
  // without this it's silently dropped and all gh failures look like a generic "Command failed".
  private extractStderr(e: unknown): string | undefined {
    if (typeof e !== "object" || e === null || !("stderr" in e)) return undefined;
    const stderr = (e as { stderr?: unknown }).stderr;
    if (Buffer.isBuffer(stderr)) return stderr.toString("utf-8").trim() || undefined;
    if (typeof stderr === "string") return stderr.trim() || undefined;
    return undefined;
  }
}

const releaseGithubService = new ReleaseGithubService();
export default releaseGithubService;
