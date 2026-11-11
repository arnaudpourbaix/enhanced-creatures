import { MonsterItemIconEnum } from "../../config/item";
import { SPELLS } from "../../config/spells/spell-database";
import effectFactory from "../../src/factories/effect.factory";
import { Creature } from "../../src/model/creature/creature";
import type { InputCreatureData } from "../../src/model/creature/data-input";
import { JEWEL_SLOTS, type WeaponSlot } from "../../src/model/creature/item";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import type { ImmunityName } from "../../src/model/final/immunity";
import {
  AbilityDamageTypeEnum,
  EffectDamageTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import type { Item, Spell, Weapon } from "../../src/model/spell-item/spell-item";
import { KinEnum } from "../kin";

export enum RevenantIds {
  Gaze,
}

/** Fire damage doesn't regenerate and only fire destroys it in PnP: not done (user) */
const REVENANT_REGENERATION = 3;

/** Acid, gas, holy water and turning have no effect */
const REVENANT_IMMUNITIES: ImmunityName[] = ["acid", "cloudSpells", "turnUndead"];

/**
 * The revenant and the bodies it rises in (an ettin revenant): its traits, paralyzing gaze and
 * grip, and what it brings to another monster's body (see {@link revenantNature}).
 */
export class RevenantKin extends CreatureKin {
  /** Regeneration and its immunities, worn by the revenant and the bodies it rises in */
  readonly trait: Item;

  constructor() {
    super(KinEnum.Revenant);
    this.createGaze();
    this.trait = this.addSharedTrait({
      name: "monster.revenant.name",
      effects: effectFactory.regeneration(REVENANT_REGENERATION),
      immunities: REVENANT_IMMUNITIES,
    });
  }

  get gaze(): Spell {
    return this.spell(RevenantIds.Gaze);
  }

  /**
   * Paralyzing gaze: the one staring into the revenant's eyes saves vs. spell or is paralyzed with
   * terror for 2d4 rounds. In PnP only its killer is affected: there is no killer in the game, so
   * any enemy is (user). Blocked by gaze attack immunity, and never tried on a blinded creature.
   */
  private createGaze() {
    return this.addSpell({
      name: "monster.revenant.ability.gaze.name",
      description: "monster.revenant.ability.gaze.description",
      id: RevenantIds.Gaze,
      role: "disable",
      icon: SPELLS.Wizard.HoldPerson.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      keywords: ["gaze", "hold"],
      memorizedCount: 1,
      options: {
        renew: 1,
      },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 30,
          speed: 1,
          // like the game's gazes, so protections from gaze projectiles (e.g. blindness) apply
          projectile: "GAZE",
          effects: effectFactory.diceOutcomes(2, 4, (rounds) =>
            effectFactory.paralyze({
              duration: rounds * Durations.round,
              saveType: SaveTypeEnum.Spell,
              saveBonus: 0,
            }),
          ),
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies", randomOrder: true }],
        spell: {
          type: "force",
          excludeStateChecks: ["STATE_BLIND"],
          excludeStatsChecks: ["HELD"],
        },
      },
    });
  }
}

/**
 * The revenant's grip: it hooks its claw-like hands around its victim's throat, 2d8 plus its
 * Strength bonus every round it holds on. The hit strangles and seizes at once; the grip deals
 * the damage of the following rounds. A revenant makes no other attack
 * while it holds; a body with a `freeHand` (an ettin revenant) keeps striking with the other.
 */
export function createRevenantGrip(
  creature: Creature,
  p: { id?: number; slot: WeaponSlot | null; freeHand?: boolean },
): Weapon {
  return creature.addNaturalWeapon("claws", {
    id: p.id,
    icon: MonsterItemIconEnum.Ghoul,
    diceThrown: 2,
    diceSize: 8,
    damageType: AbilityDamageTypeEnum.Crushing,
    speed: 5,
    slot: p.slot,
    grab: {
      trigger: "probability",
      damagePerRound: { type: EffectDamageTypeEnum.Crushing, diceThrown: 2, diceSize: 8 },
      addStrengthBonus: true,
      freeHand: p.freeHand,
      victimNoAttack: true,
    },
  });
}

/**
 * A monster risen as a revenant, as data: undead, the revenant's traits and its gaze. The revenant
 * itself and another monster's body risen as one (an ettin revenant, as variant data) both take
 * it; the body's stats and attacks stay its own, and the grip is its own to equip.
 */
export function revenantNature(kin: RevenantKin): InputCreatureData {
  return {
    immunities: ["undead"],
    items: { equipped: [{ file: kin.trait.file, slot: JEWEL_SLOTS }] },
    spells: { memorized: [{ file: kin.gaze.file, memorizedCount: 1 }] },
  };
}

export const createRevenantKin = () => new RevenantKin();
