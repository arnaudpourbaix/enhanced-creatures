import * as fs from "fs";
import * as path from "path";

class LogService {
  filePath = path.join(process.cwd(), "generator.log");
  enabled = false;
  private indent = "";
  private warningCount = 0;
  private errorCount = 0;
  private capturing = false;
  private captureBuffer: string[] = [];
  private capturedWarningCount = 0;
  private capturedErrorCount = 0;

  init(): void {
    this.indent = "";
    this.warningCount = 0;
    this.errorCount = 0;
    this.enabled = true;
    fs.writeFileSync(this.filePath, "");
  }

  /**
   * Start buffering subsequent writes instead of appending them to the file. Used by
   * CreatureFamily.addCreature() to hold a creature's whole log section until validation is
   * known, so it can discardCapture() the section entirely for creatures with nothing to fix
   * (e.g. no files at all) rather than logging noise about them on every run.
   */
  beginCapture(): void {
    this.capturing = true;
    this.captureBuffer = [];
    this.capturedWarningCount = 0;
    this.capturedErrorCount = 0;
  }

  /** Flush the captured lines to the file, keeping their warn()/error() counts in the summary. */
  commitCapture(): void {
    if (!this.capturing) return;
    const lines = this.captureBuffer;
    this.capturing = false;
    this.captureBuffer = [];
    for (const line of lines) this.appendLine(line);
  }

  /** Drop the captured lines entirely, undoing any warn()/error() counts they contributed. */
  discardCapture(): void {
    if (!this.capturing) return;
    this.warningCount -= this.capturedWarningCount;
    this.errorCount -= this.capturedErrorCount;
    this.capturing = false;
    this.captureBuffer = [];
  }

  section(title: string): void {
    this.indent = "";
    this.write("");
    this.write(title);
    this.write("-".repeat(title.length));
  }

  header(title: string): void {
    this.write("");
    this.write(title);
    this.indent = "    ";
  }

  log(message: string): void {
    for (const line of message.split("\n")) {
      this.write(`${this.indent}${line}`);
    }
  }

  info(message: string): void {
    this.log(`info: ${message}`);
  }

  warn(message: string): void {
    this.warningCount++;
    if (this.capturing) this.capturedWarningCount++;
    this.log(`warning: ${message}`);
  }

  error(message: string): void {
    this.errorCount++;
    if (this.capturing) this.capturedErrorCount++;
    this.log(`error: ${message}`);
  }

  hasErrors(): boolean {
    return this.errorCount > 0;
  }

  summary(): void {
    this.section("Summary");
    if (this.errorCount === 0) this.log("No errors");
    else if (this.errorCount === 1) this.log("1 error");
    else this.log(`${this.errorCount} errors`);
    if (this.warningCount === 0) this.log("No warnings");
    else if (this.warningCount === 1) this.log("1 warning");
    else this.log(`${this.warningCount} warnings`);
  }

  private write(line: string): void {
    if (!this.enabled) return;
    if (this.capturing) {
      this.captureBuffer.push(line);
      return;
    }
    this.appendLine(line);
  }

  private appendLine(line: string): void {
    fs.appendFileSync(this.filePath, `${line}\n`);
  }
}

const logService = new LogService();
export default logService;
