// execFileSync with stdio: "pipe" captures the child process's stderr onto the thrown error as
// `.stderr` (a Buffer when no `encoding` option is set, a string when there is one), but Node
// doesn't fold it into `.message` - without this it's silently dropped and every failure looks
// like a generic "Command failed".
export function extractStderr(e: unknown): string | undefined {
  if (typeof e !== "object" || e === null || !("stderr" in e)) return undefined;
  const stderr = (e as { stderr?: unknown }).stderr;
  if (Buffer.isBuffer(stderr)) return stderr.toString("utf-8").trim() || undefined;
  if (typeof stderr === "string") return stderr.trim() || undefined;
  return undefined;
}
