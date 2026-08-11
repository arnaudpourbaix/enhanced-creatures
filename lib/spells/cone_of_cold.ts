import { SPELLS } from "../config/spells/spell-names";
import {
  EffectDamageTypeEnum,
  EffectFlagsEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
  SpellFlagEnum,
  SpellTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { PartialProjectile } from "../src/model/spell-item/projectile";
import { PartialSpell, SpellOptions } from "../src/model/spell-item/spell-item";
import { TranslationKey } from "../translations/i18n";

export const createConeOfCold = ({
  id,
  description,
  projectile,
  options,
  damage,
  memorizedCount,
}: {
  id: number;
  description: TranslationKey;
  projectile?: PartialProjectile;
  options?: SpellOptions;
  memorizedCount?: number;
  damage: {
    diceThrown: number;
    diceSize: number;
    amount: number;
  };
}): PartialSpell => ({
  id,
  description,
  memorizedCount,
  options,
  name: "spell.coneOfCold.name",
  icon: SPELLS.Wizard.ConeOfCold.file,
  castingSound: "CAS_M06",
  flags: [SpellFlagEnum.Hostile, SpellFlagEnum.BreakSanctuary],
  type: SpellTypeEnum.Wizard,
  castingAnimation: ItemAbilityCastingAnimationEnum.Invocation,
  primaryType: ItemAbilityPrimaryTypeEnum.Invoker,
  secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
  level: 5,
  headers: [
    {
      type: ItemAbilityTypeEnum.Melee,
      projectile: projectile ?? "CONECOLD",
      location: ItemAbilityLocationEnum.Spell,
      target: ItemAbilityTargetEnum.LivingActor,
      range: 10,
      speed: 1,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Cold,
          amount: damage.amount,
          diceSize: damage.diceSize,
          diceThrown: damage.diceThrown,
          saveTypes: [SaveTypeEnum.Spell, SaveTypeEnum.BypassMirrorImage],
          saveBonus: -4,
          flags: [EffectFlagsEnum.SaveForHalf],
        },
        {
          opcode: EffectTypeEnum.PauseTarget,
          duration: 1,
        },
      ],
    },
  ],
  ability: {
    preset: SPELLS.Wizard.ConeOfCold.file,
    spell: {
      id: undefined,
      type: "force",
      remove: true,
    },
    requireVocal: false,
  },
});
