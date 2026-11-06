import { CreatureAdjustment } from "../../model/creature/adjustment";
import { Creature } from "../../model/creature/creature";
import { CreatureData } from "../../model/creature/data";
import { Game } from "../../model/creature/game";
import { ItemSlot } from "../../model/creature/item";
import { ImmunityName } from "../../model/final/immunity";
import { StringReference } from "../../model/final/stringref";
import { Effect } from "../../model/spell-item/effect";
import {
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  ItemAbilityTargetEnum,
} from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { Item, ItemSpellHeader, Spell } from "../../model/spell-item/spell-item";
import { getAllSpells, spellFiles } from "../../model/spell-item/spell-reference";
import { State } from "../../state";
import { SPELLS } from "../../../config/spells/spell-database";
import creatureService from "../creature.service";
import adjustmentService, { EffectiveAdjustment } from "../doc/adjustment.service";
import translationService from "../translation.service";
import { DetectedAbility, HitDice, XpAbility } from "./experience-table";

/** One creature file as one game sees it; no `file` means the base creature, unadjusted. */
export interface ExperienceScope {
  creature: Creature;
  file?: string;
  game?: Game;
}

/**
 * Immunities that block a specific spell or spell family (2e DMG "immune to a spell"), matched
 * after nested immunities are expanded (a trait like `undead` nests sleep, hold, mindSpells, ...).
 */
export const SPELL_IMMUNITIES: ReadonlySet<ImmunityName> = new Set<ImmunityName>([
  "acidSpells",
  "causeWoundSpells",
  "cloudSpells",
  "coldSpells",
  "deathSpell",
  "fireSpells",
  "fireballSpell",
  "flameArrowSpell",
  "insectSpells",
  "lightningBoltSpell",
  "lightningSpells",
  "mindSpells",
  "poisonSpells",
  "magicMissile",
  "charm",
  "hold",
  "confusion",
  "maze",
  "sleep",
  "web",
  // Unsure: Entangle is a spell, but the immunity also covers entangling natural attacks.
  "entangle",
  // Unsure: blocks Polymorph Other / shape-change spells rather than a damage type.
  "polymorph",
  // Unsure: blocks the Earthquake spell's knockdown, which only spells cause in game.
  "earthquake",
  // Unsure: a whole school (illusions, phantasms) rather than a single spell family.
  "illusion",
  // Unsure: death magic (Finger of Death, Slay Living, ...) rather than one named spell.
  "deathEffects",
  // Left out on purpose: `cureWoundSpells` means healing spells fail on the creature, a weakness
  // rather than a defense; `magic` is 100% magic resistance (counted as magicResistance);
  // fear, stun, blindness, petrification, poison, ... are effect immunities, not spell immunities.
]);

/**
 * Immunities to a weapon damage type. The `*DamageResistance` ones set the resistance to 50%
 * (immunity-config.ts): half damage, the same bar as a folded resist value >= 50, so they count.
 */
const WEAPON_IMMUNITIES: ReadonlySet<ImmunityName> = new Set<ImmunityName>([
  "physicalDamage",
  "slashingDamage",
  "crushingDamage",
  "piercingDamage",
  "missileDamage",
  "physicalDamageResistance",
  "slashingDamageResistance",
  "crushingDamageResistance",
  "piercingDamageResistance",
  "missileDamageResistance",
  // Projectile protection against every missile weapon.
  "missileWeapons",
  // Immune to *enchanted* weapons (the magic golem): a weapon immunity, not "magical weapons only".
  "magicalWeapons",
]);

/**
 * "Hit only by magical weapons": immune to non-magical weapons (`nonMagicalWeapons`), or to
 * weapons under +1/+2/+3 (each nests the previous one).
 */
const MAGICAL_WEAPONS_ONLY: ReadonlySet<ImmunityName> = new Set<ImmunityName>([
  "nonMagicalWeapons",
  // Unsure: hit by silver or magical weapons (lycanthropes) - silver is mundane, but rare.
  "nonSilverNonMagicalWeapons",
  "plusOneWeapons",
  "plusTwoWeapons",
  "plusThreeWeapons",
]);

/** Immunities that grant magic resistance (50% and 100%). */
const MAGIC_RESISTANCE_IMMUNITIES: ReadonlySet<ImmunityName> = new Set<ImmunityName>([
  "magicResistance",
  "magic",
]);

const WEAPON_RESISTANCES = [
  { key: "resistSlashing", label: "slashing" },
  { key: "resistCrushing", label: "crushing" },
  { key: "resistPiercing", label: "piercing" },
  { key: "resistMissile", label: "missile" },
] as const;

/** The adjustments folded into the scope, in authored order (same filter as getEffectiveForGame). */
export function matchingAdjustments(scope: ExperienceScope): CreatureAdjustment[] {
  const { file, game } = scope;
  if (file === undefined) return [];
  return scope.creature.adjustments.filter(
    (a) => a.files.includes(file) && (a.game === undefined || a.game === game),
  );
}

export function detectHitDice(scope: ExperienceScope): HitDice {
  const effective = effectiveOf(scope);
  return { whole: effective.level.value, plus: (folded(scope, (d) => d.bonusHp) ?? 0) > 0 };
}

export function detectStatAbilities(scope: ExperienceScope): DetectedAbility[] {
  const effective = effectiveOf(scope);
  const immunities = immunitiesOf(scope, effective);
  const detected: DetectedAbility[] = [];

  if (effective.ac.value <= 0) {
    detected.push({ ability: "acZeroOrLower", source: `AC ${effective.ac.value}` });
  }
  if (effective.apr.value >= 4) {
    detected.push({ ability: "fourAttacks", source: `${effective.apr.value} attacks` });
  }
  if (effective.intelligence.value >= 13) {
    detected.push({
      ability: "highIntelligence",
      source: `Intelligence ${effective.intelligence.value}`,
    });
  }

  const perHitDie = folded(scope, (d) => d.bonusHpPerHitDie) ?? 0;
  const special = folded(scope, (d) => d.specialBonusHp) ?? 0;
  const extraHp = [
    perHitDie > 0 ? `+${perHitDie} hp per Hit Die` : undefined,
    special > 0 ? `+${special} special hp` : undefined,
  ];
  pushIfAny(detected, "extraHitPoints", extraHp);

  const resistMagic = folded(scope, (d) => d.resistMagic) ?? 0;
  pushIfAny(detected, "magicResistance", [
    resistMagic > 0 ? `${resistMagic}% magic resistance` : undefined,
    ...matching(immunities, MAGIC_RESISTANCE_IMMUNITIES),
  ]);

  if (hasRegeneration(scope)) {
    detected.push({ ability: "regeneration", source: "regeneration effect" });
  }

  pushIfAny(detected, "spellImmunity", matching(immunities, SPELL_IMMUNITIES));

  pushIfAny(detected, "weaponImmunity", [
    ...matching(immunities, WEAPON_IMMUNITIES),
    ...WEAPON_RESISTANCES.map(({ key, label }) => {
      const value = folded(scope, (d) => d[key]) ?? 0;
      return value >= 50 ? `${value}% ${label} resistance` : undefined;
    }),
  ]);

  pushIfAny(detected, "magicalWeaponsOnly", matching(immunities, MAGICAL_WEAPONS_ONLY));

  for (const ability of folded(scope, (d) => d.xpAbilities) ?? []) {
    detected.push({ ability, source: "declared" });
  }
  return detected;
}

/** Every ability detected for the scope: the stat ones, then the attack ones. */
export function detectAbilities(scope: ExperienceScope): DetectedAbility[] {
  return [...detectStatAbilities(scope), ...detectAttackAbilities(scope)];
}

/**
 * Abilities from what the creature does: on-hit effects of the weapons it wields and effects of
 * the spells its behaviour abilities cast, its spell levels, missile weapons and natural weapon
 * damage. One entry per ability, its sources joined. `behavior.abilities` belongs to the creature,
 * not a file: every file inherits all of them (variants that change behaviour get their own
 * creature entry).
 */
export function detectAttackAbilities(scope: ExperienceScope): DetectedAbility[] {
  const effective = effectiveOf(scope);
  const sources = new Map<XpAbility, string[]>();
  const add: AddSource = (ability, source) => {
    const list = sources.get(ability) ?? [];
    if (!list.includes(source)) list.push(source);
    sources.set(ability, list);
  };

  const weapons = wieldedItems(scope, effective);
  addOnHitAbilities(scope.creature, weapons, add);
  addSpellLevelAbility(scope, effective, add);
  addMissileAbility(scope.creature, effective, add);
  addDamageAbilities(weapons, effective.apr.value, add);

  return ATTACK_ABILITIES.filter((ability) => sources.has(ability)).map((ability) => ({
    ability,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    source: sources.get(ability)!.join(", "),
  }));
}

type AddSource = (ability: XpAbility, source: string) => void;

/** The weapons' on-hit effects (the weapon as source), then the behaviour abilities' spells. */
function addOnHitAbilities(creature: Creature, weapons: Item[], add: AddSource): void {
  for (const item of weapons) {
    const found = new Set<XpAbility>();
    for (const effect of item.header?.effects ?? []) {
      collectEffect(creature, effect, item.header, found, new Set());
    }
    found.forEach((ability) => {
      add(ability, labelOf(item.file, item.stringRef));
    });
  }
  const files = creature.behavior.abilities.flatMap((a) => creatureService.getAbilityCastFiles(a));
  for (const file of files) {
    const spell = creature.spells.find((s) => s.file === file);
    if (!spell) continue;
    const found = new Set<XpAbility>();
    collectSpell(creature, spell, found, new Set());
    found.forEach((ability) => {
      add(ability, labelOf(spell.file, spell.name));
    });
  }
}

function addSpellLevelAbility(
  scope: ExperienceScope,
  effective: EffectiveAdjustment,
  add: AddSource,
): void {
  const spell = highestSpell(scope, effective);
  if (!spell || spell.level < 1) return;
  add(spell.level >= 3 ? "highSpells" : "lowSpells", spell.file);
}

function addMissileAbility(
  creature: Creature,
  effective: EffectiveAdjustment,
  add: AddSource,
): void {
  if (creature.attack.ranged) add("missileWeapons", "ranged attack");
  for (const { item } of effective.equipped) {
    const slots = Array.isArray(item.slot) ? item.slot : [item.slot];
    if (slots.some((slot) => QUIVER_SLOTS.has(slot))) add("missileWeapons", item.file);
  }
}

/** Output order of detectAttackAbilities. */
const ATTACK_ABILITIES: XpAbility[] = [
  "poison",
  "paralysis",
  "petrification",
  "energyDrain",
  "causesDisease",
  "weaknessOrFear",
  "invisibleAtWill",
  "highSpells",
  "lowSpells",
  "missileWeapons",
  "singleAttack20",
  "multipleAttacks30",
];

const QUIVER_SLOTS: ReadonlySet<ItemSlot> = new Set<ItemSlot>([
  "QUIVER1",
  "QUIVER2",
  "QUIVER3",
  "QUIVER4",
]);

const SECONDARY_TYPE_ABILITIES: Partial<Record<string, XpAbility>> = {
  Poison: "poison",
  Disease: "causesDisease",
  Fear: "weaknessOrFear",
};

/** Opcodes whose `resource` is a spell cast on hit (or on condition), followed to its effects. */
const CAST_OPCODES: ReadonlySet<EffectTypeEnum> = new Set([
  EffectTypeEnum.CastSpell,
  EffectTypeEnum.CastSpellOnCondition,
]);

/**
 * The creature's own items this scope wields: the effectively equipped ones (none of the base
 * loadout under `noWeapon`), plus natural weapons in no slot (picked by weapon switching) unless
 * `noWeapon`. The trait item holds the creature's permanent traits, not attacks.
 */
function wieldedItems(scope: ExperienceScope, effective: EffectiveAdjustment): Item[] {
  const equipped = new Set(effective.equipped.map((e) => e.item.file));
  const unslottedNatural = (item: Item): boolean =>
    !effective.noWeapon && !item.equippedSlot.length && diceOf(item) !== undefined;
  return scope.creature.items.filter(
    (item) => !item.trait && (equipped.has(item.file) || unslottedNatural(item)),
  );
}

function collectSpell(
  creature: Creature,
  spell: Spell,
  found: Set<XpAbility>,
  visited: Set<string>,
): void {
  if (visited.has(spell.file)) return;
  visited.add(spell.file);
  const secondary = spell.secondaryType && SECONDARY_TYPE_ABILITIES[String(spell.secondaryType)];
  if (secondary) found.add(secondary);
  for (const effect of spell.effects) collectEffect(creature, effect, undefined, found, visited);
  for (const header of spell.headers) {
    for (const effect of header.effects) collectEffect(creature, effect, header, found, visited);
  }
}

function collectEffect(
  creature: Creature,
  effect: Effect,
  header: ItemSpellHeader | undefined,
  found: Set<XpAbility>,
  visited: Set<string>,
): void {
  const ability = abilityOfEffect(effect, header);
  if (ability) found.add(ability);
  if (!CAST_OPCODES.has(effect.opcode) || effect.resource === undefined) return;
  const spell = creature.spells.find((s) => s.file === effect.resource);
  if (spell) collectSpell(creature, spell, found, visited);
}

/** Opcodes that always map to an ability, whoever they land on. */
const OPCODE_ABILITIES: ReadonlyMap<EffectTypeEnum, XpAbility> = new Map<EffectTypeEnum, XpAbility>([
  [EffectTypeEnum.Poison, "poison"],
  [EffectTypeEnum.Paralyze, "paralysis"],
  [EffectTypeEnum.Hold, "paralysis"],
  [EffectTypeEnum.HoldCreatureSpell, "paralysis"],
  [EffectTypeEnum.Petrification, "petrification"],
  [EffectTypeEnum.LevelDrain, "energyDrain"],
  [EffectTypeEnum.Disease, "causesDisease"],
  [EffectTypeEnum.Panic, "weaknessOrFear"],
]);

function abilityOfEffect(effect: Effect, header: ItemSpellHeader | undefined): XpAbility | undefined {
  const direct = OPCODE_ABILITIES.get(effect.opcode);
  if (direct) return direct;
  if (effect.opcode === EffectTypeEnum.StrengthBonus) {
    const lowers = effect.type === EffectStatisticModifierEnum.Increment && effect.value < 0;
    return lowers ? "weaknessOrFear" : undefined;
  }
  if (effect.opcode === EffectTypeEnum.Invisibility) {
    const onSelf =
      effect.target === EffectTargetEnum.Self || header?.target === ItemAbilityTargetEnum.Caster;
    return onSelf ? "invisibleAtWill" : undefined;
  }
  return undefined;
}

/** The highest spell level among memorized spells, spellbook variants and leveled abilities. */
function highestSpell(
  scope: ExperienceScope,
  effective: EffectiveAdjustment,
): { file: string; level: number } | undefined {
  const spellbooks = effective.spellbooks ?? scope.creature.data.spells.spellbooks ?? [];
  const memorized = [
    ...effective.memorized.map((m) => m.spell),
    ...spellbooks.flatMap((variant) => variant.memorized),
  ].filter((spell) => (spell.memorizedCount ?? 1) > 0);
  const candidates = [
    ...memorized.map((spell) => ({ file: spell.file, level: spell.level ?? spellLevel(spell.file) })),
    ...scope.creature.behavior.abilities.map((ability) => ({
      file: creatureService.getAbilityCastFiles(ability)[0] ?? "ability",
      level: ability.level ?? undefined,
    })),
  ].filter(
    (c): c is { file: string; level: number } => c.level !== undefined && !isClassSpell(c.file),
  );
  return candidates.reduce<{ file: string; level: number } | undefined>(
    (best, c) => (best === undefined || c.level > best.level ? c : best),
    undefined,
  );
}

let classSpellFiles: Set<string> | undefined;

/**
 * Class and kit abilities (SPELLS' Class category, SPCL files, e.g. SPCL423 Poison Weapon) are
 * not spellcasting, whatever level they carry.
 */
function isClassSpell(file: string): boolean {
  classSpellFiles ??= new Set(
    Object.values(SPELLS.Class).flatMap((spell) => spellFiles(spell).map((f) => f.toUpperCase())),
  );
  const upper = file.toUpperCase();
  return upper.startsWith("SPCL") || classSpellFiles.has(upper);
}

let spellLevels: Map<string, number | undefined> | undefined;

/** A spell file's level in SPELLS (its mod variants' files included), built once. */
function spellLevel(file: string): number | undefined {
  spellLevels ??= new Map(
    getAllSpells(SPELLS)
      .flatMap((spell) => spellFiles(spell).map((f) => [f, spell.level] as const))
      .reverse(), // the first entry for a file wins
  );
  return spellLevels.get(file);
}

function diceOf(item: Item): { thrown: number; size: number; bonus: number } | undefined {
  const header = item.header;
  if (header?.diceThrown === undefined || header.diceSize === undefined) return undefined;
  return { thrown: header.diceThrown, size: header.diceSize, bonus: header.damageBonus ?? 0 };
}

/** singleAttack20 / multipleAttacks30 from the wielded items whose dice are known. */
function addDamageAbilities(
  items: Item[],
  apr: number,
  add: (ability: XpAbility, source: string) => void,
): void {
  for (const item of items) {
    const dice = diceOf(item);
    if (!dice) continue;
    const max = dice.thrown * dice.size + dice.bonus;
    const sign = dice.bonus > 0 ? "+" : "";
    const bonus = dice.bonus ? `${sign}${dice.bonus}` : "";
    if (max >= 20) add("singleAttack20", `${item.file}: ${dice.thrown}d${dice.size}${bonus} = ${max}`);
    if (apr > 1 && max * apr >= 30) {
      add("multipleAttacks30", `${item.file}: ${max} x ${apr} attacks = ${max * apr}`);
    }
  }
}

/** The file, followed by its name when it resolves. */
function labelOf(file: string, name: StringReference | undefined): string {
  let text: string | undefined;
  try {
    text = name === undefined ? undefined : translationService.from(name);
  } catch {
    text = undefined; // a game strref this mod has no text for
  }
  return text ? `${file} (${text})` : file;
}

function effectiveOf(scope: ExperienceScope): EffectiveAdjustment {
  return scope.file === undefined
    ? adjustmentService.getBaseEffective(scope.creature)
    : adjustmentService.getEffectiveForGame(scope.creature, scope.file, scope.game);
}

/** The last value the scope's adjustments define, else the base creature's. */
function folded<T>(
  scope: ExperienceScope,
  get: (data: CreatureData) => T | undefined,
): T | undefined {
  let result = get(scope.creature.data);
  for (const adjustment of matchingAdjustments(scope)) {
    const value = get(adjustment.data);
    if (value !== undefined) result = value;
  }
  return result;
}

/**
 * The effective immunities, the engine-forced ones and the trait item's, each flattened through
 * the immunities it nests (State.immunities, the walk utils.hasImmunity does). The trait's count
 * too: creatures carry most of their defenses (e.g. banshee's nonMagicalWeapons) on it, and type
 * traits like `undead` or `skeletal` hold the actual spell and weapon defenses only as nested
 * names. A name missing from State.immunities is kept as is, with nothing nested.
 */
function immunitiesOf(scope: ExperienceScope, effective: EffectiveAdjustment): ImmunityName[] {
  const trait = scope.creature.items.find((item) => item.trait);
  const seen = new Set<ImmunityName>();
  const visit = (name: ImmunityName): void => {
    if (seen.has(name)) return;
    seen.add(name);
    const config = State.immunities.find((immunity) => immunity.name === name);
    for (const nested of config?.immunities ?? []) visit(nested);
  };
  [
    ...effective.immunities.map((i) => i.name),
    ...scope.creature.autoImmunities,
    ...(trait?.immunities ?? []),
  ].forEach(visit);
  return [...seen];
}

function hasRegeneration(scope: ExperienceScope): boolean {
  const effects = [
    ...scope.creature.data.effects.list,
    ...matchingAdjustments(scope).flatMap((a) => a.data.effects.list),
    ...scope.creature.items.filter((item) => item.trait).flatMap((item) => item.effects),
  ];
  return effects.some((effect) => effect.opcode === EffectTypeEnum.Regeneration);
}

function matching(immunities: ImmunityName[], wanted: ReadonlySet<ImmunityName>): ImmunityName[] {
  return immunities.filter((name) => wanted.has(name)).sort((a, b) => a.localeCompare(b));
}

function pushIfAny(
  detected: DetectedAbility[],
  ability: DetectedAbility["ability"],
  sources: (string | undefined)[],
): void {
  const present = sources.filter((s): s is string => s !== undefined);
  if (present.length) detected.push({ ability, source: present.join(", ") });
}
