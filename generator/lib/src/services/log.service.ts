import * as fs from "fs";
import * as path from "path";

class LogService {
  filePath = path.join(process.cwd(), "generator.log");
  enabled = false;
  private indent = "";
  private warningCount = 0;
  private errorCount = 0;

  init(): void {
    this.indent = "";
    this.warningCount = 0;
    this.errorCount = 0;
    this.enabled = true;
    fs.writeFileSync(this.filePath, "");
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

  warn(message: string): void {
    this.warningCount++;
    this.log(`warning: ${message}`);
  }

  error(message: string): void {
    this.errorCount++;
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
    fs.appendFileSync(this.filePath, `${line}\n`);
  }
}

const logService = new LogService();
export default logService;
