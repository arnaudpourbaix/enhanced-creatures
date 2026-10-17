import { NEW_CREATURES } from "../../config/creatures";
import { SPELLS } from "../../config/spells/spell-database";
import { CommonProjectileFiles } from "../../spells/projectiles";
import effectFactory from "../../src/factories/effect.factory";
import { ScriptTarget } from "../../src/model/constants";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import {
  CastSpellOnConditionTargetEnum,
  CharmTypeEnum,
  EffectBonusToEnum,
  EffectColorLocationEnum,
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
  SpellFlagEnum,
  SummonCreatureModeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Fey, FeyIds } from "./kin";

class Nereid extends Fey {
  /**
   * Attack Evasion
   */
  createAttackEvasion() {
    // The nereid also gets a saving throw vs. poison to avoid damage from a weapon.
    const duration = Durations.round;
    const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
    return this.addSpell({
      name: "monster.fey.ability.attackEvasion.name",
      description: "monster.fey.ability.attackEvasion.description",
      id: FeyIds.AttackEvasion,
      castingSound: "NERED06",
      icon: SPELLS.Wizard.ReflectedImage.file,
      flags: [SpellFlagEnum.IgnoreDead, SpellFlagEnum.CastableWhenSilenced],
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          effects: [
            {
              opcode: EffectTypeEnum.ArmorClassBonus,
              bonusTo: EffectBonusToEnum.AllWeapons,
              value: 4,
              duration,
              dispelResistance,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              duration,
              dispelResistance,
            },
          ],
        },
      ],
    });
  }

  /**
   * Venom Spit
   */
  createVenomSpit() {
    const duration = 7 * Durations.round;
    const saveType = SaveTypeEnum.ParalyzePoisonDeath;
    const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
    return this.addSpell({
      name: "monster.fey.ability.venomSpit.name",
      description: "monster.fey.ability.venomSpit.description",
      id: FeyIds.VenomSpit,
      memorizedCount: 1,
      castingSound: "NERED05",
      icon: SPELLS.Priest.Poison.file,
      options: {
        renew: 1,
      },
      keywords: ["blind"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 20,
          projectile: "ACIDBLMU",
          speed: 1,
          effects: [
            ...effectFactory.blindness({
              duration,
              saveType,
              dispelResistance,
            }),
          ],
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies" }],
        range: 20,
        spell: {
          type: "force",
          remove: true,
          excludeStateChecks: ["STATE_BLIND"],
        },
        probability: 50,
      },
    });
  }

  /**
   * Watery Fist
   */
  createWateryFist() {
    // They can also form the water into the shape of a serpent or fist, and cause it to strike as a 4-Hit Die monster and inflict 1d4 points of damage.
    const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
    return this.addSpell({
      name: "monster.fey.ability.wateryFist.name",
      description: "monster.fey.ability.wateryFist.description",
      id: FeyIds.WateryFist,
      memorizedCount: 1,
      castingSound: "CAS_M06",
      icon: SPELLS.Wizard.BigbyIcyGrasp.file,
      options: {
        renew: 1,
      },
      keywords: ["cold"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 20,
          projectile: "ACIDBLMU", // TODO: need a better animation
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
              resource: "SPBGBFST", // TODO: need a better effect
              duration: 2,
              dispelResistance,
            },
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Cold,
              diceThrown: 1,
              diceSize: 4,
              dispelResistance,
            },
          ],
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies" }],
        range: 30,
        spell: {
          type: "force",
          remove: true,
        },
        probability: 50,
      },
    });
  }

  /**
   * Drowning Kiss
   */
  createDrowningKiss() {
    const saveTypes = [SaveTypeEnum.Breath];
    const saveBonus = -2;
    const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
    return this.addSpell({
      name: "monster.fey.ability.drowningKiss.name",
      description: "monster.fey.ability.drowningKiss.description",
      id: FeyIds.DrowningKiss,
      memorizedCount: 1,
      castingSound: "NERED07",
      icon: "jaae1700",
      options: {
        renew: 1,
      },
      keywords: ["death"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 2,
          projectile: "ACIDBLMU",
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.ProtectionFromResource,
              type: "NOT_MALE_HUMANOID",
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.CharacterColorPulse,
              color: { red: 103, green: 32, blue: 0 },
              location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
              cycleSpeed: 25,
              duration: 1,
              saveTypes,
              saveBonus,
              dispelResistance,
            },
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetUnattached,
              resource: "jave1700",
              duration: 1,
              saveTypes,
              saveBonus,
              dispelResistance,
            },
            {
              opcode: EffectTypeEnum.Slay,
              idsFile: EffectIDSFileEnum.GENDER,
              idsEntry: "MALE",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              saveTypes,
              saveBonus,
              dispelResistance,
            },
          ],
        },
      ],
      ability: {
        targets: [{ name: "MaleHumanoids" }],
        spell: {
          type: "force",
          remove: true,
          includeStateChecks: ["STATE_CHARMED"],
          excludeStateChecks: ["STATE_HELPLESS"],
        },
        actionsBefore: [
          { name: "MoveToObjectNoInterrupt", params: [ScriptTarget.lastSeen] },
          { name: "FaceObject", params: [ScriptTarget.lastSeen] },
          {
            name: "ActionOverride",
            params: [
              ScriptTarget.lastSeen,
              "FaceObject([EVILCUTOFF.0.FAIRY.FAIRY_NEREID.0.FEMALE.CHAOTIC_NEUTRAL])",
            ],
          },
        ],
        probability: 75,
      },
    });
  }

  /**
   * Beguiling Aura
   */
  createBeguilingAura() {
    const duration = 1 * Durations.turn;
    const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
    return this.addSpell({
      name: "monster.fey.ability.beguilingAura.name",
      description: "monster.fey.ability.beguilingAura.description",
      id: FeyIds.BeguilingAura,
      memorizedCount: 1,
      castingSound: "NERED07",
      primaryType: ItemAbilityPrimaryTypeEnum.Enchanter,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      icon: SPELLS.Wizard.CharmPerson.file,
      options: {
        renew: 1,
      },
      keywords: ["charm", "area"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 20,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              target: EffectTargetEnum.Self,
              playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
              resource: "ICCLKFR2",
              duration: 2,
              dispelResistance,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromResource,
              type: "NOT_MALE_HUMANOID",
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
              duration: 1,
            },
            ...effectFactory.charm({
              charmType: CharmTypeEnum.NeutralCharm,
              duration,
              dispelResistance,
            }),
          ],
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies", limit: 3 }],
        spell: {
          type: "reallyForce",
          excludeStateChecks: ["STATE_INVISIBLE"],
          castOnSelf: true,
        },
        noRoundTimer: true,
        timer: { name: "BeguilingAura", value: 6 },
      },
    });
  }

  /**
   * Summon Giant Poisonous Snake
   */
  createSummonGiantPoisonousSnake() {
    const duration = Durations.eightHours;
    return this.addSpell({
      name: "monster.fey.ability.summonGiantPoisonousSnake.name",
      description: "monster.fey.ability.summonGiantPoisonousSnake.description",
      id: FeyIds.SummonGiantPoisonousSnake,
      memorizedCount: 1,
      castingSound: "CAS_P03",
      icon: SPELLS.Class.SummonSpiritAnimal.file,
      flags: [SpellFlagEnum.CastableWhenSilenced],
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          range: 30,
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.UseEFFFile,
              target: EffectTargetEnum.Self,
              idsFile: EffectIDSFileEnum.EA,
              idsEntry: "ANYONE",
              timing: EffectTimingEnum.InstantLimited,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
              duration,
            },
          ],
        },
      ],
      effectFiles: [
        {
          opcode: EffectTypeEnum.SummonCreature,
          mode: SummonCreatureModeEnum.PositionEffectAllegianceMatchTarget,
          resource: NEW_CREATURES.GiantPoisonousSnake,
          duration,
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies", limit: 1 }],
        spell: {
          type: "force",
          remove: true,
          castOnSelf: true,
        },
        noRoundTimer: true,
      },
    });
  }
}

class NereidEntry extends CreatureEntry<Nereid> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Nereid, kin);
    this.addCreature(() => this.nereid());
  }

  createCreature(id: MonsterEnum): Nereid {
    return new Nereid(id);
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
  new NereidEntry(kins.get(KinEnum.Fey)).requires(EntryEnum.GiantPoisonousSnake);
