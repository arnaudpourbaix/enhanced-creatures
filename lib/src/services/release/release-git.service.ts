import childProcess from "child_process";
import * as path from "path";

class ReleaseGitService {
  repoRoot = path.resolve(__dirname, "..", "..", "..", "..");

  currentBranch(): string {
    return this.git(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  }

  isTreeClean(): boolean {
    return this.git(["status", "--porcelain"]).trim() === "";
  }

  isUpToDateWithRemote(branch: string): boolean {
    this.git(["fetch", "origin", branch]);
    const local = this.git(["rev-parse", branch]).trim();
    const remote = this.git(["rev-parse", `origin/${branch}`]).trim();
    return local === remote;
  }

  tagExistsAtHead(tag: string): boolean {
    const tagCommit = this.tryGit(["rev-parse", "--verify", `refs/tags/${tag}`]);
    if (tagCommit === null) return false;
    const head = this.git(["rev-parse", "HEAD"]).trim();
    return tagCommit.trim() === head;
  }

  stageReleaseFiles(): void {
    this.git(["add", "package.json", "mod"]);
  }

  commit(message: string): void {
    this.git(["commit", "-m", message]);
  }

  tagRelease(tag: string, message: string): void {
    this.git(["tag", "-a", tag, "-m", message]);
  }

  push(branch: string): void {
    this.git(["push", "origin", branch, "--follow-tags"]);
  }

  private git(args: string[]): string {
    // "git" is resolved from PATH deliberately - this wraps the user's own git installation
    // for a local release CLI, not an untrusted/attacker-controlled PATH scenario.
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    return childProcess.execFileSync("git", args, { cwd: this.repoRoot, encoding: "utf-8" });
  }

  private tryGit(args: string[]): string | null {
    try {
      return this.git(args);
    } catch {
      return null;
    }
  }
}

const releaseGitService = new ReleaseGitService();
export default releaseGitService;
