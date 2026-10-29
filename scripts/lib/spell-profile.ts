import { type SpellKeyword } from "../../lib/config/spells/keyword";
import {
  type SpellDurationClass,
  type SpellRole,
  type SpellTier,
} from "../../lib/config/spells/spell-role";
import { EffectTypeEnum as E } from "../../lib/src/model/spell-item/effect.type";
import {
  type EffectSource,
  followRelays,
  type RawEffect,
  readerSource,
  type ResourceReader,
} from "./spell-saves";

// Fitted on the durations declared by hand, at the lowest caster level: Fire Shield and
// Improved Invisibility (up to 1 turn) are short, Globes, Blur, Mirror Image and Aid (2 turns to
// 2 hours) mid, Stoneskin and Animate Dead (8 hours) long.
/** Two turns: below it, a duration is short (several rounds to one turn) */
const SHORT_LIMIT = 120;
/** Four game hours: from it, a duration is long (several hours) */
const LONG_FROM = 1200;

/** Each extended header's casting speed (lower is faster), in header order. */
export function readSplCastingTimes(spl: Buffer): number[] {
  if (spl.toString("latin1", 0, 8) !== "SPL V1  ") throw new Error("Not a SPL V1 file");
  const headerOffset = spl.readUInt32LE(0x64);
  const headerCount = spl.readUInt16LE(0x68);
  return Array.from({ length: headerCount }, (_, h) =>
    spl.readUInt16LE(headerOffset + h * 0x28 + 0x12),
  );
}

/** The caster level each spell level is first cast at, wizard (1) and priest (2) spells */
const FIRST_CASTER_LEVELS: Partial<Record<number, number[]>> = {
  1: [1, 3, 5, 7, 9, 12, 14, 16, 18],
  2: [1, 3, 5, 7, 9, 11, 14],
};

/**
 * The lowest level a caster casts the spell at: the duration a precast spell gets at worst (its
 * header list may start before, e.g. at level 1 for a 4th-level spell). 1 for an innate.
 */
export function minCasterLevel(spl: Buffer): number {
  const levels = FIRST_CASTER_LEVELS[spl.readUInt16LE(0x1c)];
  return levels?.[spl.readUInt32LE(0x34) - 1] ?? 1;
}

/** Reads the header a caster of `casterLevel` casts, relayed spells' included. */
export function casterLevelSource(
  reader: Pick<ResourceReader, "read">,
  casterLevel: number,
): EffectSource {
  return readerSource(reader, casterLevel);
}

/** See SpellDurationClass - undefined for an instant effect. */
export function durationClass(seconds: number): SpellDurationClass | undefined {
  if (seconds <= 0) return undefined;
  if (seconds < SHORT_LIMIT) return "short";
  return seconds < LONG_FROM ? "mid" : "long";
}

/** Lasts for its duration */
const LIMITED = 0;
/** Applied once its duration has elapsed: delayed limited, permanent and while equipped */
const DELAYED = new Set([3, 4, 5]);
/** Longer than a game day: an effect lasting until another one ends it, not a real duration */
const OPEN_ENDED = 7200;

/**
 * How long the spell's effects last (see SpellDurationClass): its longest limited effect, visuals
 * aside. Some spells instead make an effect last indefinitely and end it with delayed effects
 * (Polymorph Self removing its form after 1 turn + 3 rounds/level): the delay is their duration.
 */
export function spellDuration(effects: RawEffect[]): SpellDurationClass | undefined {
  const durations = effects
    .filter((e) => !COSMETIC.has(e.opcode))
    .filter((e) => e.timingMode === LIMITED || DELAYED.has(e.timingMode))
    .map((e) => e.duration)
    .filter((duration) => duration < OPEN_ENDED);
  return durationClass(Math.max(0, ...durations));
}

/** What the spell does: its effects with every relay followed (see followRelays), or undefined when missing. */
export function spellEffects(source: EffectSource, file: string): RawEffect[] | undefined {
  const name = file.toUpperCase();
  const effects = source.spl(name);
  return effects && followRelays(source, effects, new Set([name]), true);
}

const SELF_TARGET = 1;
const PRESET_TARGET = 2;

/** Opcodes that change nothing in a fight: visuals, sounds, texts and icons */
export const COSMETIC = new Set<number>([
  E.PlayVisualEffect,
  E.LightingEffects,
  E.PlaySound,
  E.DisplayString,
  E.DisplayPortraitIcon,
  E.RemovePortraitIcon,
  E.CharacterColorPulse,
  E.CreatureRGBColorFade,
  E.SetColorGlowPulse,
]);
/**
 * Effects that only support the spell's real ones on enemies (blocking a second casting, cleaning
 * up a previous one, marking a spell state): they don't make a spell a debuff on their own
 */
const BOOKKEEPING = new Set<number>([
  E.ProtectionFromResourceAndMessage,
  E.ProtectionFromSpell,
  E.ProtectionFromOpcode,
  E.RemoveEffectsByResource,
  E.SetExtendedSpellState,
  E.CastSpell,
  E.UseEFFFile,
]);
const REACTIVE = new Set<number>([
  E.CurrentHPbonus,
  E.DispelEffects,
  E.RemoveInvisibility,
  E.InvisibilityDetection,
  E.Teleport,
]);
/**
 * Breaching enemy protections: only worth it against a protected enemy, so reactive. On the
 * caster, it's a buff cleaning up its own previous casting (Haste)
 */
const BREACH = new Set<number>([
  E.RemoveSpellSchoolProtections,
  E.RemoveSpellTypeProtections,
  E.RemoveProtectionBySchool,
  E.RemoveProtectionBySecondaryType,
]);
/** Only gathers information, no use in a fight: the spell is useless */
const INFORMATION = new Set<number>([E.FindTraps, E.DetectAlignment, E.Infravision]);
const HEAL = new Set<number>([E.CurrentHPbonus]);
const MAXIMUM_HP = new Set<number>([E.MaximumHPModifier]);
const REACTIVE_KEYWORDS: SpellKeyword[] = ["cureWounds", "curePoison"];
const SUMMON = new Set<number>([E.SummonCreature, E.SummonMonsters, E.SummonCreatureFrom2DA]);
const PROTECTION = new Set<number>([
  E.ProtectionFromWeapons,
  E.ProtectionFromSpellLevels,
  E.SpellTurning,
  E.SpellDeflection,
  E.Stoneskin,
  E.MirrorImage,
  E.MirrorImageEffect,
  E.Blur,
  E.Invisibility,
  E.Sanctuary,
  E.ProtectionFromProjectile,
]);
/**
 * A protection only when nothing boosts the caster's offense: Haste's AC bonus doesn't count, nor
 * its immunity to its own recasting (a spell immunity is mostly such bookkeeping), nor Improved
 * Haste's immunity to Slow - an opcode immunity alone is a protection (Free Action, Death Ward)
 */
const MINOR_PROTECTION = new Set<number>([
  E.ArmorClassBonus,
  E.MagicResistanceModifier,
  E.ProtectionFromSpell,
  E.ProtectionFromOpcode,
]);
/** Boosts the caster's offense: a buff, even with a minor protection on the side (Haste) */
const OFFENSIVE_BUFF = new Set<number>([
  E.Haste,
  E.Haste2,
  E.ModifyAttacksPerRound,
  E.Thac0Bonus,
  E.AttackDamageBonus,
  E.StrengthBonus,
]);
const DAMAGE = new Set<number>([E.Damage, E.LevelDrain]);
const KILL = new Set<number>([E.KillTarget, E.DeathKill60HP, E.Slay]);
/** A touch spell: a weapon created in the caster's hand carries its payload (Harm, Chill Touch) */
const TOUCH = new Set<number>([E.CreateWeapon]);
/** The caster takes another form: a shapeshift */
const FORM = new Set<number>([E.PolymorphIntoSpecific, E.ReplaceCreature]);
/** A new form's weapon comes with its abilities: a shapeshift, not a touch spell */
const ABILITY_CHANGE = new Set<number>([E.GiveAbility, E.RemoveSpell]);
const DISABLE = new Set<number>([
  E.CharmCreature,
  E.CharmControlCreature,
  E.Sleep,
  E.Sleep20HP,
  E.Stun,
  E.Stun90HP,
  E.Silence,
  E.Blindness,
  E.Feeblemindedness,
  E.Confusion,
  E.Hold,
  E.HoldCreatureSpell,
  E.Paralyze,
  E.Slow,
  E.Panic,
  E.Petrification,
  E.Web,
  E.EntangleOverlay,
  E.Maze,
  E.Imprisonment,
]);

/** Enemy effects that aren't a lasting debuff: the spell's main effect, or its bookkeeping */
const NOT_DEBUFF = new Set<number>([
  ...BOOKKEEPING,
  ...DAMAGE,
  ...KILL,
  ...DISABLE,
  ...REACTIVE,
  ...BREACH,
  ...SUMMON,
  ...INFORMATION,
]);

/**
 * What the spell is for (see SpellRole), guessed from its effects and keywords, first match
 * wins: reactive, summon, damage then disable on enemies, then protection or buff when it lands
 * on the caster or its allies (an offensive spell with a side effect on its caster, like
 * Vampiric Touch, stays offensive). `evidence` lists every effect that counts (cosmetic ones
 * don't), so a wrong guess can be checked and overruled by hand.
 */
export function classifyRole(
  effects: RawEffect[],
  keywords: SpellKeyword[],
): { role: SpellRole | undefined; secondaryRoles: SpellRole[]; evidence: string[] } {
  const friendly = keywords.includes("friendly");
  // cast on its caster, a spell's preset target is the caster - unless it's an area centred on
  // the caster, which hits the creatures around it (Sunray)
  const onCaster = keywords.includes("castOnSelf") && !keywords.includes("area");
  const isSelf = (target: number) =>
    friendly || target === SELF_TARGET || (onCaster && target === PRESET_TARGET);
  const counted = effects
    .filter((e) => !COSMETIC.has(e.opcode))
    .map((e) => ({ opcode: e.opcode, self: isSelf(e.target) }));
  const labels = counted.map(({ opcode, self }) => {
    const name = E[opcode] ? `opcode ${opcode} ${E[opcode]}` : `opcode ${opcode}`;
    return `${name} (${self ? "self" : "enemy"})`;
  });
  const matched = keywords.filter((k) => REACTIVE_KEYWORDS.includes(k));
  const evidence = [...new Set([...labels, ...matched.map((k) => `keyword ${k}`)])];
  const has = (set: Set<number>) => counted.some((e) => set.has(e.opcode));
  const hasOn = (set: Set<number>, self: boolean) =>
    counted.some((e) => set.has(e.opcode) && e.self === self);
  // a new form disables spellcasting: not a buff, a caster must think about when to shift
  const shapeshifting = hasOn(FORM, true) || (hasOn(TOUCH, true) && has(ABILITY_CHANGE));
  const offensiveRole = (): SpellRole | undefined => {
    if (hasOn(TOUCH, true) && !shapeshifting) return "damage";
    if (hasOn(KILL, false)) return "kill";
    if (hasOn(DAMAGE, false)) return "damage";
    if (hasOn(DISABLE, false)) return "disable";
    // any other lasting harm on enemies (saves, THAC0, AC, disease...) weakens them: a debuff
    if (counted.some((e) => !e.self && !BOOKKEEPING.has(e.opcode))) return "disable";
    return undefined;
  };
  const role = ((): SpellRole | undefined => {
    // a heal on the caster doesn't make an offensive spell (Vampiric Touch) reactive, nor does
    // an offensive spell removing its own previous casting from its target (Slow) breach
    const harming = hasOn(DAMAGE, false) || hasOn(KILL, false);
    const offensive = harming || hasOn(DISABLE, false);
    const breaching = hasOn(BREACH, false) && !offensive;
    // raising maximum hit points raises current ones too: a temporary boost, not a heal (Aid)
    const boost = has(MAXIMUM_HP);
    const reacting = counted.some((e) => REACTIVE.has(e.opcode) && !(boost && HEAL.has(e.opcode)));
    const informing = counted.filter((e) => !BOOKKEEPING.has(e.opcode));
    if (informing.length && informing.every((e) => INFORMATION.has(e.opcode))) return "useless";
    if (matched.length || (reacting && !harming) || breaching) {
      return "reactive";
    }
    if (has(SUMMON)) return "summon";
    if (shapeshifting) return "shapeshift";
    const attack = offensiveRole();
    if (attack) return attack;
    if (hasOn(PROTECTION, true)) return "protection";
    if (hasOn(MINOR_PROTECTION, true) && !hasOn(OFFENSIVE_BUFF, true)) return "protection";
    if (counted.some((e) => e.self)) return "buff";
    return undefined;
  })();
  if (role === undefined || role === "useless" || role === "shapeshift")
    return { secondaryRoles: [], role, evidence };
  // what else the spell really does - its bookkeeping and side benefits (Haste's AC) aside
  const debuff = counted.some((e) => !e.self && !NOT_DEBUFF.has(e.opcode));
  const also: [SpellRole, boolean][] = [
    ["summon", has(SUMMON)],
    ["kill", hasOn(KILL, false)],
    ["damage", hasOn(DAMAGE, false) || (hasOn(TOUCH, true) && !shapeshifting)],
    ["disable", hasOn(DISABLE, false) || debuff],
    ["protection", hasOn(PROTECTION, true)],
    ["buff", hasOn(OFFENSIVE_BUFF, true)],
  ];
  const secondaryRoles = also.filter(([r, does]) => does && r !== role).map(([r]) => r);
  return { role, secondaryRoles, evidence };
}

/** The strongest protections: Stoneskin, Mirror Image, Globes, Mantles, Spell Turning/Deflection */
const GREAT_PROTECTION = new Set<number>([
  E.Stoneskin,
  E.MirrorImage,
  E.MirrorImageEffect,
  E.ProtectionFromSpellLevels,
  E.ProtectionFromWeapons,
  E.SpellTurning,
  E.SpellDeflection,
]);
/** Useful protections: Blur, missile immunity, resistances, opcode immunities (Free Action) */
const GOOD_PROTECTION = new Set<number>([
  E.Blur,
  E.ProtectionFromProjectile,
  E.ProtectionFromOpcode,
  E.MagicResistanceModifier,
  E.AcidResistanceModifier,
  E.ColdResistanceModifier,
  E.ElectricityResistanceModifier,
  E.FireResistanceModifier,
  E.MagicDamageResistanceModifier,
  E.MagicalFireResistanceModifier,
  E.MagicalColdResistanceModifier,
  E.SlashingResistanceModifier,
  E.CrushingResistanceModifier,
  E.PiercingResistanceModifier,
  E.MissilesResistanceModifier,
]);
/** The protected phase's covers decide their own use: never guessed great */
const COVER = new Set<number>([E.Sanctuary, E.Invisibility]);

/**
 * How valuable a protection is (see SpellTier), guessed from its effects on the caster; undefined
 * for `decent` (never written) and for every other role, whose tier is set by hand.
 */
export function classifyTier(
  effects: RawEffect[],
  role: SpellRole | undefined,
): SpellTier | undefined {
  if (role !== "protection") return undefined;
  const on = (set: Set<number>) => effects.some((e) => set.has(e.opcode));
  if (on(GREAT_PROTECTION) && !on(COVER)) return "great";
  if (on(GREAT_PROTECTION) || on(GOOD_PROTECTION)) return "good";
  return undefined;
}
