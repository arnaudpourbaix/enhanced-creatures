import { SPELLS } from "../../config/spells/spell-database";
import effectFactory from "../../src/factories/effect.factory";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import {
  EffectDamageTypeEnum,
  EffectIDSFileEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { AreaProjectileEnum, ParticleColorEnum } from "../../src/model/spell-item/projectile";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Golem, GolemIds } from "./kin";

class IronGolem extends Golem {
  /**
   * Cloud of poisonous gas
   */
  createCloudOfPoisonousGas() {
    return this.addSpell({
      name: "monster.golem.ability.cloudOfPoisonousGas.name",
      description: "monster.golem.ability.cloudOfPoisonousGas.description",
      id: GolemIds.CloudOfPoisonousGas,
      memorizedCount: 1,
      icon: SPELLS.Wizard.Cloudkill.file,
      options: { renew: 7 },
      keywords: ["cloud", "poison", "area"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          projectile: {
            copyFromFile: "GOLCLOUD",
            name: "Golem poison cloud",
            particleColor: ParticleColorEnum.Green,
            areaEffectInfo: {
              areaProjectileFlags: [AreaProjectileEnum.AffectOnlyEnemies],
              explosionDelay: 12,
              triggerCount: 10, // 6 or 10
              triggerRadius: 128,
              areaOfEffect: 128, //  10-foot cube
            },
          },
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.UseEFFFile,
              idsFile: EffectIDSFileEnum.GENERAL,
              idsEntry: "UNDEAD",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: "POISON_IMMUNITY",
              timing: EffectTimingEnum.InstantLimited,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Poison,
              diceThrown: 1,
              diceSize: 10,
              saveTypes: [SaveTypeEnum.BypassMirrorImage],
            },
            {
              opcode: EffectTypeEnum.Slay,
              idsFile: EffectIDSFileEnum.EA,
              idsEntry: "ANYONE",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              maxLevel: 4,
            },
            {
              opcode: EffectTypeEnum.Slay,
              idsFile: EffectIDSFileEnum.EA,
              idsEntry: "ANYONE",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              minLevel: 5,
              maxLevel: 6,
              saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
              saveBonus: -4,
            },
          ],
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies", limit: 3 }],
        range: 10,
        spell: {
          type: "reallyForce",
          castOnSelf: true,
          remove: true,
        },
      },
    });
  }
}

class IronGolemEntry extends CreatureEntry<IronGolem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.IronGolem, kin);
    this.addCreature(() => this.iron());
  }

  createCreature(id: MonsterEnum): IronGolem {
    return new IronGolem(id);
  }

  /**
   * Iron Golem
   */
  private iron() {
    const iron = this.create({
      monster: MonsterEnum.IronGolem,
      name: "monster.golem.name.iron",
      files: [],
      data: {
        level1: 18,
        strength: 24,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: 3,
        apr: 1,
        xpv: 13000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_IRON",
        gender: "NIETHER",
        animation: ["GOLEM_IRON_IWD"],
        size: { value: "Large", tall: true, long: false },
        movement: 6,
        immunities: ["construct"],
        items: {
          remove: ["GOLIRO", "IRONGOL", "IMMUNE3", "HELMNOAN"],
        },
        script: {
          remove: ["GOLIRO01"],
        },
      },
    });
    iron.addTrait({
      immunities: ["magic", "plusTwoWeapons", "lightning"],
      effects: effectFactory.fireResistance(125),
    });
    iron.createCloudOfPoisonousGas();
    iron.createFists({ diceThrown: 4, diceSize: 10 });
    iron.setBehavior({
      restHeal: true,
      abilities: [this.ability(GolemIds.CloudOfPoisonousGas)],
    });
    iron.setAdjustments([
      {
        files: ["OHBBANNO"],
        data: {
          level1: 30,
          script: { location: "None" },
          //TODO: need to keep effects 293, 101, 267
          // resistances: physical 90%, cold 100%, fire: 127%, acid: 100%
        },
      },
    ]);
    return iron;
  }
}

export const createIronGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new IronGolemEntry(kins.get(KinEnum.Golem));
