import { MonsterItemIconEnum } from "../../config/item";
import { SPELLS } from "../../config/spells/spell-database";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import {
  AbilityDamageTypeEnum,
  EffectDamageTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilityLocationEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { AreaProjectileEnum, ParticleColorEnum } from "../../src/model/spell-item/projectile";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Golem, GolemIds } from "./kin";

class MagicGolem extends Golem {
  createMagicalBlast() {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.golem.weapon.magicalBlast",
        icon: MonsterItemIconEnum.FireElemental,
        equippedSlot: ["WEAPON1"],
        header: {
          range: 50,
          diceThrown: 0,
          diceSize: 0,
          damageType: AbilityDamageTypeEnum.Missile,
          type: ItemAbilityTypeEnum.Ranged,
          speed: 4,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          projectile: "SPBEHBLA",
          effects: [
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Magic,
              diceThrown: 3,
              diceSize: 10,
            },
            {
              opcode: EffectTypeEnum.LightingEffects,
              effect: LightingEffectEnum.AlterationAir,
              lightingTarget: LightingEffectTargetEnum.SpellTarget,
            },
          ],
        },
      },
    });
  }

  /**
   * Wild Magic Flare
   */
  createWildMagicFlare() {
    // TODO:
    // cast as a 16th level
    // 20% Magical blast
    // 10% Chain lightning
    // 10% Dispel magic
    // 10% Fire shield
    // 10% Color spray in a 360' radius
    // 20% Fireball centered on golem
    // 10% Time stop
    // 10% Earthquake
    return this.addSpell({
      name: "monster.golem.ability.wildMagicFlare.name",
      description: "monster.golem.ability.wildMagicFlare.description",
      id: GolemIds.WildMagicFlare,
      memorizedCount: 1,
      icon: SPELLS.Wizard.NahalRecklessDweomer.file,
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
          effects: [],
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

class MagicGolemEntry extends CreatureEntry<MagicGolem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.MagicGolem, kin);
    this.addCreature(() => this.magic());
  }

  createCreature(id: MonsterEnum): MagicGolem {
    return new MagicGolem(id);
  }

  /**
   * Magic Golem
   */
  private magic() {
    const magic = this.create({
      monster: MonsterEnum.MagicGolem,
      name: "monster.golem.name.magic",
      files: [],
      data: {
        level1: 8,
        strength: 22,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: -2,
        apr: 1,
        xpv: 8000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_CLAY",
        gender: "NIETHER",
        size: { value: "Large", tall: true, long: false },
        movement: 18,
        immunities: ["construct"],
        items: {
          remove: ["GOLMAG01"],
        },
        script: {
          remove: ["GOLMAG01", "O#LLENEM"],
        },
      },
    });
    magic.addTrait({
      immunities: ["magic", "fire", "cold", "lightning", "acid", "magicalWeapons"],
    });
    // TODO:
    // Magic golems absorb all magical energy within a 20-foot radius.
    // Spells are instantly absorbed as they are cast.
    // Running spells are terminated and absorbed at the end of one round,
    // with the two exceptions noted below.
    // Charged magical items lose 1d6 charges per round.
    // magic.createWildMagicFlare();
    magic.createMagicalBlast();
    magic.setBehavior({
      restHeal: true,
      //abilities: [this.ability(GolemIds.WildMagicFlare)],
    });
    magic.setAdjustments([]);
    return magic;
  }
}

export const createMagicGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new MagicGolemEntry(kins.get(KinEnum.Golem));
