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

  it("preserves literal $ replacement-pattern sequences from the markdown content", () => {
    const html = changelogService.render(
      "<main>{{changelog}}</main>",
      "Fixed cost for $1,000 and the $& token",
    );

    expect(html).toContain("<p>Fixed cost for $1,000 and the $&amp; token</p>");
  });
});
