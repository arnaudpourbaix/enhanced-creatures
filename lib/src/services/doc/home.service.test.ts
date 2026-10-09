import { describe, expect, it } from "vitest";
import homeService from "./home.service";

describe("render", () => {
  it("splits the markdown into a hero banner and one section per h2", () => {
    const html = homeService.render(
      "<main>{{home}}</main>",
      "# Title\n\nIntro\n\n## Install Order\n\nLate.\n\n## Credits\n\n- Salk\n",
    );

    expect(html).toContain('<section class="hero">\n<h1>Title</h1>\n<p>Intro</p>\n</section>');
    expect(html).toContain('<hr class="rule" />');
    expect(html).toContain('<section id="install-order">\n<h2>Install Order</h2>');
    expect(html).toContain('<section id="credits">');
    expect(html).toContain("<li>Salk</li>");
    expect(html).not.toContain("{{home}}");
  });

  it("omits the hero and rule when the markdown starts with an h2", () => {
    const html = homeService.render("{{home}}", "## About\n\nText\n");

    expect(html).not.toContain("hero");
    expect(html).not.toContain("<hr");
    expect(html).toContain('<section id="about">');
  });

  it("throws when the template has no {{home}} token", () => {
    expect(() => homeService.render("<main></main>", "# hi")).toThrow(
      /Token \{\{home\}\} not found/,
    );
  });

  it("preserves literal $ replacement-pattern sequences from the markdown content", () => {
    const html = homeService.render("{{home}}", "## Cost\n\n$1,000 and $& token");

    expect(html).toContain("<p>$1,000 and $&amp; token</p>");
  });
});
