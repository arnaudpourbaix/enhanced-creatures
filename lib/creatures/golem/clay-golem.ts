import { SPELLS } from "../../config/spells/spell-database";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectHasteTypeEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  PortraitIconEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { StringRefUtils } from "../../src/services/utils/string-ref.utils";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { BAF_CONTINUE, Golem, GolemIds } from "./kin";

class ClayGolem extends Golem {
  /**
   * Haste
   */
  createHaste() {
    return this.addSpell({
      name: "monster.golem.ability.haste",
      id: GolemIds.Haste,
      memorizedCount: 1,
      castingSound: "CAS_P04",
      icon: SPELLS.Wizard.Haste.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.RemoveSpellTypeProtections,
              maximumLevel: 9,
              type: "K1#SLOW",
              timing: EffectTimingEnum.InstantLimited,
              duration: 3 * Durations.round,
            },
            {
              opcode: EffectTypeEnum.Haste,
              type: EffectHasteTypeEnum.NormalHaste,
              timing: EffectTimingEnum.InstantLimited,
              duration: 3 * Durations.round,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Haste,
              timing: EffectTimingEnum.InstantLimited,
              duration: 3 * Durations.round,
            },
            {
              opcode: EffectTypeEnum.LightingEffects,
              effect: LightingEffectEnum.AlterationAir,
              lightingTarget: LightingEffectTargetEnum.SpellTarget,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.CreatureRGBColorFade,
              color: {
                red: 60,
                green: 60,
                blue: 120,
              },
              fadeSpeed: 25,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: StringRefUtils.getString("Hasted"),
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              resource: "EFF_M28",
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              timing: EffectTimingEnum.DelayPermanent,
              duration: 3 * Durations.round,
              resource: "EFF_M29",
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "reallyForce",
          excludeStateChecks: ["STATE_HASTED"],
          castOnSelf: true,
          remove: true,
        },
        triggers: [{ name: "Delay", params: [6] }],
      },
    });
  }
}

class ClayGolemEntry extends CreatureEntry<ClayGolem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.ClayGolem, kin);
    this.addCreature(() => this.clay());
    this.addCreature(() => this.lesserClay());
    this.addCreature(() => this.greaterClay());
  }

  createCreature(id: MonsterEnum): ClayGolem {
    return new ClayGolem(id);
  }

  /**
   * Clay Golem
   */
  private clay() {
    const clay = this.create({
      monster: MonsterEnum.ClayGolem,
      name: "monster.golem.name.clay",
      files: [],
      data: {
        level1: 11,
        strength: 20,
        dexterity: 9,
        constitution: 18,
        intelligence: 3,
        wisdom: 8,
        charisma: 1,
        ac: 7,
        apr: 1,
        xpv: 5000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_CLAY",
        gender: "NIETHER",
        size: { value: "Large", tall: true, long: false },
        movement: 7,
        immunities: ["construct"],
        items: {
          remove: [
            "GOLCLA",
            "GOLFLE",
            "GOLIRO",
            "OHBGOL01",
            "B3-30",
            "RING95",
            "IMMUNE1",
            "IMMUNE2",
            "IMMUNE3",
            "IRONGOL",
            "D5CLGOL",
            "HELMNOAN",
          ],
        },
        script: {
          remove: ["GOLCLY01", "BPFHT", "OHBNONIN", "O#BrynFi"],
        },
      },
    });
    clay.addTrait({
      immunities: [
        "magic",
        "nonMagicalWeapons",
        "slashingDamage",
        "piercingDamage",
        "missileDamage",
      ],
    });
    clay.createHaste();
    clay.createFists({ diceThrown: 3, diceSize: 10 });
    clay.setBehavior({
      restHeal: true,
      abilities: [this.ability(GolemIds.Haste)],
    });
    clay.setAdjustments([
      { files: ["OBSGOL01", "IGOLEM01"], data: { script: { location: "None" } } },
    ]);
    return clay;
  }

  /**
   * Lesser Clay Golem
   */
  private lesserClay() {
    const lesserClay = this.createFrom({
      from: this.creature(MonsterEnum.ClayGolem),
      monster: MonsterEnum.LesserClayGolem,
      name: "monster.golem.name.lesserClay",
    });
    lesserClay.setData({
      level1: 9,
      strength: 19,
      xpv: 3000,
      animation: "GOLEM_MINI",
    });
    lesserClay.addTrait({
      immunities: [
        "magic",
        "nonMagicalWeapons",
        "slashingDamageResistance",
        "piercingDamageResistance",
        "missileDamageResistance",
      ],
    });
    return lesserClay;
  }

  /**
   * Greater Clay Golem
   */
  private greaterClay() {
    const greaterClay = this.createFrom({
      from: this.creature(MonsterEnum.ClayGolem),
      monster: MonsterEnum.GreaterClayGolem,
      name: "monster.golem.name.greaterClay",
    });
    greaterClay.setData({
      level1: 14,
      strength: 22,
      xpv: 8000,
      script: {
        edits: [
          {
            files: ["OHB_T302"],
            replaces: [["ReallyForceSpell(Myself,GOLEM_HASTE)", BAF_CONTINUE]],
          },
        ],
      },
    });
    greaterClay.addTrait({
      immunities: [
        "magic",
        "nonMagicalWeapons",
        "slashingDamage",
        "piercingDamage",
        "missileDamage",
        "crushingDamageResistance",
      ],
    });
    greaterClay.setAdjustments([
      { files: ["OHBGOL01"], data: { level1: 26, xpv: 0, ac: -1 }, noWeapon: true },
    ]);
    return greaterClay;
  }
}

export const createClayGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new ClayGolemEntry(kins.get(KinEnum.Golem));
