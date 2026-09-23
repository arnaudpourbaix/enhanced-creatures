import { SPELLS } from "../config/spells/spell-database";
import effectFactory from "../src/factories/effect.factory";
import {
  EffectDispelResistanceEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { PartialProjectile, Projectile } from "../src/model/spell-item/projectile";
import { PartialSpell } from "../src/model/spell-item/spell-item";
import { TranslationKey } from "../translations/i18n";
import { CommonProjectileFiles } from "./projectiles";

export const createFearAura = ({
  id,
  description,
  duration,
  saveType,
  saveBonus,
  projectile,
}: {
  id: number;
  description: TranslationKey;
  duration: number;
  saveType?: SaveTypeEnum;
  saveBonus?: number;
  projectile?: PartialProjectile;
}): PartialSpell => ({
  name: "monster.common.fearAura",
  description,
  id,
  memorizedCount: 1,
  icon: SPELLS.Priest.CloakOfFear.file,
  secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
  options: { renew: 1 },
  headers: [
    {
      type: ItemAbilityTypeEnum.Melee,
      location: ItemAbilityLocationEnum.Ability,
      target: ItemAbilityTargetEnum.AnyPointWithinRange,
      speed: 0,
      projectile: projectile ?? CommonProjectileFiles.AreaOfSightNonParty,
      range: 30,
      effects: [
        ...effectFactory.fear({
          duration,
          saveType,
          saveBonus,
          dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
        }),
        {
          opcode: EffectTypeEnum.ProtectionFromSpell,
          timing: EffectTimingEnum.InstantLimited,
          duration,
          saveTypes: saveType ? [saveType] : undefined,
          saveBonus,
        },
      ],
    },
  ],
  ability: {
    preset: SPELLS.Priest.CloakOfFear.file,
    spell: {
      type: "force",
      remove: true,
    },
    probability: 100,
    noRoundTimer: true,
    disableInterrupt: true,
    requireVocal: false,
    timer: {
      name: "fear_aura",
      value: 6,
    },
  },
});
