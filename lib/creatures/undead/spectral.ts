/**
 * Incorporeal / spectral undead: banshee, shadow, greater shadow, spectre, ghost.
 *
 * Shared weapon primitives live on `Undead` (undead-creature.ts); ability ids in ids.ts.
 */
import { EXISTING_ITEMS } from "../../config/item";
import { SPELLS } from "../../config/spells/spell-names";
import { CommonProjectileFiles } from "../../spells/projectiles";
import effectFactory from "../../src/factories/effect.factory";
import { JEWEL_SLOTS } from "../../src/model/creature/item";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../../src/model/spell-item/spell-protection";
import { MonsterEnum } from "../monster";
import type { UndeadFamily } from "./family";
import { Ids } from "./ids";
import { Undead } from "./undead-creature";

function bansheeFearAura(cre: Undead) {
  return cre.addSpell({
    name: "monster.undead.ability.bansheeFearAura.name",
    description: "monster.undead.ability.bansheeFearAura.description",
    id: Ids.BansheeFearAura,
    memorizedCount: 1,
    icon: SPELLS.Priest.CloakOfFear.file,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    options: { renew: 1 },
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        speed: 1,
        projectile: CommonProjectileFiles.AreaOfSightNonParty,
        range: 30,
        effects: effectFactory.fear({
          duration: Durations.turn,
          saveType: SaveTypeEnum.Spell,
        }),
      },
    ],
    ability: {
      preset: SPELLS.Priest.CloakOfFear.file,
      spell: {
        type: "force",
        remove: true,
      },
    },
  });
}

function deathWail(cre: Undead) {
  return cre.addSpell({
    name: "monster.undead.ability.deathWail.name",
    description: "monster.undead.ability.deathWail.description",
    id: Ids.DeathWail,
    memorizedCount: 1,
    icon: SPELLS.Wizard.WailOfTheBanshee.file,
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        speed: 1,
        projectile: CommonProjectileFiles.AreaOfSightNonParty,
        range: 30,
        effects: [
          {
            opcode: EffectTypeEnum.Slay,
            idsFile: EffectIDSFileEnum.EA,
            idsEntry: "ANYONE",
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            saveTypes: [SaveTypeEnum.Spell],
          },
          {
            opcode: EffectTypeEnum.LightingEffects,
            effect: LightingEffectEnum.HitFingerOfDeath,
            lightingTarget: LightingEffectTargetEnum.SpellTarget,
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            saveTypes: [SaveTypeEnum.Spell],
          },
          {
            opcode: EffectTypeEnum.PlaySound,
            resource: "CAS_M07",
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            saveTypes: [SaveTypeEnum.Spell],
          },
        ],
      },
    ],
    ability: {
      preset: SPELLS.Wizard.WailOfTheBanshee.file,
      spell: {
        type: "force",
        remove: true,
      },
    },
  });
}

function ghostFearAura(cre: Undead) {
  // causes any humanoid being to age 10 years and flee in panic for 8 turns unless a saving throw versus spell is made.
  // all humanoids above 8th level may add +2 to their saving throws.
  // Priests above 6th level are immune to this effect,
  const saveType = SaveTypeEnum.Spell;
  return cre.addSpell({
    name: "monster.undead.ability.ghostFearAura.name",
    description: "monster.undead.ability.ghostFearAura.description",
    id: Ids.GhostFearAura,
    memorizedCount: 1,
    icon: SPELLS.Priest.CloakOfFear.file,
    options: { renew: 2 },
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        speed: 0,
        projectile: CommonProjectileFiles.AreaOfSightNonParty,
        range: 30,
        effects: [
          {
            opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
            type: {
              stat: SpellProtectionStat.General,
              relation: SpellProtectionRelation.NotEqual,
            },
            value: "HUMANOID",
            timing: EffectTimingEnum.InstantLimited,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            duration: 1,
          },
          {
            opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
            type: "CLERIC",
            timing: EffectTimingEnum.InstantLimited,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            minLevel: 7,
            duration: 1,
          },
          ...effectFactory.fear({
            saveType,
            duration: 8 * Durations.turn,
            saveBonus: 0,
            minLevel: 1,
            maxLevel: 7,
            stringRef: "monster.undead.ability.ghostFearAura.frightened",
          }),
          ...effectFactory.fear({
            saveType,
            duration: 8 * Durations.turn,
            saveBonus: 2,
            minLevel: 8,
            stringRef: "monster.undead.ability.ghostFearAura.frightened",
          }),
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            timing: EffectTimingEnum.InstantLimited,
            duration: Durations.turn,
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
    },
  });
}

function ghostTouch(cre: Undead) {
  return cre.addSpell({
    name: "monster.undead.ability.ghostTouch.name",
    description: "monster.undead.ability.ghostTouch.description",
    id: Ids.GhostTouch,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        range: 5,
        effects: [
          // TODO: If they strike an opponent it ages him 10-40 (1d4x10) years.
          ...effectFactory.levelDrain({
            levels: 2,
          }),
          {
            opcode: EffectTypeEnum.Damage,
            type: EffectDamageTypeEnum.Magic,
            amount: 10,
            dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
          },
        ],
      },
    ],
  });
}

function specterTouch(cre: Undead) {
  return cre.addSpell({
    name: "monster.undead.ability.specterTouch.name",
    description: "monster.undead.ability.specterTouch.description",
    id: Ids.SpecterTouch,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        range: 5,
        effects: [
          ...effectFactory.levelDrain({
            levels: 2,
          }),
        ],
      },
    ],
  });
}

export function banshee(family: UndeadFamily): Undead {
  const banshee = family.create({
    monster: MonsterEnum.Banshee,
    name: "monster.undead.name.banshee",
    files: [],
    data: {
      level1: { pnpValue: 7, value: 17, type: "turn" }, // to approximate their "turned as special undead" from PnP
      strength: 9,
      dexterity: 14,
      constitution: 9,
      intelligence: 16,
      wisdom: 11,
      charisma: 17,
      ac: 0,
      apr: 1,
      xpv: 4000,
      alignment: "CHAOTIC_EVIL",
      morale: 13,
      general: "UNDEAD",
      race: "WRAITH",
      class: "SPECTRE",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 15,
      immunities: ["undead"],
      items: {
        remove: ["IMMUNE1", "B1-8M2", "IMMCHS", "S1-8", "RING95"],
      },
      script: {
        remove: ["BDBANSH", "banshe01", "f_wailin"],
      },
    },
  });
  bansheeFearAura(banshee);
  deathWail(banshee);
  banshee.addTrait({
    immunities: ["nonMagicalWeapons", "magicResistance", "incorporeal", "cold", "lightning"],
  });
  banshee.createTouch({
    diceThrown: 1,
    diceSize: 8,
    slot: "WEAPON1",
  });
  banshee.setBehavior({
    restHeal: true,
    abilities: [family.ability(Ids.DeathWail), family.ability(Ids.BansheeFearAura)],
  });
  return banshee;
}

export function shadow(family: UndeadFamily): Undead {
  const shadow = family.create({
    monster: MonsterEnum.Shadow,
    name: "monster.undead.name.shadow",
    files: [],
    data: {
      level1: 3,
      bonusHp: 3,
      strength: 6,
      dexterity: 14,
      constitution: 9,
      intelligence: 7,
      wisdom: 10,
      charisma: 8,
      ac: 7,
      apr: 1,
      xpv: 420,
      alignment: "CHAOTIC_EVIL",
      morale: 20,
      general: "MONSTER",
      race: "SHADOW",
      class: "SHADOW",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      immunities: ["undead"],
      items: {
        remove: [
          "immune1",
          "undtype",
          "ring95",
          "shadowwp",
          "s1-8",
          "s1-12m2",
          "ac#fpmds",
          "shadowsu",
        ],
      },
      script: {
        remove: ["SEWSHA03", "attack"],
      },
    },
  });
  shadow.addTrait({ immunities: ["cold", "incorporeal"] });
  shadow.createShadowWeapon({
    diceThrown: 1,
    diceSize: 4,
    damageBonus: 1,
    opcode: EffectTypeEnum.StrengthBonus,
    drainValue: -1,
  });
  const mindWeapon = shadow.createShadowWeapon({
    diceThrown: 1,
    diceSize: 4,
    damageBonus: 1,
    opcode: EffectTypeEnum.WisdomBonus,
    drainValue: -2,
    equipped: false,
  });
  shadow.setAdjustments([
    {
      files: ["va#shdgl"],
      data: {
        script: { location: "None" },
      },
    },
    {
      files: ["AC#FPMDS"],
      data: {
        items: { equipped: [{ file: mindWeapon.file, slot: "WEAPON1" }] },
      },
    },
    {
      files: ["BDSHAD02", "L#GNOAL", "L#GNOEN"],
      data: { level1: 5, xpv: 650, strength: 18 },
    },
  ]);
  shadow.setBehavior({
    restHeal: true,
  });
  return shadow;
}

export function greaterShadow(family: UndeadFamily): Undead {
  // The largest greater shadow, composed of eight undead shadows,
  // has 8+8 HD and THAC0 11.
  // Regardless of its size, the creature has AC 7.
  // It receives a number of attacks per round equal to; the number of incorporated shadows.
  const greaterShadow = family.createFrom({
    name: "monster.undead.name.greaterShadow",
    monster: MonsterEnum.GreaterShadow,
    from: family.creature(MonsterEnum.Shadow),
  });
  greaterShadow.setData({
    level1: 8,
    bonusHp: 8,
    apr: 8,
    xpv: 3000,
    items: {
      remove: ["BDSHADGR", "BDSPECTQ", "BDSHADGA"],
      equipped: [{ file: EXISTING_ITEMS.InvisibilityRing, slot: JEWEL_SLOTS }],
    },
  });
  greaterShadow.setAdjustments([]);
  return greaterShadow;
}

export function greaterShadow5e(family: UndeadFamily): Undead {
  const greaterShadow = family.create({
    monster: MonsterEnum.GreaterShadow,
    name: "monster.undead.name.greaterShadow",
    files: [],
    data: {
      level1: 8,
      bonusHp: 8,
      strength: 10,
      dexterity: 16,
      constitution: 9,
      intelligence: 11,
      wisdom: 14,
      charisma: 12,
      ac: 7,
      apr: 1,
      xpv: 3000,
      alignment: "CHAOTIC_EVIL",
      morale: 20,
      general: "MONSTER",
      race: "SHADOW",
      class: "SHADOW",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      immunities: ["undead"],
      items: {
        remove: ["BDSHADGR", "immune1", "ring95", "BDSHADGA"],
      },
      script: {
        location: "None",
      },
    },
  });
  greaterShadow.addTrait({ immunities: ["cold", "incorporeal"] });
  greaterShadow.createShadowWeapon({
    diceThrown: 2,
    diceSize: 6,
    damageBonus: 2,
    opcode: EffectTypeEnum.StrengthBonus,
    drainValue: -3,
  });
  greaterShadow.setBehavior({
    restHeal: true,
  });
  greaterShadow.setAdjustments([]);
  return greaterShadow;
}

export function spectre(family: UndeadFamily): Undead {
  const spectre = family.create({
    monster: MonsterEnum.Spectre,
    name: "monster.undead.name.spectre",
    files: [],
    data: {
      level1: 7,
      bonusHp: 3,
      strength: 1,
      dexterity: 14,
      constitution: 9,
      intelligence: 14,
      wisdom: 10,
      charisma: 11,
      ac: 2,
      apr: 1,
      xpv: 3000,
      alignment: "LAWFUL_EVIL",
      morale: 15,
      general: "UNDEAD",
      race: "SPECTRE",
      class: "SPECTRE",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 15, // flying 30
      immunities: ["undead"],
    },
  });
  spectre.addTrait({
    immunities: ["cold", "incorporeal"],
  });
  specterTouch(spectre);
  spectre.createClaws({
    diceThrown: 1,
    diceSize: 8,
    castSpell: {
      spell: family.spell(Ids.SpecterTouch).file,
    },
  });
  spectre.setBehavior({
    dialog: [],
  });
  return spectre;
}

export function ghost(family: UndeadFamily): Undead {
  const ghost = family.create({
    monster: MonsterEnum.Ghost,
    name: "monster.undead.name.ghost",
    files: [],
    data: {
      level1: 10,
      strength: 7,
      dexterity: 13,
      constitution: 9,
      intelligence: 14,
      wisdom: 12,
      charisma: 17,
      ac: 0,
      apr: 1,
      xpv: 7000,
      alignment: "LAWFUL_EVIL",
      morale: 15,
      general: "UNDEAD",
      race: "SPECTRE",
      class: "SPECTRE",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 9,
      immunities: ["undead"],
      items: {
        remove: ["bdringgh", "bdghost", "immune1", "ring94", "ghost", "helm15"],
      },
      script: {
        remove: ["bdghost", "shoutdl2"],
      },
    },
  });
  ghost.addTrait({
    immunities: ["cold", "incorporeal"],
  });
  ghostFearAura(ghost);
  ghostTouch(ghost);
  ghost.createClaws({
    diceThrown: 0,
    diceSize: 0,
    castSpell: {
      spell: family.spell(Ids.GhostTouch).file,
    },
  });
  ghost.setBehavior({
    dialog: ["daitel"],
    abilities: [
      family.ability(Ids.GhostFearAura),
      family.preset(SPELLS.Wizard.Vocalize.file),
      family.preset(SPELLS.Wizard.ShadowDoor.file),
      family.preset(SPELLS.Wizard.ProtectionFromMagicalWeapons.file),
      family.preset(SPELLS.Wizard.Stoneskin.file),
      family.preset(SPELLS.Wizard.MinorGlobeOfInvulnerability.file),
      family.preset(SPELLS.Wizard.ProtectionFromMissiles.file),
      family.preset(SPELLS.Wizard.MinorSpellDeflection.file),
      family.preset(SPELLS.Wizard.MirrorImages.file),
      family.preset(SPELLS.Wizard.Shield.file),
      family.preset(SPELLS.Wizard.FireShield.file),
      family.preset(SPELLS.Wizard.Breach.file),
      family.preset(SPELLS.Wizard.SpellThrust.file),
      family.preset(SPELLS.Wizard.DispelMagic.file),
      family.preset(SPELLS.Wizard.RemoveMagic.file),
      family.preset(SPELLS.Wizard.ChainLightning.file),
      family.preset(SPELLS.Wizard.Cloudkill.file),
      family.preset(SPELLS.Wizard.Fireburst.file),
      family.preset(SPELLS.Wizard.ConeOfCold.file),
      family.preset(SPELLS.Wizard.GreaterMalison.file),
      family.preset(SPELLS.Wizard.Confusion.file),
      family.preset(SPELLS.Wizard.TeleportField.file),
      family.preset(SPELLS.Wizard.VitriolicSphere.file),
      family.preset(SPELLS.Wizard.MordenkainenForceMissiles.file),
      family.preset(SPELLS.Wizard.Slow.file),
      family.preset(SPELLS.Wizard.FlameArrow.file),
      family.preset(SPELLS.Wizard.LightningBolt.file),
      family.preset(SPELLS.Wizard.HoldPerson.file),
      family.minorSequencer([SPELLS.Wizard.MirrorImages.file, SPELLS.Wizard.Blur.file]),
      family.minorSequencer([SPELLS.Wizard.Web.file, SPELLS.Wizard.Combust.file]),
      family.preset(SPELLS.Wizard.Combust.file),
      family.preset(SPELLS.Wizard.MelfAcidArrow.file),
      family.preset(SPELLS.Wizard.AgannazarScorcher.file),
      family.preset(SPELLS.Wizard.ObscuringMist.file),
      family.preset(SPELLS.Wizard.Spook.file),
      family.preset(SPELLS.Wizard.MagicMissiles.file),
      family.preset(SPELLS.Wizard.BurningHands.file),
    ],
    spellcaster: {},
  });
  ghost.setAdjustments([
    {
      files: ["BDLITLA"],
      data: {},
    },
  ]);
  return ghost;
}
