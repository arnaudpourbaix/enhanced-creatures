import { SPELL_STATES } from "../config/common";
import { Creature } from "../src/model/creature/creature";
import { Durations } from "../src/model/game-data/durations";
import { Effect } from "../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  EffectCastSpellTypeEnum,
  EffectDamageTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../src/model/spell-item/spell-protection";
import type { Weapon } from "../src/model/spell-item/spell-item";
import effectService from "../src/services/effects/effect.service";
import translationService from "../src/services/translation.service";

/** A quasi-real weapon: its own dice are the real part, `extra` the rest a believer takes */
export interface QuasiRealWeapon {
  weapon: Weapon;
  extra: { diceThrown: number; diceSize: number };
}

const DAMAGE_TYPES: Partial<Record<AbilityDamageTypeEnum, EffectDamageTypeEnum>> = {
  [AbilityDamageTypeEnum.Piercing]: EffectDamageTypeEnum.Piercing,
  [AbilityDamageTypeEnum.Crushing]: EffectDamageTypeEnum.Crushing,
  [AbilityDamageTypeEnum.Slashing]: EffectDamageTypeEnum.Slashing,
  [AbilityDamageTypeEnum.Fist]: EffectDamageTypeEnum.Crushing,
};

/**
 * Quasi-real attacks (demishadow monsters, a shade's images): their weapons deal the real part of
 * the damage to all, the rest only to victims that believe them. A victim saves vs. spell once, on
 * the first hit it takes: failing, it believes them for `duration` (the shadow stuff fully lethal
 * to it) and that hit already deals the rest; saving, it sees through them for that time. Weapon
 * effects apply in order: the believer's extra damage is checked before the first hit's save.
 * Inside the save's spell, conditions placed after the state see it (in-game tested), while a
 * damage effect carrying the save itself dealt nothing: the first hit's rest checks the state.
 */
export function addQuasiRealDamage(
  creature: Creature,
  weapons: QuasiRealWeapon[],
  duration: number,
) {
  const base = {
    name: "spell.quasiReal.name",
    doc: false,
    hideName: true,
    // the summon's damage, nothing of its own
    xpAbility: null,
  } as const;
  const header = (effects: Effect[]) => ({
    type: ItemAbilityTypeEnum.Melee,
    target: ItemAbilityTargetEnum.LivingActor,
    range: 5,
    effects,
  });
  const extraDamage = ({ weapon, extra }: QuasiRealWeapon): Effect => {
    const type = DAMAGE_TYPES[weapon.header.damageType ?? AbilityDamageTypeEnum.Crushing];
    if (type === undefined) throw new Error(`Quasi-real ${weapon.file}: unknown damage type`);
    return { opcode: EffectTypeEnum.Damage, type, ...extra };
  };
  // the save's outcome, in the log: failing shows at once, a success once the state is known
  const seesThrough = creature.addSpell({
    ...base,
    headers: [
      header([{ opcode: EffectTypeEnum.DisplayString, stringRef: "spell.quasiReal.seesThrough" }]),
    ],
  });
  const checks = weapons.map((w) => {
    const believer = creature.addSpell({ ...base, headers: [header([extraDamage(w)])] });
    // one save for the state and its message: identical saves roll once
    const save = { saveTypes: [SaveTypeEnum.Spell] };
    const check = creature.addSpell({
      ...base,
      // the weapon's docs show it: the hit's whole quasi-real rule
      description: translationService.addCustomTranslation([
        translationService.interpolate("spell.quasiReal.description", {
          damage: `${w.extra.diceThrown}d${w.extra.diceSize}`,
          duration: duration / Durations.round,
        }),
      ]),
      headers: [
        header([
          {
            opcode: EffectTypeEnum.SetExtendedSpellState,
            state: SPELL_STATES.believesShadow,
            duration,
            ...save,
          },
          {
            opcode: EffectTypeEnum.DisplayString,
            stringRef: "spell.quasiReal.believes",
            ...save,
          },
          {
            opcode: EffectTypeEnum.ApplyEffectsList,
            type: {
              stat: SpellProtectionStat.Splstate,
              relation: SpellProtectionRelation.NotEqual,
            },
            value: SPELL_STATES.believesShadow,
            resource: seesThrough.file,
          },
          {
            opcode: EffectTypeEnum.ApplyEffectsList,
            type: { stat: SpellProtectionStat.Splstate, relation: SpellProtectionRelation.Equal },
            value: SPELL_STATES.believesShadow,
            resource: believer.file,
          },
        ]),
      ],
    });
    w.weapon.header.effects.push(
      ...effectService.getEffects([
        {
          opcode: EffectTypeEnum.ApplyEffectsList,
          type: { stat: SpellProtectionStat.Splstate, relation: SpellProtectionRelation.Equal },
          value: SPELL_STATES.believesShadow,
          resource: believer.file,
        },
        {
          opcode: EffectTypeEnum.CastSpell,
          type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
          resource: check.file,
        },
      ]),
    );
    return check;
  });
  // the save is made once, whichever weapon hits first
  for (const check of checks) {
    check.headers[0].effects.push(
      ...effectService.getEffects(
        checks.map((other): Effect => ({
          opcode: EffectTypeEnum.ProtectionFromSpell,
          resource: other.file,
          duration,
        })),
      ),
    );
  }
}
