import { CodeLine } from "../model/misc";

export class AbstractCodeService {
  protected initLines() {
    const lines: CodeLine[] = [];
    this.add(lines, "// Generated file (don't edit)");
    this.add(lines, "");
    return lines;
  }

  protected add(lines: CodeLine[], code: string, tab?: number) {
    tab ??= lines.length ? lines[lines.length - 1].tab : 0;
    lines.push({ tab, code });
  }
}
