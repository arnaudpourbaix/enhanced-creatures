import { describe, expect, it } from "vitest";
import { extractStderr } from "./process.utils";

const COMMAND_FAILED = "Command failed";

describe("extractStderr", () => {
  it("returns the trimmed text of a Buffer stderr", () => {
    const error = Object.assign(new Error(COMMAND_FAILED), {
      stderr: Buffer.from("npm ERR! code E404\n"),
    });

    expect(extractStderr(error)).toBe("npm ERR! code E404");
  });

  it("returns the trimmed text of a string stderr", () => {
    const error = Object.assign(new Error(COMMAND_FAILED), { stderr: "  boom  " });

    expect(extractStderr(error)).toBe("boom");
  });

  it("returns undefined when stderr is empty or whitespace only", () => {
    const error = Object.assign(new Error(COMMAND_FAILED), { stderr: Buffer.from("  \n") });

    expect(extractStderr(error)).toBeUndefined();
  });

  it("returns undefined when the error carries no stderr", () => {
    expect(extractStderr(new Error(COMMAND_FAILED))).toBeUndefined();
  });

  it("returns undefined for non-object throwables", () => {
    expect(extractStderr("boom")).toBeUndefined();
    expect(extractStderr(null)).toBeUndefined();
  });

  it("returns undefined when stderr is neither a Buffer nor a string", () => {
    const error = Object.assign(new Error(COMMAND_FAILED), { stderr: 42 });

    expect(extractStderr(error)).toBeUndefined();
  });
});
