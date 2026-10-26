import { SimpleEntry } from "../../src/model/creature/simple-entry";
import { EntryEnum } from "../entry";
import { abominationVampire } from "./bodhi";
import {
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
    abominationVampire,
  ]);
