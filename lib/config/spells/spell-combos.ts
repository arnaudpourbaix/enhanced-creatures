import {
  chainContingency,
  contingency,
  minorSequencer,
  registerComboGroups,
  SpellCombo,
  spellSequencer,
} from "../../src/model/spell-item/spell-combo";
import { FNP_SPELLS } from "./fnp-spell-database";
import { SPELLS } from "./spell-database";

const s = SPELLS.Wizard;
const p = SPELLS.Priest;

/** The spells a combo may hold: wizard and priest ones. */
const COMBO_SPELLS = [
  ...Object.values(SPELLS.Wizard),
  ...Object.values(SPELLS.Priest),
  ...Object.values(FNP_SPELLS.Priest),
];

/** Wizard sequencers and contingencies, one group per kind: `COMBOS.Contingencies.Stoneskin`. */
export const COMBOS = registerComboGroups(
  {
    MinorSequencers: {
      LarlochMinorDrain: minorSequencer([s.LarlochMinorDrain, s.LarlochMinorDrain]),
      MagicMissiles: minorSequencer([s.MagicMissiles, s.MagicMissiles]),
      RayOfEnfeeblement: minorSequencer([s.RayOfEnfeeblement, s.RayOfEnfeeblement]),
      MirrorBlur: minorSequencer([s.MirrorImages, s.Blur]),
      MelfAcidArrow: minorSequencer([s.MelfAcidArrow, s.MelfAcidArrow]),
      Sleep: minorSequencer([s.Sleep, s.Sleep]),
      MonsterSummoning2: minorSequencer([s.MonsterSummoning2, s.MonsterSummoning2]),
      ColorSpray: minorSequencer([s.ColorSpray, s.ColorSpray]),
      ChromaticOrb: minorSequencer([s.ChromaticOrb, s.ChromaticOrb]),
      BurningHands: minorSequencer([s.BurningHands, s.BurningHands]),
      SnillocsSnowballSwarm: minorSequencer([s.SnillocsSnowballSwarm, s.SnillocsSnowballSwarm]),
      BatteringRam: minorSequencer([s.BatteringRam, s.BatteringRam]),
      Deafness: minorSequencer([s.Deafness, s.Deafness]),
      CharmPerson: minorSequencer([s.CharmPerson, s.CharmPerson]),
      EnfeeblementBlindness: minorSequencer([s.RayOfEnfeeblement, s.Blindness]),
      Horror: minorSequencer([s.Horror, s.Horror]),
      MirrorInvisibility: minorSequencer([s.MirrorImages, s.Invisibility]),
      MirrorShield: minorSequencer([s.MirrorImages, s.Shield]),
      StinkingCloudWeb: minorSequencer([s.StinkingCloud, s.Web]),
      Web: minorSequencer([s.Web, s.Web]),
      IceKnife: minorSequencer([s.IceKnife, s.IceKnife]),
      Combust: minorSequencer([s.Combust, s.Combust]),
      MinorLightningBolt: minorSequencer([s.MinorLightningBolt, s.MinorLightningBolt]),
    },
    SpellSequencers: {
      Lifedrain: spellSequencer([s.VampiricTouch, s.LarlochMinorDrain, s.LarlochMinorDrain]),
      BurningBloodSkulltrap: spellSequencer([s.BeltynsBurningBlood, s.SkullTrap, s.SkullTrap]),
      EmotionSlow: spellSequencer([s.EmotionHopelessness, s.EmotionHopelessness, s.Slow]),
      StoneskinsGlobe: spellSequencer([s.Stoneskin, s.MinorGlobeOfInvulnerability, s.SpiritArmor]),
      DeflectionInvisibilityGlobe: spellSequencer([
        s.MinorSpellDeflection,
        s.ImprovedInvisibility,
        s.MinorGlobeOfInvulnerability,
      ]),
      DeflectionInvisibilitySummon: spellSequencer([
        s.MinorSpellDeflection,
        s.ImprovedInvisibility,
        s.MonsterSummoning4,
      ]),
      DeflectionInvisibilityFireShield: spellSequencer([
        s.MinorSpellDeflection,
        s.ImprovedInvisibility,
        s.FireShield,
      ]),
      InvisibilityMirrorBlur: spellSequencer([s.ImprovedInvisibility, s.MirrorImages, s.Blur]),
      DeflectionInvisibilityMirror: spellSequencer([
        s.MinorSpellDeflection,
        s.ImprovedInvisibility,
        s.MirrorImages,
      ]),
      DeflectionGlobeFireShield: spellSequencer([
        s.MinorSpellDeflection,
        s.MinorGlobeOfInvulnerability,
        s.FireShield,
      ]),
      DeflectionFireShieldSummon: spellSequencer([
        s.MinorSpellDeflection,
        s.FireShield,
        s.MonsterSummoning4,
      ]),
      DeflectionSummonGlobe: spellSequencer([
        s.MinorSpellDeflection,
        s.MonsterSummoning4,
        s.MinorGlobeOfInvulnerability,
      ]),
      InvisibilityStoneskinDeflection: spellSequencer([
        s.ImprovedInvisibility,
        s.Stoneskin,
        s.MinorSpellDeflection,
      ]),
      InvisibilityStoneskinMirror: spellSequencer([
        s.ImprovedInvisibility,
        s.Stoneskin,
        s.MirrorImages,
      ]),
      InvisibilityStoneskinTeleportField: spellSequencer([
        s.ImprovedInvisibility,
        s.Stoneskin,
        s.TeleportField,
      ]),
      InvisibilityStoneskinShield: spellSequencer([s.ImprovedInvisibility, s.Stoneskin, s.Shield]),
      DeflectionStoneskinGhostArmor: spellSequencer([
        s.MinorSpellDeflection,
        s.Stoneskin,
        s.GhostArmor,
      ]),
      DeflectionStoneskinTeleportField: spellSequencer([
        s.MinorSpellDeflection,
        s.Stoneskin,
        s.TeleportField,
      ]),
      DeflectionGlobeStoneskin: spellSequencer([
        s.MinorSpellDeflection,
        s.MinorGlobeOfInvulnerability,
        s.Stoneskin,
      ]),
      FireShieldGlobeStoneskin: spellSequencer([
        s.FireShield,
        s.MinorGlobeOfInvulnerability,
        s.Stoneskin,
      ]),
      DeflectionStoneskinShield: spellSequencer([s.MinorSpellDeflection, s.Stoneskin, s.Shield]),
      DeflectionStoneskinSpiritArmor: spellSequencer([
        s.MinorSpellDeflection,
        s.Stoneskin,
        s.SpiritArmor,
      ]),
      DeflectionTeleportFieldSpiritArmor: spellSequencer([
        s.MinorSpellDeflection,
        s.TeleportField,
        s.SpiritArmor,
      ]),
      Fireball: spellSequencer([s.Fireball, s.Fireball, s.Fireball]),
      Shout: spellSequencer([s.Shout, s.Shout, s.Shout]),
      LightningBolt: spellSequencer([s.LightningBolt, s.LightningBolt, s.LightningBolt]),
      LanceLightningIceLance: spellSequencer([s.LanceOfDisruption, s.LightningBolt, s.IceLance]),
      IceLance: spellSequencer([s.IceLance, s.IceLance, s.IceLance]),
      MordenkainenForceMissiles: spellSequencer([
        s.MordenkainenForceMissiles,
        s.MordenkainenForceMissiles,
        s.MordenkainenForceMissiles,
      ]),
      FlameArrow: spellSequencer([s.FlameArrow, s.FlameArrow, s.FlameArrow]),
      VitriolicSphere: spellSequencer([s.VitriolicSphere, s.VitriolicSphere, s.VitriolicSphere]),
      WebSummon: spellSequencer([s.Web, s.MonsterSummoning4, s.MonsterSummoning4]),
      DireCharm: spellSequencer([s.DireCharm, s.DireCharm, s.DireCharm]),
      SkullTrap: spellSequencer([s.SkullTrap, s.SkullTrap, s.SkullTrap]),
      ConfusionHopelessnessSlow: spellSequencer([s.Confusion, s.EmotionHopelessness, s.Slow]),
      HopelessnessSummon: spellSequencer([
        s.EmotionHopelessness,
        s.EmotionHopelessness,
        s.MonsterSummoning4,
      ]),
      FearHopelessnessConfusion: spellSequencer([
        s.EmotionFear,
        s.EmotionHopelessness,
        s.Confusion,
      ]),
      RemoveMagic: spellSequencer([s.RemoveMagic, s.RemoveMagic, s.RemoveMagic]),
      IceStorm: spellSequencer([s.IceStorm, s.IceStorm, s.IceStorm]),
      UnholyBlight: spellSequencer([p.UnholyBlight, p.UnholyBlight, p.UnholyBlight]),
      CallWoodlandBeings: spellSequencer([
        p.CallWoodlandBeeings,
        p.CallWoodlandBeeings,
        p.CallWoodlandBeeings,
      ]),
      Poison: spellSequencer([p.Poison, p.Poison, p.Poison]),
      TurnPebbleToBoulder: spellSequencer([
        s.TurnPebbleToBoulder,
        s.TurnPebbleToBoulder,
        s.TurnPebbleToBoulder,
      ]),
    },
    Contingencies: {
      OtilukesResilientSphere: contingency("helpless", [s.OtilukesResilientSphere]),
      Stoneskin: contingency("hp50", [s.Stoneskin]),
      ImprovedHaste: contingency("hit", [s.ImprovedHaste]),
      TrueSeeing: contingency("seeEnemy", [s.TrueSeeing]),
      ProtectionFromMagicalWeapons: contingency("hit", [s.ProtectionFromMagicalWeapons]),
      ProtectionFromMagicEnergy: contingency("seeEnemy", [s.ProtectionFromMagicEnergy]),
      MassInvisibility: contingency("seeEnemy", [s.MassInvisibility]),
      PrismaticMantle: contingency("hit", [s.PrismaticMantle]),
      MomentOfPrescience: contingency("hit", [s.MomentOfPrescience]),
      ProtectionFromMagicalWeaponsSeeEnemy: contingency("seeEnemy", [
        s.ProtectionFromMagicalWeapons,
      ]),
      SpellShield: contingency("seeEnemy", [s.SpellShield]),
      ImprovedInvisibility: contingency("seeEnemy", [s.ImprovedInvisibility]),
      MinorGlobeOfInvulnerability: contingency("seeEnemy", [s.MinorGlobeOfInvulnerability]),
      GlobeOfInvulnerability: contingency("seeEnemy", [s.GlobeOfInvulnerability]),
      SpellDeflection: contingency("seeEnemy", [s.SpellDeflection]),
    },
    ChainContingencies: {
      ProtectAndSummon: chainContingency(
        "seeEnemy",
        [s.MomentOfPrescience, s.ProtectionFromEnergy, s.MonsterSummoning8],
        "self",
      ),
      Efreeti: chainContingency(
        "seeEnemy",
        [s.SummonEfreeti, s.SummonEfreeti, s.ProtectionFromMagicalWeapons],
        "self",
      ),
      WaterElementals: chainContingency(
        "seeEnemy",
        [s.ConjureWaterElemental, s.ConjureWaterElemental, s.ProtectionFromMagicalWeapons],
        "self",
      ),
      EarthElementals: chainContingency(
        "seeEnemy",
        [s.ConjureEarthElemental, s.ConjureEarthElemental, s.ProtectionFromMagicalWeapons],
        "self",
      ),
      SpellShieldDjinni: chainContingency(
        "seeEnemy",
        [s.SpellShield, s.SummonDjinni, s.SummonDjinni],
        "self",
      ),
      SpellShieldNishruu: chainContingency(
        "seeEnemy",
        [s.SpellShield, s.SummonHakeashar, s.SummonHakeashar],
        "self",
      ),
      Genies: chainContingency(
        "seeEnemy",
        [s.SummonEfreeti, s.SummonDjinni, s.SummonHakeashar],
        "self",
      ),
      NishruuInvisibility: chainContingency(
        "seeEnemy",
        [s.SummonHakeashar, s.SummonHakeashar, s.MassInvisibility],
        "self",
      ),
      SpellShieldSwords: chainContingency(
        "seeEnemy",
        [s.SpellShield, s.MordenkainensSword, s.MordenkainensSword],
        "self",
      ),
      SwordsInvisibility: chainContingency(
        "seeEnemy",
        [s.MordenkainensSword, s.MordenkainensSword, s.MassInvisibility],
        "self",
      ),
      SpellShieldDeflectionGlobe: chainContingency(
        "seeEnemy",
        [s.SpellShield, s.GreaterSpellDeflection, s.GlobeOfInvulnerability],
        "self",
      ),
      DeflectionSpellShield: chainContingency(
        "seeEnemy",
        [s.GreaterSpellDeflection, s.SpellShield, s.ProtectionFromMagicalWeapons],
        "self",
      ),
      DeflectionShadowDoorGlobe: chainContingency(
        "seeEnemy",
        [s.GreaterSpellDeflection, s.ShadowDoor, s.GlobeOfInvulnerability],
        "self",
      ),
      PriestElementals: chainContingency(
        "seeEnemy",
        [p.ConjureEarthElemental, p.ConjureFireElemental, s.ProtectionFromMagicalWeapons],
        "self",
      ),
    },
  },
  COMBO_SPELLS,
);

const PRIEST_SPELL_FILES = new Set(
  [...Object.values(SPELLS.Priest), ...Object.values(FNP_SPELLS.Priest)].map((spell) =>
    spell.file.toUpperCase(),
  ),
);

/** The combo holds a priest spell: only a multi-class cleric/mage can memorize it. */
export const holdsPriestSpell = (combo: SpellCombo): boolean =>
  combo.spells.some((spell) => PRIEST_SPELL_FILES.has(spell.file.toUpperCase()));

/** Every combo, the list later stages iterate. */
export const SPELL_COMBOS: SpellCombo[] = Object.values(COMBOS).flatMap((group) =>
  Object.values<SpellCombo>(group),
);
