import { CreatureScriptEdit } from "../../src/model/creature/data";
import { EffectStatisticModifierEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Golem, GolemIds, BAF_CONTINUE } from "./kin";

class SnowGolemEntry extends CreatureEntry<Golem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.SnowGolem, kin);
    this.addCreature(() => this.snow());
  }

  createCreature(id: MonsterEnum): Golem {
    return new Golem(id);
  }

  /**
   * Snow Golem
   */
  private snow() {
    const edits: CreatureScriptEdit[] = [
      {
        files: ["gorgoli"],
        replaces: [["ReallyForceSpell(NearestEnemyOf(Myself),WIZARD_CONE_OF_COLD)", BAF_CONTINUE]],
      },
    ];
    const snow = this.create({
      monster: MonsterEnum.SnowGolem,
      name: "monster.golem.name.snow",
      files: [],
      data: {
        level1: 12,
        strength: 19,
        dexterity: 6,
        constitution: 14,
        intelligence: 3,
        wisdom: 6,
        charisma: 1,
        ac: 1,
        apr: 2,
        xpv: 7000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        gender: "NIETHER",
        animation: "GOLEM_ICE",
        size: { value: "Large", tall: true, long: false },
        movement: 9,
        immunities: ["construct"],
        items: {
          remove: [
            "UBSNORNG",
            "UBSNOFST",
            "B2-24M3",
            "IMMUNE1",
            "IMMUNE3",
            "GOLSTONE",
            "IMMCHS",
            "IRONGOL",
            "GOLIRO",
            "INVULNER",
            "GORMISTI",
          ],
        },
        script: {
          remove: ["GOLICE01"],
          edits,
        },
      },
    });
    snow.addTrait({
      immunities: ["plusOneWeapons", "lightning"],
      effects: [
        {
          opcode: EffectTypeEnum.ColdResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
        {
          opcode: EffectTypeEnum.MagicalColdResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    snow.createConeOfCold();
    edits.push({
      files: ["ubsnogol"],
      replaces: [
        [
          `ForceSpellRES("UBSNOBR",LastSeenBy(Myself))`,
          `ForceSpellRES("${this.spell(GolemIds.ConeOfCold).file}",LastSeenBy(Myself))`,
        ],
      ],
    });
    snow.createFists({ diceThrown: 2, diceSize: 12 });
    snow.setBehavior({
      restHeal: true,
      abilities: [this.ability(GolemIds.ConeOfCold)],
    });
    snow.setAdjustments([
      { files: ["D9LICE01", "GOLICE01", "WQXGOL"], data: { level1: 20, xpv: 12000 } },
      { files: ["GORGOLI"], data: { level1: 18 } },
    ]);
    return snow;
  }
}

export const createSnowGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new SnowGolemEntry(kins.get(KinEnum.Golem));
