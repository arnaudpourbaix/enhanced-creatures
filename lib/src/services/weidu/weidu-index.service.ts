import { ENTRY_FOLDERS, EntryEnum } from "../../../creatures/entry";
import { KIN_FOLDERS, KinEnum } from "../../../creatures/kin";
import { CR } from "../../model/constants";
import utils from "../utils/utils.service";

const INDEX_FOLDER = "lib/pnp-monster";

/**
 * Writes `lib/pnp-monster/index.tpa` (INCLUDE every kin's main.tpa, then every entry's, in the
 * given registry order) and `lib/pnp-monster/index.json` (entry folder -> its kin folder or null
 * and the folders of the entries it depends on, read by `copy`).
 */
class WeiduIndexService {
  generate(kins: KinEnum[], entries: { id: EntryEnum; kin?: KinEnum; dependsOn?: EntryEnum[] }[]) {
    const folders = [
      ...kins.map((kin) => utils.getKinFolder(kin)),
      ...entries.map((entry) => utils.getEntryFolder(entry.id)),
    ];
    utils.writeFile(
      `${INDEX_FOLDER}/index.tpa`,
      folders.map((folder) => `INCLUDE "%MOD_FOLDER%/${folder}/main.tpa"${CR}`).join(""),
    );
    const map = Object.fromEntries(
      entries.map((e) => [
        ENTRY_FOLDERS[e.id],
        {
          kin: e.kin === undefined ? null : KIN_FOLDERS[e.kin],
          dependsOn: (e.dependsOn ?? []).map((id) => ENTRY_FOLDERS[id]),
        },
      ]),
    );
    utils.writeFile(`${INDEX_FOLDER}/index.json`, `${JSON.stringify(map, null, 2)}\n`);
  }
}

const weiduIndexService = new WeiduIndexService();
export default weiduIndexService;
