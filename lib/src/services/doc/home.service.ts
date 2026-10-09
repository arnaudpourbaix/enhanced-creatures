import * as fs from "fs";
import { marked } from "marked";
import logService from "../log.service";
import { readModVersion, stampVersion } from "./doc-version";
import utils from "../utils/utils.service";

// Player documentation is authored in PLAYER.md (repo root) and rendered into docs/index.html,
// which is both the mod's README (see the tp2) and the GitHub Pages home page.
class HomeService {
  generate() {
    logService.log("Generating home documentation");
    let markdown: string;
    try {
      markdown = fs.readFileSync("PLAYER.md").toString();
    } catch (e) {
      throw new Error(`Failed to read PLAYER.md`, { cause: e });
    }
    let templateText: string;
    try {
      templateText = fs.readFileSync("lib/templates/home.html").toString();
    } catch (e) {
      throw new Error(`Failed to read template lib/templates/home.html`, {
        cause: e,
      });
    }
    const html = stampVersion(this.render(templateText, markdown), readModVersion());
    try {
      utils.writeFile("docs/index.html", html);
    } catch (e) {
      throw new Error(`Failed to write documentation to docs/index.html`, {
        cause: e,
      });
    }
  }

  render(templateText: string, markdown: string): string {
    const template = { text: templateText };
    this.replace(template, "home", this.toSections(marked.parse(markdown) as string));
    return template.text;
  }

  // Everything before the first <h2> is the hero banner; each <h2> then opens its own <section>
  // (id slugged from the heading so it can be linked, e.g. index.html#install).
  toSections(html: string): string {
    const chunks = html.split(/(?=<h2>)/);
    const hero = chunks[0].startsWith("<h2>") ? "" : chunks[0];
    const rest = hero ? chunks.slice(1) : chunks;
    const parts: string[] = [];
    if (hero.trim()) parts.push(`<section class="hero">\n${hero.trim()}\n</section>`);
    if (hero.trim() && rest.length) parts.push(`<hr class="rule" />`);
    for (const section of rest) {
      const title = /<h2>(.*?)<\/h2>/.exec(section)?.[1] ?? "";
      parts.push(`<section id="${this.slug(title)}">\n${section.trim()}\n</section>`);
    }
    return parts.join("\n\n");
  }

  private slug(title: string): string {
    return title
      .replace(/<\/?[a-z]+>/g, "")
      .replace(/&[a-z]+;/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .join("-");
  }

  private replace(template: { text: string }, key: string, value: string) {
    key = `{{${key}}}`;
    if (!template.text.includes(key)) throw new Error(`Token ${key} not found !`);
    template.text = template.text.split(key).join(value);
  }
}

const homeService = new HomeService();
export default homeService;
