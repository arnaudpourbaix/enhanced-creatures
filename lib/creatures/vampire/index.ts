import { SimpleEntry } from "../../src/model/creature/simple-entry";
import { EntryEnum } from "../entry";
import { bodhiVariant } from "./bodhi";
import {
  abominationVampire,
  ancientVampire,
  eminentVampire,
  fledglingVampire,
  matureVampire,
  oldVampire,
  patriarchVampire,
  veryOldVampire,
} from "./vampire";

export const createVampireEntry = () =>
  new SimpleEntry(EntryEnum.Vampire, [
    fledglingVampire,
    matureVampire,
    oldVampire,
    veryOldVampire,
    ancientVampire,
    eminentVampire,
    patriarchVampire,
    (entry) => bodhiVariant(abominationVampire(entry)),
  ]);
