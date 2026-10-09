import * as fs from "fs";
import * as path from "path";

interface LogSection {
  lines: string[];
  /** Owned by a key (commitCapture(key)/withSection()); writes outside withSection() never join it. */
  keyed: boolean;
  /** Length of the header-only start withSection() gives a new section, so it can be dropped if left untouched. */
  placeholderLength: number;
}

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
  private deferring = false;
  private sections: LogSection[] = [];
  private keyedSections = new Map<object, LogSection>();
  private activeSection?: LogSection;

  init(): void {
    this.indent = "";
    this.warningCount = 0;
    this.errorCount = 0;
    this.deferring = false;
    this.sections = [];
    this.keyedSections.clear();
    this.activeSection = undefined;
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

  /**
   * Flush the captured lines, keeping their warn()/error() counts in the summary. With a `key`
   * while deferring, they become that key's section, which withSection() can add to later.
   */
  commitCapture(key?: object): void {
    if (!this.capturing) return;
    const lines = this.captureBuffer;
    this.capturing = false;
    this.captureBuffer = [];
    if (key && this.deferring) {
      const section: LogSection = { lines, keyed: true, placeholderLength: 0 };
      this.sections.push(section);
      this.keyedSections.set(key, section);
      return;
    }
    for (const line of lines) this.emit(line);
  }

  /**
   * Hold every write in memory until flushSections(), so a later pass can add lines to a section
   * committed earlier (see withSection()). Used per family, so a creature's generation errors land
   * in its own "Creating ..." section instead of under the family's last created creature.
   */
  beginDeferred(): void {
    this.deferring = true;
    this.sections = [];
    this.keyedSections.clear();
  }

  /**
   * Run `fn` with its writes appended to `key`'s section. A key with no section yet (e.g. its
   * capture was discarded) gets one headed by `title`, dropped at flush if nothing was added.
   * Without beginDeferred(), `fn` just runs and writes in place.
   */
  withSection<R>(key: object, title: string, fn: () => R): R {
    if (!this.deferring) return fn();
    let section = this.keyedSections.get(key);
    if (!section) {
      section = { lines: ["", title], keyed: true, placeholderLength: 2 };
      this.sections.push(section);
      this.keyedSections.set(key, section);
    }
    const previousSection = this.activeSection;
    const previousIndent = this.indent;
    this.activeSection = section;
    this.indent = "    ";
    try {
      return fn();
    } finally {
      this.activeSection = previousSection;
      this.indent = previousIndent;
    }
  }

  /** Write the deferred sections to the file, in the order they were first written. */
  flushSections(): void {
    if (!this.deferring) return;
    this.deferring = false;
    this.activeSection = undefined;
    for (const section of this.sections) {
      if (section.lines.length === section.placeholderLength) continue;
      for (const line of section.lines) this.appendLine(line);
    }
    this.sections = [];
    this.keyedSections.clear();
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
    this.emit(line);
  }

  private emit(line: string): void {
    if (!this.deferring) {
      this.appendLine(line);
      return;
    }
    let section = this.activeSection ?? this.sections.at(-1);
    // Lines written outside withSection() start an anonymous section after a keyed one, keeping
    // their place in the overall order.
    if (!section || (!this.activeSection && section.keyed)) {
      section = { lines: [], keyed: false, placeholderLength: 0 };
      this.sections.push(section);
    }
    section.lines.push(line);
  }

  private appendLine(line: string): void {
    fs.appendFileSync(this.filePath, `${line}\n`);
  }
}

const logService = new LogService();
export default logService;
