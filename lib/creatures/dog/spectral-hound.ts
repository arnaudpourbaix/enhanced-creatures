import { Durations } from "../../src/model/game-data/durations";
import { BaseEffect } from "../../src/model/spell-item/effect";
import {
  EffectColorLocationEnum,
  EffectDispelResistanceEnum,
  EffectTimingEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTypeEnum,
  TranslucencyTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { WeaponCastSpell } from "../../src/model/spell-item/spell-item";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Dog } from "./kin";

class SpectralHoundEntry extends CreatureEntry<Dog> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.SpectralHound, kin, MonsterFamilyEnum.Dog);
    this.addCreature(() => this.spectralHound());
  }

  createCreature(id: MonsterEnum): Dog {
    return new Dog(id);
  }

  /**
   * Spectral Hound
   */
  private spectralHound() {
    const spectralHound = this.create({
      monster: MonsterEnum.SpectralHound,
      name: "monster.dog.name.spectralHound",
      files: [],
      data: {
        level1: 5,
        strength: 17,
        dexterity: 15,
        constitution: 14,
        intelligence: 4,
        wisdom: 14,
        charisma: 12,
        ac: -1,
        apr: 1,
        xpv: 975,
        alignment: "CHAOTIC_EVIL",
        morale: 19,
        general: "MONSTER",
        race: "DOG",
        class: "DOG_WAR",
        gender: "MALE",
        size: { value: "Medium", tall: false, long: true },
        movement: 15,
        items: {
          remove: ["FIGRING3", "IPSION", "BDSPIRIM", "DOGWAWP", "BDSHA01C"],
        },
        script: { remove: ["WARDOG"] },
        immunities: ["magicalBeast"],
      },
    });
    const shiftEffect: BaseEffect = {
      timing: EffectTimingEnum.InstantLimited,
      dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
      duration: 6 * Durations.round,
    };
    const astralPlaneShift: WeaponCastSpell = {
      spell: {
        name: "monster.dog.ability.astralPlaneShift",
        secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
        headers: [
          {
            type: ItemAbilityTypeEnum.Melee,
            range: 5,
            effects: [
              // roll a saving throw vs. spell. If the saving throw fails, the victim begins to fade, slowly assuming the same translucent appearance as the spectral hound itself.
              // The entire process takes 24 hours. After 12 hours, a fading character cannot hear or speak to any unfaded characters from the victim's point of view, it is the rest of the world that is becoming translucent, not himself or herself).
              // The character's equipment – weapons, armor, spell components, and the like – is unaffected and drops away.
              // Because of their inability to handle objects, faded creatures cannot eat or drink.
              // Mental and energy-based attacks work normally when used against a faded character, but the character is immune to physical attacks.
              // After 12 more hours, the character fades completely from sight and slips into the Astral Plane.
              // Once on the Astral Plane, the victim can handle objects (but isn't likely to find any lying about, waiting to be picked up) and can seek any normal means to exit the plane and return to the Prime Material.
              {
                opcode: EffectTypeEnum.Slow,
                ...shiftEffect,
              },
              {
                opcode: EffectTypeEnum.Translucency,
                amount: 99,
                type: TranslucencyTypeEnum.DrawInstantly,
                ...shiftEffect,
              },
              {
                opcode: EffectTypeEnum.SetColorGlowPulse,
                color: { red: 125, green: 125, blue: 125 },
                location: EffectColorLocationEnum.CharacterColor,
                cycleSpeed: 30,
                ...shiftEffect,
              },
              {
                opcode: EffectTypeEnum.CreatureRGBColorFade,
                color: { red: 90, green: 30, blue: 90 },
                fadeSpeed: 25,
                ...shiftEffect,
              },
            ],
          },
        ],
      },
    };
    spectralHound.createJaws({ diceThrown: 2, diceSize: 6, castSpell: astralPlaneShift });
    return spectralHound;
  }
}

export const createSpectralHoundEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new SpectralHoundEntry(kins.get(KinEnum.Dog));
