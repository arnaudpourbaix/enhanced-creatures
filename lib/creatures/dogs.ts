import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { Durations } from "../src/model/game-data/durations";
import { BaseEffect } from "../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  EffectColorLocationEnum,
  EffectDispelResistanceEnum,
  EffectModifierTypeEnum,
  EffectTargetEnum,
  EffectTeleportTypeEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTypeEnum,
  TranslucencyTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { WeaponCastSpell } from "../src/model/spell-item/spell-item";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  Blink,
}

class Dog extends Creature {
  createJaws(diceThrown: number, diceSize: number, castSpell?: WeaponCastSpell) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.dog.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: ["WEAPON1"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: diceThrown,
          diceSize: diceSize,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells: castSpell ? [castSpell] : undefined,
    });
  }

  /**
   * Blink
   */
  createBlink() {
    return this.addSpell({
      icon: SPELLS.Wizard.DimensionDoor.file,
      options: {
        renew: 1,
      },
      name: "monster.dog.ability.blink",
      id: Ids.Blink,
      memorizedCount: 1,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 30,
          effects: [
            {
              opcode: EffectTypeEnum.Teleport,
              type: EffectTeleportTypeEnum.Default,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.Thac0Bonus,
              timing: EffectTimingEnum.InstantLimited,
              duration: Durations.round,
              type: EffectModifierTypeEnum.Increment,
              probability1: 75,
              value: 2,
              target: EffectTargetEnum.Self,
            },
          ],
        },
      ],
      ability: {
        targets: [{ name: "FarthestEnemies", randomOrder: true }],
        spell: {
          type: "force",
        },
        actionsAfter: [{ name: "AttackOneRound", params: [ScriptTarget.lastSeen] }],
      },
    });
  }
}

class DogFamily extends CreatureFamily<Dog> {
  constructor() {
    super(MonsterFamilyEnum.Dog);
    this.addCreature(() => this.wildDog());
    this.addCreature(() => this.warDog());
    this.addCreature(() => this.blinkDog());
    this.addCreature(() => this.spectralHound());
  }

  createCreature(id: MonsterEnum): Dog {
    return new Dog(id);
  }

  /**
   * Wild Dog
   */
  private wildDog() {
    const wild = this.create({
      monster: MonsterEnum.WildDog,
      name: "monster.dog.name.wild",
      files: ["DW#RNDWI"],
      data: {
        level1: 1,
        bonusHp: 1,
        strength: 12,
        dexterity: 17,
        constitution: 15,
        intelligence: 4,
        wisdom: 13,
        charisma: 11,
        ac: 7,
        thac0: 19,
        apr: 1,
        xpv: 35,
        alignment: "NEUTRAL",
        morale: 6,
        general: "MONSTER",
        race: "DOG",
        class: "DOG_WILD",
        gender: "MALE",
        size: "Small",
        movement: 15,
        items: {
          remove: ["P1-4"],
        },
        script: {
          location: "Default",
        },
      },
    });
    wild.createJaws(1, 4);
    wild.setBehavior({ dialog: ["BDDOGW01"] });
    wild.setAdjustments([
      { files: ["BDDOG"], data: { class: "INNOCENT" } },
      { files: ["BDDEADOG"], data: { script: { location: "None" } } },
    ]);
    return wild;
  }

  /**
   * War Dog
   */
  private warDog() {
    const war = this.create({
      monster: MonsterEnum.WarDog,
      name: "monster.dog.name.war",
      files: ["DW#RNDWA"],
      data: {
        level1: 2,
        bonusHp: 2,
        strength: 12,
        dexterity: 17,
        constitution: 15,
        intelligence: 4,
        wisdom: 13,
        charisma: 11,
        ac: 6,
        apr: 1,
        xpv: 65,
        alignment: "NEUTRAL",
        morale: 9,
        general: "MONSTER",
        race: "DOG",
        class: "DOG_WAR",
        gender: "MALE",
        size: "Medium",
        movement: 12,
        items: { remove: ["P2-8"] },
        script: { location: "Default" },
      },
    });
    war.createJaws(2, 4);
    war.setAdjustments([
      { files: ["UBNIMDOG"], data: { script: { location: "None" } } },
    ]);
    return war;
  }

  /**
   * Blink Dog
   */
  private blinkDog() {
    const blinkDog = this.create({
      monster: MonsterEnum.BlinkDog,
      name: "monster.dog.name.blink",
      files: [],
      data: {
        level1: 4,
        strength: 12,
        dexterity: 17,
        constitution: 15,
        intelligence: 9,
        wisdom: 13,
        charisma: 11,
        ac: 5,
        apr: 1,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 12,
        general: "MONSTER",
        race: "DOG",
        class: "DOG_WILD",
        gender: "MALE",
        size: "Medium",
        movement: 12,
        immunities: ["magicalBeast"],
        items: { remove: ["P1-6"] },
        script: { remove: ["PSPIDER"], location: "Default" },
      },
    });
    blinkDog.createBlink();
    blinkDog.createJaws(1, 6);
    blinkDog.setBehavior({ abilities: [this.ability(Ids.Blink)] });
    return blinkDog;
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
        bonusHp: 0,
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
        size: "Medium",
        movement: 15,
        items: {
          remove: ["FIGRING3", "IPSION", "BDSPIRIM", "DOGWAWP", "BDSHA01C"],
        },
        script: { remove: ["WARDOG"], location: "Default" },
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
    spectralHound.createJaws(2, 6, astralPlaneShift);
    return spectralHound;
  }
}

export const createDogs = () => new DogFamily();
