import * as fs from "fs";
import * as path from "path";
import { marked } from "marked";
import { State } from "../../state";
import logService from "../log.service";
import utils from "../utils/utils.service";

class ChangelogService {
  generate() {
    logService.log("Generating changelog documentation");
    const changelogPath = path.join(State.modFolder, "CHANGELOG.md");
    let markdown: string;
    try {
      markdown = fs.readFileSync(changelogPath).toString();
    } catch (e) {
      throw new Error(`Failed to read ${changelogPath}`, { cause: e });
    }
    let templateText: string;
    try {
      templateText = fs.readFileSync("lib/templates/changelog.html").toString();
    } catch (e) {
      throw new Error(`Failed to read template lib/templates/changelog.html`, {
        cause: e,
      });
    }
    const html = this.render(templateText, markdown);
    try {
      utils.writeFile("docs/changelog.html", html);
    } catch (e) {
      throw new Error(`Failed to write documentation to docs/changelog.html`, {
        cause: e,
      });
    }
  }

  render(templateText: string, markdown: string): string {
    const template = { text: templateText };
    this.replace(template, "changelog", marked.parse(markdown) as string);
    return template.text;
  }

  private replace(template: { text: string }, key: string, value: string) {
    key = `{{${key}}}`;
    if (!template.text.includes(key)) throw new Error(`Token ${key} not found !`);
    template.text = template.text.replace(new RegExp(key, "g"), value);
  }
}

const changelogService = new ChangelogService();
export default changelogService;
