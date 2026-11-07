import { AT_WILL } from "../../../../config/common";
import { SpellRole } from "../../../../config/spells/spell-role";
import { Creature } from "../../../model/creature/creature";
import { MemorizedSpell } from "../../../model/creature/data";
import { ImmunityName } from "../../../model/final/immunity";
import { Effect } from "../../../model/spell-item/effect";
import {
  DiseaseTypeEnum,
  EffectStatisticModifierEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PoisonTypeEnum,
  RegenerationTypeEnum,
  SaveTypeEnum,
} from "../../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../../model/spell-item/effect.type";
import { Item, Spell } from "../../../model/spell-item/spell-item";
import { Durations } from "../../../model/game-data/durations";
import creatureService from "../../creature.service";
import spellProfileService from "../../spell-profile.service";
import { EffectiveAdjustment } from "../../doc/adjustment.service";
import {
  allSpells,
  atWillInvisibility,
  attacksPerRound,
  CAST_OPCODES,
  detectHitDice,
  diceOf,
  effectiveOf,
  equippedItem,
  ExperienceScope,
  folded,
  immunitiesOf,
  labelOf,
  memorizedFiles,
  onHitDamage,
  ownSpells,
  permanentEffects,
  QUIVER_SLOTS,
  rangedGameWeapons,
  roundAttacks,
  SPELL_IMMUNITIES,
  spellAbilities,
  spellLabel,
  strengthDamage,
  targetEffects,
  wieldedItems,
} from "../experience-detection";
import { hitDiceValue } from "../experience-table";

// One creature file turned into plain numbers for the threat duels: its stats, the XP attack round
// at average damage with what each hit does, its powers, and its defenses.

export type EffectKind =
  "ending" | "fear" | "confusion" | "half" | "drain" | "strengthDrain" | "disease" | "poison";

export interface HitEffect {
  kind: EffectKind;
  /** The effect's own chance to happen on a hit (0..1), a cast spell's chance included */
  chance: number;
  saves: SaveTypeEnum[];
  saveBonus: number;
  /** Levels (drain), Strength points (strengthDrain), damage a second (poison, disease) */
  amount: number;
  /** In seconds */
  duration: number;
}

export interface ProfileAttack {
  name: string;
  average: number;
  ranged: boolean;
  effects: HitEffect[];
}

export interface ProfilePower {
  name: string;
  uses: number;
  ranged: boolean;
  area: boolean;
  average: number;
  effects: HitEffect[];
  level?: number;
  role?: SpellRole;
}

export interface CombatProfile {
  level: number;
  hp: number;
  ac: number;
  thac0: number;
  apr: number;
  movement: number;
  attacks: ProfileAttack[];
  powers: ProfilePower[];
  invisibleAtWill: boolean;
  flies: boolean;
  /** Shares (0..1) of the damage the creature ignores */
  resist: { slashing: number; piercing: number; missile: number; magic: number };
  /** The weapon enchantment needed to hurt it, 0 for any weapon */
  weaponEnchantment: number;
  /** Hit points regained a round */
  regeneration: number;
  undead: boolean;
  construct: boolean;
  magicImmune: boolean;
  spellImmunity: boolean;
  /** How many abilities its file declares (`xpAbilities`) */
  declared: number;
}

const ENDING_OPCODES = [
  EffectTypeEnum.Paralyze,
  EffectTypeEnum.Hold,
  EffectTypeEnum.HoldCreatureSpell,
  EffectTypeEnum.Stun,
  EffectTypeEnum.Sleep,
  EffectTypeEnum.Petrification,
  EffectTypeEnum.Slay,
  EffectTypeEnum.KillTarget,
  EffectTypeEnum.CharmCreature,
  EffectTypeEnum.PolymorphIntoSpecific,
  EffectTypeEnum.Imprisonment,
  EffectTypeEnum.Maze,
];

const HALF_OPCODES = [
  EffectTypeEnum.Blindness,
  EffectTypeEnum.Slow,
  EffectTypeEnum.Web,
  EffectTypeEnum.EntangleOverlay,
];

const EFFECT_KINDS: ReadonlyMap<EffectTypeEnum, EffectKind> = new Map<EffectTypeEnum, EffectKind>([
  ...ENDING_OPCODES.map((opcode) => [opcode, "ending"] as const),
  ...HALF_OPCODES.map((opcode) => [opcode, "half"] as const),
  [EffectTypeEnum.Panic, "fear"],
  [EffectTypeEnum.Confusion, "confusion"],
  [EffectTypeEnum.LevelDrain, "drain"],
  [EffectTypeEnum.Disease, "disease"],
  [EffectTypeEnum.Poison, "poison"],
]);

/** The enchantment a weapon needs against each weapon immunity: +1 past non-magical, ... */
const WEAPON_ENCHANTMENTS: [ImmunityName, number][] = [
  ["nonMagicalWeapons", 1],
  ["nonSilverNonMagicalWeapons", 1],
  ["plusOneWeapons", 2],
  ["plusTwoWeapons", 3],
  ["plusThreeWeapons", 4],
];

/** The resistance a full immunity (1) or a damage resistance immunity (0.5) gives a damage type */
const RESIST_IMMUNITIES: Record<"slashing" | "piercing" | "missile", [ImmunityName, number][]> = {
  slashing: [
    ["physicalDamage", 1],
    ["slashingDamage", 1],
    ["physicalDamageResistance", 0.5],
    ["slashingDamageResistance", 0.5],
  ],
  piercing: [
    ["physicalDamage", 1],
    ["piercingDamage", 1],
    ["physicalDamageResistance", 0.5],
    ["piercingDamageResistance", 0.5],
  ],
  missile: [
    ["physicalDamage", 1],
    ["missileDamage", 1],
    ["missileWeapons", 1],
    ["physicalDamageResistance", 0.5],
    ["missileDamageResistance", 0.5],
  ],
};

const RESIST_SOURCES = {
  slashing: { key: "resistSlashing", opcode: EffectTypeEnum.SlashingResistanceModifier },
  piercing: { key: "resistPiercing", opcode: EffectTypeEnum.PiercingResistanceModifier },
  missile: { key: "resistMissile", opcode: EffectTypeEnum.MissilesResistanceModifier },
} as const;

/** The magic resistance the `magicResistance` immunity sets (immunity-config.ts) */
const MAGIC_RESISTANCE_IMMUNITY = 0.5;

/** A game missile weapon's arrow or bolt: 1d6, two a round */
const MISSILE_AVERAGE = 3.5;
const MISSILES_PER_ROUND = 2;

/** Above this range a power reaches past melee (touch powers have 1 to 5) */
const MELEE_RANGE = 5;

export function combatProfile(scope: ExperienceScope): CombatProfile {
  const effective = effectiveOf(scope);
  const immunities = new Set(immunitiesOf(scope, effective));
  const apr = attacksPerRound(scope, effective);
  return {
    apr,
    level: hitDiceValue(detectHitDice(scope)),
    hp: effective.hp.value,
    ac: effective.ac.value,
    thac0:
      creatureService.getMeleeThac0({
        thac0: effective.thac0.value,
        strength: effective.strength.value,
        exceptionalStrength: effective.exceptionalStrength.value,
      }) ?? effective.thac0.value,
    movement: effective.movement.value,
    attacks: [...roundOf(scope, effective, apr), ...missileAttacks(scope, effective)],
    powers: [...ownPowers(scope.creature, effective), ...gamePowers(scope.creature, effective)],
    invisibleAtWill: invisibleAtWill(scope.creature, effective),
    flies: immunities.has("hover"),
    resist: resistances(scope, immunities),
    weaponEnchantment: Math.max(
      0,
      ...WEAPON_ENCHANTMENTS.filter(([name]) => immunities.has(name)).map(([, plus]) => plus),
    ),
    regeneration: regeneration(scope, effective.hp.value),
    undead: immunities.has("undead"),
    construct: immunities.has("construct"),
    magicImmune: immunities.has("magic"),
    spellImmunity: [...immunities].some((name) => SPELL_IMMUNITIES.has(name)),
    declared: (folded(scope, (d) => d.xpAbilities) ?? []).length,
  };
}

/** The XP round (roundAttacks): each weapon at its average damage, ranked by its maximum. */
function roundOf(
  scope: ExperienceScope,
  effective: EffectiveAdjustment,
  apr: number,
): ProfileAttack[] {
  const { creature } = scope;
  const strength = strengthDamage(effective);
  const quiver = new Set(quiverFiles(effective));
  const candidates = wieldedItems(scope, effective)
    .filter((item) => !quiver.has(item.file.toUpperCase()))
    .flatMap((item) => {
      const dice = diceOf(creature, item);
      if (!dice) return [];
      const melee = item.header?.type === ItemAbilityTypeEnum.Melee;
      const str = melee ? strength : 0;
      const max = dice.thrown * dice.size + dice.bonus + str + onHitDamage(creature, item);
      const average = diceAverage(dice.thrown, dice.size) + dice.bonus + str;
      return [{ max, attack: weaponAttack(creature, item, average, !melee) }];
    });
  return roundAttacks(candidates, apr).map((c) => c.attack);
}

function weaponAttack(
  creature: Creature,
  item: Item,
  base: number,
  ranged: boolean,
): ProfileAttack {
  const hit = hitOf(allSpells(creature), item.header?.effects ?? [], 1, new Set());
  return {
    name: labelOf(item.file, item.stringRef),
    average: base + hit.average,
    effects: hit.effects,
    ranged,
  };
}

/** The files equipped in a quiver slot, upper case. */
function quiverFiles(effective: EffectiveAdjustment): string[] {
  return effective.equipped
    .filter(({ item }) =>
      (Array.isArray(item.slot) ? item.slot : [item.slot]).some((slot) => QUIVER_SLOTS.has(slot)),
    )
    .map(({ item }) => item.file.toUpperCase());
}

/**
 * Two missiles a round from a missile weapon: an equipped quiver item (its own damage when its dice
 * are known) or a game launcher in its creatures.csv weapon slots (1d6 arrows).
 */
function missileAttacks(scope: ExperienceScope, effective: EffectiveAdjustment): ProfileAttack[] {
  const quiver = quiverFiles(effective).map((file) => equippedItem(scope.creature, file) ?? file);
  const first = quiver.at(0) ?? rangedGameWeapons(scope).at(0);
  if (first === undefined) return [];
  const attack =
    typeof first === "string"
      ? { name: first, average: MISSILE_AVERAGE, ranged: true, effects: [] }
      : missileOf(scope.creature, first);
  return Array.from({ length: MISSILES_PER_ROUND }, () => ({ ...attack }));
}

function missileOf(creature: Creature, item: Item): ProfileAttack {
  const dice = diceOf(creature, item);
  if (!dice) {
    return {
      name: labelOf(item.file, item.stringRef),
      average: MISSILE_AVERAGE,
      ranged: true,
      effects: [],
    };
  }
  return weaponAttack(creature, item, diceAverage(dice.thrown, dice.size) + dice.bonus, true);
}

function diceAverage(thrown: number | undefined, size: number | undefined): number {
  if (!thrown || !size) return 0;
  return (thrown * (size + 1)) / 2;
}

/** The average damage and the effects of a hit or a power, cast spells followed at their chance. */
function hitOf(
  spells: readonly Spell[],
  effects: readonly Effect[],
  chance: number,
  visited: Set<string>,
): { average: number; effects: HitEffect[] } {
  let average = 0;
  const found: HitEffect[] = [];
  for (const effect of effects) {
    const own = chance * chanceOf(effect);
    if (effect.opcode === EffectTypeEnum.Damage) {
      average += own * (diceAverage(effect.diceThrown, effect.diceSize) + (effect.amount ?? 0));
    }
    const hitEffect = hitEffectOf(effect, own);
    if (hitEffect) found.push(hitEffect);
    const cast = castSpell(spells, effect, visited);
    if (cast) {
      const inner = hitOf(spells, targetEffects(cast), own, visited);
      average += inner.average;
      found.push(...inner.effects);
    }
  }
  return { average, effects: found };
}

function castSpell(
  spells: readonly Spell[],
  effect: Effect,
  visited: Set<string>,
): Spell | undefined {
  if (!CAST_OPCODES.has(effect.opcode) || typeof effect.resource !== "string") return undefined;
  const file = effect.resource.toUpperCase();
  if (visited.has(file)) return undefined;
  visited.add(file);
  return spells.find((s) => s.file.toUpperCase() === file);
}

function chanceOf(effect: Effect): number {
  return effect.probability1 === undefined ? 1 : effect.probability1 / 100;
}

function hitEffectOf(effect: Effect, chance: number): HitEffect | undefined {
  const kind = kindOf(effect);
  if (!kind) return undefined;
  return {
    kind,
    chance,
    // Real saving throws only (the flags above 4 bypass mirror images, ...)
    saves: (effect.saveTypes ?? []).filter((s) => s <= SaveTypeEnum.PetrifyPolymorph),
    saveBonus: effect.saveBonus ?? 0,
    amount: amountOf(effect, kind),
    duration: effect.duration ?? 0,
  };
}

function kindOf(effect: Effect): EffectKind | undefined {
  if (effect.opcode === EffectTypeEnum.StrengthBonus) {
    const lowers = effect.type === EffectStatisticModifierEnum.Increment && effect.value < 0;
    return lowers ? "strengthDrain" : undefined;
  }
  return EFFECT_KINDS.get(effect.opcode);
}

function amountOf(effect: Effect, kind: EffectKind): number {
  switch (effect.opcode) {
    case EffectTypeEnum.LevelDrain:
      return effect.amount;
    case EffectTypeEnum.StrengthBonus:
      return kind === "strengthDrain" ? -effect.value : 0;
    case EffectTypeEnum.Poison:
      return poisonRate(effect.type, effect.amount);
    case EffectTypeEnum.Disease:
      return diseaseAmount(effect.type, effect.amount);
    default:
      return 0;
  }
}

/** Poison damage a second, so that amount x duration is its damage */
function poisonRate(type: PoisonTypeEnum, amount: number): number {
  if (type === PoisonTypeEnum.AmountDamagePerSecond) return amount;
  if (type === PoisonTypeEnum.OneDamagePerAmountSecond) return amount ? 1 / amount : 0;
  return 1;
}

/** Damage a second for a damaging disease, else its own amount (the points it lowers a stat by) */
function diseaseAmount(type: DiseaseTypeEnum, amount: number): number {
  switch (type) {
    case DiseaseTypeEnum.OneDamagePerSecond:
      return 1;
    case DiseaseTypeEnum.AmoundDamagePerRound:
      return amount / Durations.round;
    case DiseaseTypeEnum.AmountDamagePerSecond:
      return amount;
    case DiseaseTypeEnum.OneDamagePerAmountSeconds:
      return amount ? 1 / amount : 0;
    default:
      return amount;
  }
}

/** The creature's own powers it can use: memorized ones count their uses, cast ones are at will. */
function ownPowers(creature: Creature, effective: EffectiveAdjustment): ProfilePower[] {
  const counts = memorizedCounts(creature, effective);
  return ownSpells(creature, effective).map((spell) => {
    const hit = hitOf(
      allSpells(creature),
      targetEffects(spell),
      1,
      new Set([spell.file.toUpperCase()]),
    );
    const profile = spellProfileService.profileOfSpell(spell);
    return {
      name: labelOf(spell.file, spell.name),
      uses: usesOf(counts.get(spell.file.toUpperCase())),
      ranged: spell.headers.some(
        (h) => h.target !== ItemAbilityTargetEnum.Caster && (h.range ?? 0) > MELEE_RANGE,
      ),
      area: spell.keywords.includes("area"),
      average: hit.average,
      effects: hit.effects,
      level: profile?.worthLevel ?? profile?.level,
      role: profile?.role,
    };
  });
}

/**
 * The game spells it has memorized (files that are not this mod's own spells): level, role and
 * delivery from their spell profile; their damage and effects come from a table later.
 */
function gamePowers(creature: Creature, effective: EffectiveAdjustment): ProfilePower[] {
  const own = new Set(allSpells(creature).map((s) => s.file.toUpperCase()));
  const counts = memorizedCounts(creature, effective);
  const files = [...new Set(memorizedFiles(creature, effective))].filter((f) => !own.has(f));
  return files.map((file) => {
    const profile = spellProfileService.profileOf(file, creature);
    return {
      name: spellLabel(file),
      uses: usesOf(counts.get(file)),
      ranged: !profile?.keywords.includes("castOnSelf"),
      area: profile?.keywords.includes("area") ?? false,
      average: 0,
      effects: [],
      level: profile ? (profile.worthLevel ?? profile.level) : undefined,
      role: profile?.role,
    };
  });
}

/**
 * How many times each file is memorized, upper case: its own list's count, or the most any
 * spellbook variant gives it (variants are alternatives, one per installed mod set).
 */
function memorizedCounts(creature: Creature, effective: EffectiveAdjustment): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (entries: MemorizedSpell[], merge: (a: number, b: number) => number) => {
    const local = new Map<string, number>();
    for (const m of entries) {
      const file = m.file.toUpperCase();
      local.set(file, (local.get(file) ?? 0) + (m.memorizedCount ?? 1));
    }
    local.forEach((count, file) => counts.set(file, merge(counts.get(file) ?? 0, count)));
  };
  add(
    effective.memorized.map((m) => m.spell),
    (a, b) => a + b,
  );
  const spellbooks = effective.spellbooks ?? creature.data.spells.spellbooks ?? [];
  for (const variant of spellbooks) add(variant.memorized, Math.max);
  return counts;
}

/** Unlimited at will (or cast by a behaviour ability without being memorized) */
function usesOf(count: number | undefined): number {
  if (count === undefined || count >= AT_WILL) return Infinity;
  return count;
}

/** An invisibility memorized at will, or an own power turning itself invisible. */
function invisibleAtWill(creature: Creature, effective: EffectiveAdjustment): boolean {
  if (atWillInvisibility(creature, effective).length) return true;
  return ownSpells(creature, effective).some((spell) =>
    spellAbilities(creature, spell).includes("invisibleAtWill"),
  );
}

function resistances(
  scope: ExperienceScope,
  immunities: ReadonlySet<ImmunityName>,
): CombatProfile["resist"] {
  const effects = permanentEffects(scope);
  const weapon = (type: keyof typeof RESIST_SOURCES): number => {
    const { key, opcode } = RESIST_SOURCES[type];
    const percent = Math.max(
      folded(scope, (d) => d[key]) ?? 0,
      ...effects.map((e) => (e.opcode === opcode && "value" in e ? e.value : 0)),
    );
    const immune = RESIST_IMMUNITIES[type].filter(([name]) => immunities.has(name));
    return Math.min(1, Math.max(percent / 100, ...immune.map(([, share]) => share)));
  };
  return {
    slashing: weapon("slashing"),
    piercing: weapon("piercing"),
    missile: weapon("missile"),
    magic: magicResistance(scope, immunities, effects),
  };
}

function magicResistance(
  scope: ExperienceScope,
  immunities: ReadonlySet<ImmunityName>,
  effects: Effect[],
): number {
  if (immunities.has("magic")) return 1;
  const percent = Math.max(
    folded(scope, (d) => d.resistMagic) ?? 0,
    ...effects.map((e) =>
      e.opcode === EffectTypeEnum.MagicResistanceModifier && "value" in e ? e.value : 0,
    ),
  );
  const immune = immunities.has("magicResistance") ? MAGIC_RESISTANCE_IMMUNITY : 0;
  return Math.min(1, Math.max(percent / 100, immune));
}

/** Hit points a round from the permanent regeneration effects (opcode 98), which add up. */
function regeneration(scope: ExperienceScope, hp: number): number {
  return permanentEffects(scope).reduce((total, effect) => {
    if (effect.opcode !== EffectTypeEnum.Regeneration) return total;
    return total + regenerationRate(effect.type, effect.amount, hp) * Durations.round;
  }, 0);
}

/** Hit points a second */
function regenerationRate(type: RegenerationTypeEnum, amount: number, hp: number): number {
  switch (type) {
    case RegenerationTypeEnum.AmountHPpercentagePerSecond:
      return (amount * hp) / 100;
    case RegenerationTypeEnum.OneHPperAmountSeconds:
      return amount ? 1 / amount : 0;
    default:
      return amount;
  }
}
