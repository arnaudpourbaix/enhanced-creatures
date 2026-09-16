import childProcess from "child_process";
import * as path from "path";

export type RemoteSyncStatus = "up-to-date" | "ahead" | "behind" | "diverged";

class ReleaseGitService {
  repoRoot = path.resolve(__dirname, "..", "..", "..", "..");

  currentBranch(): string {
    return this.git(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  }

  isTreeClean(): boolean {
    return this.git(["status", "--porcelain"]).trim() === "";
  }

  isUpToDateWithRemote(branch: string): RemoteSyncStatus {
    this.git(["fetch", "origin", branch]);
    const local = this.git(["rev-parse", branch]).trim();
    const remote = this.git(["rev-parse", `origin/${branch}`]).trim();
    if (local === remote) return "up-to-date";

    const ahead = Number(this.git(["rev-list", "--count", `origin/${branch}..${branch}`]).trim());
    const behind = Number(this.git(["rev-list", "--count", `${branch}..origin/${branch}`]).trim());
    if (ahead > 0 && behind === 0) return "ahead";
    if (behind > 0 && ahead === 0) return "behind";
    return "diverged";
  }

  tagExistsAtHead(tag: string): boolean {
    const tagCommit = this.tryGit(["rev-parse", "--verify", `refs/tags/${tag}`]);
    if (tagCommit === null) return false;
    const head = this.git(["rev-parse", "HEAD"]).trim();
    return tagCommit.trim() === head;
  }

  // Whether the tag has actually reached origin. `tagExistsAtHead` only proves a local
  // `git tag` ran - if the push after it failed, the tag exists locally but origin never got it,
  // and the release still needs pushing. `ls-remote` exits 0 with empty output when nothing
  // matches, so an empty result means "not pushed"; a real failure (network/auth) throws rather
  // than being silently mistaken for "not pushed".
  tagExistsOnRemote(tag: string): boolean {
    return this.git(["ls-remote", "--tags", "origin", `refs/tags/${tag}`]).trim() !== "";
  }

  stageReleaseFiles(): void {
    this.git(["add", "package.json", "package-lock.json", "mod"]);
  }

  // Throw away every working-tree change under mod/, restoring it to HEAD. Used after the
  // release zip has been built from a flag-on regeneration (enableRandomTargetOrder /
  // enableSecondaryTypes) so that churn - shuffled .baf files, integrate_sectypes lines - never
  // reaches a commit and the post-push tree stays clean.
  restoreModTree(): void {
    this.git(["checkout", "--", "mod"]);
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
