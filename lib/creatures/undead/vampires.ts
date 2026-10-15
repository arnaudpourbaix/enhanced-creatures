/**
 * Vampires, by age category (Van Richten's Guide to Vampires, "Powers by Age"):
 * fledgling, mature, old, very old, ancient, eminent, patriarch.
 *
 * Every age is built from the same table row (see VAMPIRE_AGES), so a vampire's powers only
 * differ by what the table says.
 */
import { SPELLS } from "../../config/spells/spell-database";
import effectFactory from "../../src/factories/effect.factory";
import { TranslationKey } from "../../translations/i18n";
import { ImmunityName } from "../../src/model/final/immunity";
import { StringReference } from "../../src/model/final/stringref";
import { Durations } from "../../src/model/game-data/durations";
import { Effect } from "../../src/model/spell-item/effect";
import {
  CharmTypeEnum,
  EffectDispelResistanceEnum,
  EffectStatisticModifierEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { SpellKeyword } from "../../config/spells/keyword";
import { MonsterEnum } from "../monster";
import type { UndeadFamily } from "./family";
import { Ids } from "./ids";
import type { TurnUndeadType } from "./turn-level";
import { Undead } from "./undead-creature";

/**
 * How a vampire dominates its victims: younger vampires must meet their eyes, ancient and eminent
 * ones only need to be heard, and a patriarch needs neither.
 */
type DominationMode = "gaze" | "voice" | "will";

interface VampireAge {
  monster: MonsterEnum;
  name: TranslationKey;
  level1: number;
  bonusHp: number;
  /** PHB: vampires are turned as vampires, as ghosts with 10 HD, as liches with 11+ HD. */
  turnAs: TurnUndeadType;
  strength: number;
  exceptionalStrength?: number;
  intelligence: number;
  dexterity: number;
  charisma: number;
  movement: number;
  xpv: number;
  domination: { id: Ids; mode: DominationMode; saveBonus: number };
  /** Weapon needed to hit: immune to every weapon below it */
  weaponImmunity: ImmunityName;
  regeneration: number;
  magicResistance: number;
}

const VAMPIRE_AGES: VampireAge[] = [
  {
    monster: MonsterEnum.VampireFledgling,
    name: "monster.undead.name.fledglingVampire",
    level1: 8,
    bonusHp: 3,
    turnAs: "vampire",
    strength: 18,
    exceptionalStrength: 76,
    intelligence: 16,
    dexterity: 16,
    charisma: 14,
    movement: 12,
    xpv: 8000,
    domination: { id: Ids.VampireFledglingDomination, mode: "gaze", saveBonus: -2 },
    weaponImmunity: "nonMagicalWeapons",
    regeneration: 3,
    magicResistance: 0,
  },
  {
    monster: MonsterEnum.VampireMature,
    name: "monster.undead.name.matureVampire",
    level1: 9,
    bonusHp: 3,
    turnAs: "vampire",
    strength: 18, // the table says 19/91, which can't exist: read as 18/91
    exceptionalStrength: 91,
    intelligence: 16,
    dexterity: 17,
    charisma: 15,
    movement: 15,
    xpv: 9000,
    domination: { id: Ids.VampireMatureDomination, mode: "gaze", saveBonus: -2 },
    weaponImmunity: "nonMagicalWeapons",
    regeneration: 3,
    magicResistance: 5,
  },
  {
    monster: MonsterEnum.VampireOld,
    name: "monster.undead.name.oldVampire",
    level1: 10,
    bonusHp: 2,
    turnAs: "ghost",
    strength: 18,
    exceptionalStrength: 100,
    intelligence: 17,
    dexterity: 17,
    charisma: 16,
    movement: 15,
    xpv: 11000,
    domination: { id: Ids.VampireOldDomination, mode: "gaze", saveBonus: -3 },
    weaponImmunity: "plusOneWeapons",
    regeneration: 3,
    magicResistance: 10,
  },
  {
    monster: MonsterEnum.VampireVeryOld,
    name: "monster.undead.name.veryOldVampire",
    level1: 11,
    bonusHp: 1,
    turnAs: "lich",
    strength: 18,
    exceptionalStrength: 100,
    intelligence: 18,
    dexterity: 18,
    charisma: 17,
    movement: 18,
    xpv: 12000,
    domination: { id: Ids.VampireVeryOldDomination, mode: "gaze", saveBonus: -3 },
    weaponImmunity: "plusOneWeapons",
    regeneration: 4,
    magicResistance: 15,
  },
  {
    monster: MonsterEnum.VampireAncient,
    name: "monster.undead.name.ancientVampire",
    level1: 12,
    bonusHp: 0,
    turnAs: "lich",
    strength: 19,
    intelligence: 18,
    dexterity: 18,
    charisma: 18,
    movement: 18,
    xpv: 14000,
    domination: { id: Ids.VampireAncientDomination, mode: "voice", saveBonus: -4 },
    weaponImmunity: "plusTwoWeapons",
    regeneration: 4,
    magicResistance: 20,
  },
  {
    monster: MonsterEnum.VampireEminent,
    name: "monster.undead.name.eminentVampire",
    level1: 13,
    bonusHp: 0,
    turnAs: "lich",
    strength: 20,
    intelligence: 19,
    dexterity: 19,
    charisma: 18,
    movement: 21,
    xpv: 15000,
    domination: { id: Ids.VampireEminentDomination, mode: "voice", saveBonus: -4 },
    weaponImmunity: "plusTwoWeapons",
    regeneration: 4,
    magicResistance: 25,
  },
  {
    monster: MonsterEnum.VampirePatriarch,
    name: "monster.undead.name.patriarchVampire",
    level1: 14,
    bonusHp: 0,
    turnAs: "lich",
    strength: 21,
    intelligence: 20,
    dexterity: 20,
    charisma: 19,
    movement: 24,
    xpv: 17000,
    domination: { id: Ids.VampirePatriarchDomination, mode: "will", saveBonus: -5 },
    weaponImmunity: "plusThreeWeapons",
    regeneration: 5,
    magicResistance: 30,
  },
];

const DOMINATION_TEXTS: Record<
  DominationMode,
  { name: StringReference; description: StringReference; keywords: SpellKeyword[] }
> = {
  gaze: {
    name: "monster.undead.ability.vampireDomination.gazeName",
    description: "monster.undead.ability.vampireDomination.gazeDescription",
    keywords: ["charm", "gaze"],
  },
  voice: {
    name: "monster.undead.ability.vampireDomination.voiceName",
    description: "monster.undead.ability.vampireDomination.voiceDescription",
    keywords: ["charm"],
  },
  will: {
    name: "monster.undead.ability.vampireDomination.willName",
    description: "monster.undead.ability.vampireDomination.willDescription",
    keywords: ["charm"],
  },
};

/**
 * Domination: any person dominated by the vampire is affected as if by a charm person spell, with
 * a saving throw vs. spell penalty that grows with the vampire's age.
 * A gaze needs the victim to meet the vampire's eyes: it is blocked by gaze attack immunity, and
 * the vampire doesn't try it on blinded creatures. Voice and will don't have these limits, but a
 * silenced vampire can't use its voice.
 */
function domination(cre: Undead, domination: VampireAge["domination"]) {
  const texts = DOMINATION_TEXTS[domination.mode];
  return cre.addSpell({
    name: texts.name,
    description: texts.description,
    id: domination.id,
    memorizedCount: 1,
    icon: SPELLS.Wizard.Domination.file,
    primaryType: ItemAbilityPrimaryTypeEnum.Enchanter,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    keywords: texts.keywords,
    // usable every round, like the original SPIN883 (removes itself, re-added 1 round later)
    options: { renew: 1 },
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        range: 30,
        speed: 1,
        // like the original SPIN883, so protections from gaze projectiles (e.g. blindness) apply
        projectile: domination.mode === "gaze" ? "GAZE" : undefined,
        effects: effectFactory.charm({
          charmType: CharmTypeEnum.HostileDomination,
          duration: 8 * Durations.round,
          dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
          saveType: SaveTypeEnum.Spell,
          saveBonus: domination.saveBonus,
        }),
      },
    ],
    ability: {
      preset: SPELLS.Wizard.CharmPerson.file,
      requireVocal: domination.mode === "voice",
      spell: {
        type: "force",
        excludeStateChecks: domination.mode === "gaze" ? ["STATE_BLIND"] : undefined,
      },
      // not always the first thing a vampire does
      probability: 50,
    },
  });
}

function vampire(family: UndeadFamily, age: VampireAge): Undead {
  const cre = family.create({
    monster: age.monster,
    name: age.name,
    files: [],
    data: {
      level1: age.level1,
      bonusHp: age.bonusHp,
      strength: age.strength,
      exceptionalStrength: age.exceptionalStrength,
      dexterity: age.dexterity,
      constitution: 18,
      intelligence: age.intelligence,
      wisdom: 15,
      charisma: age.charisma,
      ac: 1,
      apr: 1,
      xpv: age.xpv,
      alignment: "CHAOTIC_EVIL",
      morale: 16,
      general: "UNDEAD",
      race: "VAMPIRE",
      class: "VAMPIRE",
      size: { value: "Medium", tall: true, long: false },
      movement: age.movement, // Fl 18 in mist form
      immunities: ["undead"],
      moveSilent: 100,
      items: {
        remove: [
          "ring95",
          "immune1",
          "immune2",
          "immune3",
          "vamp",
          "vamp1",
          "vamp2",
          "vamp3",
          "vampreg",
          "vampreg1",
          "vampreg2",
        ],
      },
      script: {
        remove: ["vampir01", "ppvampir"],
      },
    },
  });
  cre.createClaws({
    diceThrown: 1,
    diceSize: 6,
    effects: effectFactory.levelDrain({ levels: 2 }),
  });
  const effects: Effect[] = [effectFactory.regeneration(age.regeneration)];
  if (age.magicResistance) {
    effects.push({
      opcode: EffectTypeEnum.MagicResistanceModifier,
      type: EffectStatisticModifierEnum.Set,
      value: age.magicResistance,
    });
  }
  cre.addTrait({
    immunities: [age.weaponImmunity, "coldResistance", "lightningResistance"],
    effects,
  });
  domination(cre, age.domination);
  cre.setBehavior({
    restHeal: true,
    abilities: [cre.ability(age.domination.id)],
  });
  cre.turnAs = age.turnAs;
  return cre;
}

export const fledglingVampire = (family: UndeadFamily) => vampire(family, VAMPIRE_AGES[0]);
export const matureVampire = (family: UndeadFamily) => vampire(family, VAMPIRE_AGES[1]);
export const oldVampire = (family: UndeadFamily) => vampire(family, VAMPIRE_AGES[2]);
export const veryOldVampire = (family: UndeadFamily) => vampire(family, VAMPIRE_AGES[3]);
export const ancientVampire = (family: UndeadFamily) => vampire(family, VAMPIRE_AGES[4]);
export const eminentVampire = (family: UndeadFamily) => vampire(family, VAMPIRE_AGES[5]);
export const patriarchVampire = (family: UndeadFamily) => vampire(family, VAMPIRE_AGES[6]);
