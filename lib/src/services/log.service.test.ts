import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import logService from "./log.service";

const CREATING_OGRE = "Creating Ogre...";
const NO_ERRORS_NO_WARNINGS_SUMMARY = "\nSummary\n-------\nNo errors\nNo warnings\n";

describe("LogService", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-log-"));
    logService.filePath = path.join(tempDir, "generator.log");
    logService.enabled = false;
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function readLog(): string {
    return fs.readFileSync(logService.filePath, "utf-8");
  }

  it("writes nothing before init() has been called", () => {
    logService.log("should not be written");
    logService.section("should not be written either");
    expect(fs.existsSync(logService.filePath)).toBe(false);
  });

  it("init creates an empty file and enables writes", () => {
    logService.init();
    expect(readLog()).toBe("");
  });

  it("init truncates a file left over from a previous run", () => {
    fs.writeFileSync(logService.filePath, "stale content from a previous run\n");
    logService.init();
    expect(readLog()).toBe("");
  });

  it("log writes a plain line with no indent right after init", () => {
    logService.init();
    logService.log("Checking cdogr, spell found: null");
    expect(readLog()).toBe("Checking cdogr, spell found: null\n");
  });

  it("section writes a blank line, the title, and a matching underline", () => {
    logService.init();
    const title = "Generating creatures";
    logService.section(title);
    expect(readLog()).toBe(`\n${title}\n${"-".repeat(title.length)}\n`);
  });

  it("header writes a blank line then the title, and indents subsequent log lines", () => {
    logService.init();
    logService.header(CREATING_OGRE);
    logService.log("dual wielding detected");
    expect(readLog()).toBe(`\n${CREATING_OGRE}\n    dual wielding detected\n`);
  });

  it("section resets the indent back to top-level after a header", () => {
    logService.init();
    logService.header(CREATING_OGRE);
    logService.log("dual wielding detected");
    const title = "Generating common code";
    logService.section(title);
    logService.log("writing core.tpa");
    expect(readLog()).toBe(
      `\n${CREATING_OGRE}\n    dual wielding detected\n\n${title}\n${"-".repeat(
        title.length,
      )}\nwriting core.tpa\n`,
    );
  });

  it("log indents every line of a multi-line message", () => {
    logService.init();
    logService.header(CREATING_OGRE);
    logService.log("line one\nline two");
    expect(readLog()).toBe(`\n${CREATING_OGRE}\n    line one\n    line two\n`);
  });

  it("warn writes the message prefixed with 'warning: ' (indent-prefixed by the current context)", () => {
    logService.init();
    logService.header(CREATING_OGRE);
    logService.warn("something looks off");
    expect(readLog()).toBe(`\n${CREATING_OGRE}\n    warning: something looks off\n`);
  });

  it("warn increments the warning count while log does not", () => {
    logService.init();
    logService.log("informational line");
    logService.warn("a warning");
    logService.summary();
    expect(readLog()).toBe(
      "informational line\nwarning: a warning\n\nSummary\n-------\nNo errors\n1 warning\n",
    );
  });

  it("summary reports no warnings when none were logged", () => {
    logService.init();
    logService.summary();
    expect(readLog()).toBe(NO_ERRORS_NO_WARNINGS_SUMMARY);
  });

  it("summary reports a plural warning count", () => {
    logService.init();
    logService.warn("first warning");
    logService.warn("second warning");
    logService.summary();
    expect(readLog()).toBe(
      "warning: first warning\nwarning: second warning\n\nSummary\n-------\nNo errors\n2 warnings\n",
    );
  });

  it("init resets the warning count across runs", () => {
    logService.init();
    logService.warn("first run warning");
    logService.init();
    logService.summary();
    expect(readLog()).toBe(NO_ERRORS_NO_WARNINGS_SUMMARY);
  });

  it("error writes the message prefixed with 'error: ' (indent-prefixed by the current context)", () => {
    logService.init();
    logService.header(CREATING_OGRE);
    logService.error("something is definitely broken");
    expect(readLog()).toBe(`\n${CREATING_OGRE}\n    error: something is definitely broken\n`);
  });

  it("error increments the error count while log does not", () => {
    logService.init();
    logService.log("informational line");
    logService.error("an error");
    logService.summary();
    expect(readLog()).toBe(
      "informational line\nerror: an error\n\nSummary\n-------\n1 error\nNo warnings\n",
    );
  });

  it("summary reports a plural error count", () => {
    logService.init();
    logService.error("first error");
    logService.error("second error");
    logService.summary();
    expect(readLog()).toBe(
      "error: first error\nerror: second error\n\nSummary\n-------\n2 errors\nNo warnings\n",
    );
  });

  it("init resets the error count across runs", () => {
    logService.init();
    logService.error("first run error");
    logService.init();
    logService.summary();
    expect(readLog()).toBe(NO_ERRORS_NO_WARNINGS_SUMMARY);
  });

  it("hasErrors is false when no errors were logged", () => {
    logService.init();
    logService.warn("just a warning");
    expect(logService.hasErrors()).toBe(false);
  });

  it("hasErrors is true after at least one error was logged", () => {
    logService.init();
    logService.error("something is definitely broken");
    expect(logService.hasErrors()).toBe(true);
  });

  it("init resets hasErrors across runs", () => {
    logService.init();
    logService.error("first run error");
    logService.init();
    expect(logService.hasErrors()).toBe(false);
  });
});
