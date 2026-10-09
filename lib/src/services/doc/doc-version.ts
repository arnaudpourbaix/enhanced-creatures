import * as path from "path";
import { State } from "../../state";
import releaseVersionFilesService from "../release/release-version-files.service";

// Every docs page shows the mod version next to the brand in its nav header ({{version}} token),
// so players can tell at a glance which release the docs they're reading describe. The tp2's
// VERSION is the source: it's what WeiDU reports for the installed mod, and the release flow bumps
// it before regenerating the docs.
export function readModVersion(): string {
  return releaseVersionFilesService.readTp2Version(
    path.join(State.modFolder, "enhanced_creatures.tp2"),
  );
}

export function stampVersion(html: string, version: string): string {
  const key = "{{version}}";
  if (!html.includes(key)) throw new Error(`Token ${key} not found !`);
  return html.split(key).join(version);
}
