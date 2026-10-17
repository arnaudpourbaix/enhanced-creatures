import { SPELLS } from "../../config/spells/spell-database";
import { CommonProjectileFiles } from "../../spells/projectiles";
import effectFactory from "../../src/factories/effect.factory";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import {
  AbilityDamageTypeEnum,
  EffectStatisticModifierEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Golem, GolemIds } from "./kin";

class BoneGolem extends Golem {
  /**
   * Hideous Laugh
   */
  createHideousLaugh() {
    return this.addSpell({
      name: "monster.golem.ability.hideousLaugh",
      id: GolemIds.HideousLaugh,
      memorizedCount: 1,
      icon: SPELLS.Priest.CloakOfFear.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: { renew: 3 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          speed: 1,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          range: 30,
          effects: effectFactory.fear({
            duration: 7 * Durations.round,
            saveType: SaveTypeEnum.Spell,
          }),
        },
      ],
      ability: {
        preset: SPELLS.Priest.CloakOfFear.file,
        spell: {
          type: "force",
          remove: true,
        },
      },
    });
  }
}

class BoneGolemEntry extends CreatureEntry<BoneGolem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.BoneGolem, kin);
    this.addCreature(() => this.bone());
  }

  createCreature(id: MonsterEnum): BoneGolem {
    return new BoneGolem(id);
  }

  /**
   * Bone Golem
   */
  private bone() {
    const bone = this.create({
      monster: MonsterEnum.BoneGolem,
      name: "monster.golem.name.bone",
      files: [],
      data: {
        level1: 14,
        strength: 17,
        dexterity: 13,
        constitution: 16,
        intelligence: 3,
        wisdom: 8,
        charisma: 1,
        ac: 0,
        apr: 1,
        xpv: 18000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        gender: "NIETHER",
        size: { value: "Medium", tall: true, long: false },
        movement: 12,
        immunities: ["construct", "skeletal"],
        items: {
          remove: ["S3-8M3", "GOLCLA", "IMMUNE1", "IMMUNE2", "HELMNOAN"],
        },
        script: {
          remove: ["OHBNONIN"],
        },
      },
    });
    bone.addTrait({
      immunities: ["magic", "fire", "cold"],
      effects: [
        {
          opcode: EffectTypeEnum.ElectricityResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    bone.createHideousLaugh();
    bone.createFists({ diceThrown: 3, diceSize: 8, damageType: AbilityDamageTypeEnum.Slashing });
    bone.setBehavior({
      restHeal: true,
      abilities: [this.ability(GolemIds.HideousLaugh)],
    });
    bone.setAdjustments([
      {
        files: ["OHBGOLB1"],
        data: {
          level1: 25,
          xpv: 0,
        },
      },
    ]);
    return bone;
  }
}

export const createBoneGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new BoneGolemEntry(kins.get(KinEnum.Golem));
