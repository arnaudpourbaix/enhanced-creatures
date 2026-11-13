import { SPELLS } from "../config/spells/spell-database";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import { Durations } from "../src/model/game-data/durations";
import { Triggers } from "../src/model/script/triggers";
import { Effect } from "../src/model/spell-item/effect";
import {
  AttackModifierTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityTypeEnum,
  WingBuffetDirectionEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { Item } from "../src/model/spell-item/spell-item";
import { TranslationKey } from "../translations/i18n";

/**
 * Leap: the creature jumps on an enemy at least 5 feet and at most `range` feet away (the farthest
 * ones first), then attacks it for a round. `effects` land on the leaper with the jump.
 */
export function addLeap(
  creature: Creature,
  p: {
    id: number;
    range: number;
    name: TranslationKey;
    description: TranslationKey;
    effects: Effect[];
    /** Script conditions for the leap, besides having a target in range */
    triggers?: Triggers.Trigger[];
    /** See BaseSpell.docUsage */
    docUsage?: TranslationKey;
  },
) {
  const effects: Effect[] = [
    {
      opcode: EffectTypeEnum.WingBuffet,
      target: EffectTargetEnum.Self,
      speed: 150,
      direction: WingBuffetDirectionEnum.TowardsTargetPoint,
      duration: 2,
    },
    ...p.effects,
  ];
  return creature.addSpell({
    id: p.id,
    name: p.name,
    xpAbility: "specialAttack",
    role: "damage",
    description: p.description,
    icon: SPELLS.Wizard.DimensionDoor.file,
    memorizedCount: 1,
    options: { renew: 2 },
    ...(p.docUsage ? { docUsage: p.docUsage } : {}),
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        range: p.range,
        effects,
      },
    ],
    ability: {
      targets: [{ name: "FarthestEnemies", randomOrder: true }],
      minRange: 5,
      range: p.range,
      spell: {
        type: "force",
        isAttack: true,
      },
      disableInterrupt: true,
      actionsAfter: [{ name: "AttackOneRound", params: [ScriptTarget.lastSeen] }],
      ...(p.triggers ? { triggers: p.triggers } : {}),
    },
  });
}

/**
 * A leap attack's effects on the leaper: for the round of the leap, a single attack with
 * `weapon` (all its claws at once: no bite while leaping), saying `attackString`.
 */
export function leapAttackEffects(weapon: Item, attackString: TranslationKey): Effect[] {
  return [
    {
      opcode: EffectTypeEnum.ModifyAttacksPerRound,
      type: AttackModifierTypeEnum.Set,
      value: 1,
      target: EffectTargetEnum.Self,
      timing: EffectTimingEnum.InstantLimited,
      duration: Durations.round,
    },
    {
      opcode: EffectTypeEnum.CreateWeapon,
      amount: 1,
      resource: weapon.file,
      target: EffectTargetEnum.Self,
      timing: EffectTimingEnum.InstantLimited,
      duration: Durations.round,
    },
    {
      opcode: EffectTypeEnum.DisplayString,
      stringRef: attackString,
    },
  ];
}
