import { TRIP_IMMUNE_CREATURES } from "../../../config/creatures";
import { Creature } from "../../model/creature/creature";
import { CreatureTripConfig, TRIP_DEFAULT_CONFIG } from "../../model/creature/trip";
import { Effect } from "../../model/spell-item/effect";
import {
  EffectBonusToEnum,
  EffectCastSpellTypeEnum,
  EffectModifierTypeEnum,
  EffectTimingEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  RemoveEffectsByResourceTypeEnum,
} from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { PartialSpell, Weapon } from "../../model/spell-item/spell-item";
import spellService from "../spell.service";
import translationService from "../translation.service";
import { getSpellFilename } from "../utils/misc.func";
import effectService from "./effect.service";
import { getProtectionEffects, getTooBigCreatures } from "./size-immunity";

/**
 * Trip: the weapon's hit casts a spell that knocks the victim down, unless it saves. Every effect
 * shares the save, so they roll once: the victim falls or stays standing. Prone (a spell state the
 * scripts look for), it can't move (op 176, which Free Action doesn't stop) and is easier to hit,
 * but still acts: unlike Sleep, no immunity to sleep keeps it standing.
 */
class TripService {
  attachTripToWeapon(creature: Creature, weapon: Weapon, trip: CreatureTripConfig) {
    weapon.trip = true;
    const file = getSpellFilename(creature.spells.length + 1, creature.id);
    creature.spells.push(spellService.getSpell(this.getTripSpell(creature, trip), file));
    weapon.header.effects.push(
      effectService.getEffect({
        opcode: EffectTypeEnum.CastSpell,
        type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
        resource: file,
      }),
    );
  }

  private getTripSpell(creature: Creature, trip: CreatureTripConfig): PartialSpell {
    const { duration } = TRIP_DEFAULT_CONFIG;
    const save = trip.noSave
      ? {}
      : {
          saveTypes: [trip.saveType ?? TRIP_DEFAULT_CONFIG.saveType],
          saveBonus: trip.saveBonus ?? 0,
        };
    const prone: Effect[] = [
      // first, so a victim tripped again stays down from now on, without stacking
      {
        opcode: EffectTypeEnum.RemoveEffectsByResource,
        type: RemoveEffectsByResourceTypeEnum.Default,
      },
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: TRIP_DEFAULT_CONFIG.proneState,
        duration,
      },
      {
        opcode: EffectTypeEnum.MovementRateBonus2,
        type: EffectModifierTypeEnum.Set,
        value: 0,
        duration,
      },
      {
        opcode: EffectTypeEnum.ArmorClassBonus,
        bonusTo: EffectBonusToEnum.AllWeapons,
        value: -4, // opponents get +4 on their attack rolls against a prone target
        duration,
      },
      // getting up takes the round: the engine's own fall, helplessness and get-up (when it ends
      // or damage wakes it). Sleep immunities stop only this: the rest still holds it prone
      {
        opcode: EffectTypeEnum.Sleep,
        wakeOnDamage: true,
        // with an icon, the sleeper stays targetable (NearestEnemyOf): without, it can't be found
        icon: TRIP_DEFAULT_CONFIG.portraitIcon,
        timing: EffectTimingEnum.InstantLimited,
        duration,
      },
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        icon: TRIP_DEFAULT_CONFIG.portraitIcon,
        duration,
      },
      {
        opcode: EffectTypeEnum.DisplayString,
        stringRef: TRIP_DEFAULT_CONFIG.proneStringRef,
      },
    ];
    return {
      name: TRIP_DEFAULT_CONFIG.tripStringRef,
      doc: false,
      // the "Tripped" text says it, only when the victim falls
      hideName: true,
      description: translationService.addCustomTranslation([
        translationService.interpolate("spell.trip.description", { duration }),
      ]),
      // a body's attack form, never a spell (user)
      xpAbility: "specialAttack",
      // a fall, not sleep magic: an elf's resistance to sleep doesn't keep it standing
      options: { addRacialResistances: false },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 5,
          effects: [
            // too big, or nothing to trip: protected from the spell itself before its effects apply
            ...getProtectionEffects([...TRIP_IMMUNE_CREATURES, ...getTooBigCreatures(creature)]),
            ...prone.map((e): Effect => ({ ...e, ...save })),
          ],
        },
      ],
    };
  }
}

const tripService = new TripService();
export default tripService;
