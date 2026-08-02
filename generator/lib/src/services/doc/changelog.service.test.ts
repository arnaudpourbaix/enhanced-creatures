import { describe, expect, it } from "vitest";
import changelogService from "./changelog.service";

describe("render", () => {
  it("converts markdown headings and lists into the {{changelog}} slot", () => {
    const html = changelogService.render(
      "<main>{{changelog}}</main>",
      "## [Unreleased]\n\n### Added\n\n- Initial release\n",
    );

    expect(html).toContain("<main>");
    expect(html).toContain("<h2>[Unreleased]</h2>");
    expect(html).toContain("<h3>Added</h3>");
    expect(html).toContain("<li>Initial release</li>");
    expect(html).not.toContain("{{changelog}}");
  });

  it("throws when the template has no {{changelog}} token", () => {
    expect(() => changelogService.render("<main></main>", "# hi")).toThrow(
      /Token \{\{changelog\}\} not found/,
    );
  });
});
