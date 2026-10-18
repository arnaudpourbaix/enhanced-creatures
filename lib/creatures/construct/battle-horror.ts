import { SPELLS } from "../../config/spells/spell-database";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { builtBefore, CreatureKin, kinOf } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Construct, ConstructKin } from "./kin";

class BattleHorrorEntry extends CreatureEntry<Construct> {
  constructor(private readonly constructKin?: ConstructKin) {
    super(EntryEnum.BattleHorror, constructKin);
    this.addCreature(() => {
      const creature = this.battleHorror();
      if (this.constructKin) this.constructKin.battleHorror = creature;
      return creature;
    });
  }

  createCreature(id: MonsterEnum): Construct {
    return new Construct(id);
  }

  /**
   * Battle Horror
   */
  private battleHorror() {
    const battleHorror = this.createFrom({
      name: "monster.construct.name.battleHorror",
      monster: MonsterEnum.BattleHorror,
      from: builtBefore(this.constructKin?.helmedHorror, "Helmed Horror"),
      files: [],
    });
    battleHorror.setData({
      level1: 8,
      level2: 3, // for magic missiles as a level 3 wizard
      bonusHp: 11,
      strength: 20,
      class: "FIGHTER_MAGE",
      alignment: "LAWFUL_EVIL",
      xpv: 4000,
      items: {
        remove: ["SW1H11"],
      },
      spells: {
        memorized: [
          { file: SPELLS.Wizard.MagicMissiles.file, memorizedCount: 1 },
          { file: SPELLS.Wizard.DimensionDoor.file, memorizedCount: 1 },
        ],
      },
    });
    battleHorror.setBehavior({
      abilities: [
        {
          preset: SPELLS.Wizard.MagicMissiles.file,
          spell: {
            type: "noDec",
          },
          triggers: [{ name: "Range", params: ["NearestEnemyOf", 10], negation: true }],
          requireVocal: false,
          timer: { name: "MagicMissiles", value: 18 },
        },
      ],
      customCodes: [
        {
          location: "trackTargets",
          type: "insertBefore",
          abilities: [
            {
              preset: SPELLS.Wizard.DimensionDoor.file,
              range: 180,
              requireVocal: false,
            },
          ],
        },
      ],
    });
    return battleHorror;
  }
}

export const createBattleHorrorEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new BattleHorrorEntry(kinOf(kins, KinEnum.Construct, ConstructKin)).requires(
    EntryEnum.HelmedHorror,
  );
