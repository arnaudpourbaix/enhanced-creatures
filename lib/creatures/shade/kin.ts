import { SPELLS } from "../../config/spells/spell-database";
import type { InputCreatureData } from "../../src/model/creature/data-input";
import effectFactory from "../../src/factories/effect.factory";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectCastSpellTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import type { Spell } from "../../src/model/spell-item/spell-item";
import { KinEnum } from "../kin";

export enum ShadeIds {
  ShadowImages,
  ShadowDoor,
}

/** Shade level: magic resistance 3% per level, its mirror image lasts 3 rounds per level */
export const SHADE_LEVEL = 10;

/** Once a turn, in rounds */
const EVERY_TURN = Durations.turn / Durations.round;

/**
 * The shade's shadow powers, used by the shade and by other shadow creatures wielding them
 * (Godcall's Saarixal, a shadow fiend): shadow images and Shadow Door, each once a turn.
 */
export class ShadeKin extends CreatureKin {
  constructor() {
    super(KinEnum.Shade);
    this.createShadowImages();
    this.createShadowDoor();
  }

  get shadowImages(): Spell {
    return this.spell(ShadeIds.ShadowImages);
  }

  get shadowDoor(): Spell {
    return this.spell(ShadeIds.ShadowDoor);
  }

  /** Shadow images, once a turn: mirror image at the shade's level, 1d4+3 images. */
  private createShadowImages() {
    return this.addSpell({
      id: ShadeIds.ShadowImages,
      name: "monster.shade.ability.shadowImages.name",
      description: "monster.shade.ability.shadowImages.description",
      icon: SPELLS.Wizard.MirrorImages.file,
      worthLevel: 2,
      role: "protection",
      // as Mirror Image, with more images: an opener
      tier: "great",
      memorizedCount: 1,
      options: { renew: EVERY_TURN },
      headers: [
        {
          type: ItemAbilityTypeEnum.Magical,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: effectFactory.diceOutcomes(1, 4, (total) => [
            {
              opcode: EffectTypeEnum.MirrorImageEffect,
              amount: total + 3,
              target: EffectTargetEnum.Self,
              timing: EffectTimingEnum.InstantLimited,
              duration: 3 * SHADE_LEVEL * Durations.round,
            },
          ]),
        },
      ],
      ability: {
        spell: { type: "force", castOnSelf: true, excludeStateChecks: ["STATE_MIRRORIMAGE"] },
        requireVocal: false,
      },
    });
  }

  /**
   * Shadow Door once a turn, at the caster's level: the game's spell (improved invisibility, 1
   * round per level) instead of PnP's invisibility, as the game's shades cast it (user).
   */
  private createShadowDoor() {
    return this.addSpell({
      id: ShadeIds.ShadowDoor,
      name: SPELLS.Wizard.ShadowDoor.name,
      icon: SPELLS.Wizard.ShadowDoor.file,
      worthLevel: SPELLS.Wizard.ShadowDoor.level,
      role: "protection",
      tier: "great",
      memorizedCount: 1,
      options: { renew: EVERY_TURN },
      headers: [
        {
          type: ItemAbilityTypeEnum.Magical,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.CastSpell,
              type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
              target: EffectTargetEnum.Self,
              resource: SPELLS.Wizard.ShadowDoor.file,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "force",
          castOnSelf: true,
          excludeStateChecks: ["STATE_INVISIBLE", "STATE_IMPROVEDINVISIBILITY"],
        },
        requireVocal: false,
      },
    });
  }
}

/** The shade's shadow powers, as data: memorized by the shade and the creatures wielding them. */
export function shadePowers(kin: ShadeKin): InputCreatureData {
  return {
    spells: {
      memorized: [
        { file: kin.shadowImages.file, memorizedCount: 1 },
        { file: kin.shadowDoor.file, memorizedCount: 1 },
      ],
    },
  };
}

export const createShadeKin = () => new ShadeKin();
