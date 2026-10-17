import {
  CastSpellOnConditionTargetEnum,
  EffectDispelResistanceEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Fey, FeyIds } from "./kin";

class NereidEntry extends CreatureEntry<Fey> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Nereid, kin);
    this.addCreature(() => this.nereid());
  }

  createCreature(id: MonsterEnum): Fey {
    return new Fey(id);
  }

  /**
   * Nereid
   */
  private nereid() {
    const nereid = this.create({
      monster: MonsterEnum.Nereid,
      name: "monster.fey.name.nereid",
      data: {
        level1: 4,
        strength: 9,
        dexterity: 17,
        constitution: 12,
        intelligence: 12,
        wisdom: 12,
        charisma: 18,
        ac: 10,
        apr: 0,
        xpv: 975,
        alignment: "CHAOTIC_NEUTRAL",
        morale: 11,
        general: "HUMANOID",
        race: "FAIRY",
        class: "FAIRY_NEREID",
        gender: "FEMALE",
        size: { value: "Medium", tall: true, long: false },
        movement: 12,
        immunities: ["fey"],
        items: {
          remove: ["WALLPASS", "DAGG01"],
        },
        script: {
          remove: ["BDNEREID", "ULENE"],
        },
      },
    });
    nereid.createAttackEvasion();
    nereid.addTrait({
      description: "monster.fey.trait.nereid",
      immunities: ["magicResistance"],
      effects: [
        {
          opcode: EffectTypeEnum.CastSpellOnCondition,
          condition: "AttackedBy([ANYONE])",
          conditionTarget: CastSpellOnConditionTargetEnum.Myself,
          resource: this.spell(FeyIds.AttackEvasion).file,
          dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
        },
      ],
    });
    nereid.createBeguilingAura();
    nereid.createDrowningKiss();
    nereid.createVenomSpit();
    nereid.createSummonGiantPoisonousSnake();
    nereid.createWateryFist();
    nereid.setAttack({ melee: false });
    nereid.setBehavior({
      restHeal: true,
      dialog: [],
      abilities: [
        this.ability(FeyIds.BeguilingAura),
        this.ability(FeyIds.SummonGiantPoisonousSnake),
        this.ability(FeyIds.VenomSpit),
        this.ability(FeyIds.DrowningKiss),
        this.ability(FeyIds.WateryFist),
      ],
    });
    nereid.setAdjustments([
      { files: ["BDPWATER"], data: { level1: 9, xpv: 3000 } },
      { files: ["RE_MEKRN"], data: { level1: 5 }, stringRef: "monster.fey.name.nereid" },
    ]);
    return nereid;
  }
}

export const createNereidEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new NereidEntry(kins.get(KinEnum.Fey));
