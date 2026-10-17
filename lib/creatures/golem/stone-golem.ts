import { SPELLS } from "../../config/spells/spell-database";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Golem, BAF_CONTINUE } from "./kin";

class StoneGolemEntry extends CreatureEntry<Golem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.StoneGolem, kin, MonsterFamilyEnum.Golem);
    this.addCreature(() => this.stone());
    this.addCreature(() => this.lesserStone());
  }

  createCreature(id: MonsterEnum): Golem {
    return new Golem(id);
  }

  /**
   * Stone Golem
   */
  private stone() {
    const stone = this.create({
      monster: MonsterEnum.StoneGolem,
      name: "monster.golem.name.stone",
      files: [],
      data: {
        level1: 14,
        strength: 22,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: 5,
        apr: 1,
        xpv: 8000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        gender: "NIETHER",
        size: { value: "Large", tall: true, long: false },
        movement: 6,
        immunities: ["construct"],
        items: {
          remove: ["GOLFLE", "GOLSTO", "GOLSTONE", "IMMUNE2", "IMMUNE1", "HELMNOAN", "B3-24"],
        },
        script: {
          remove: ["GOLSTO01", "OHBNONIN"],
        },
        spells: {
          memorized: [{ file: SPELLS.Wizard.Slow.file, memorizedCount: 1 }],
        },
      },
    });
    stone.addTrait({
      immunities: ["magic", "plusOneWeapons"],
    });
    stone.createFists({ diceThrown: 3, diceSize: 8 });
    stone.setBehavior({
      restHeal: true,
      abilities: [
        {
          preset: SPELLS.Wizard.Slow.file,
          spell: {
            type: "reallyForce",
            castOnSelf: true,
            remove: true,
          },
          requireVocal: false,
          range: 10,
          timer: { name: "Slow", value: 12 },
        },
      ],
    });
    return stone;
  }

  /**
   * Lesser Stone Golem
   */
  private lesserStone() {
    const lesserStone = this.createFrom({
      from: this.creature(MonsterEnum.StoneGolem),
      monster: MonsterEnum.LesserStoneGolem,
      name: "monster.golem.name.lesserStone",
    });
    lesserStone.setData({
      level1: 10,
      strength: 20,
      xpv: 4000,
      script: {
        edits: [
          {
            files: ["bdpetsg", "bdpetsgs"],
            replaces: [["ReallyForceSpell(Myself,GOLEM_SLOW)", BAF_CONTINUE]],
          },
        ],
      },
    });
    lesserStone.setAdjustments([
      { files: ["ARGHH", "UGHH"], data: { level1: 14, strength: 22, xpv: 6000 } },
    ]);
    return lesserStone;
  }
}

export const createStoneGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new StoneGolemEntry(kins.get(KinEnum.Golem));
