import { CreatureAbility } from "../../model/creature/ability";
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
  ItemAbilityTypeEnum,
  SpellTypeEnum,
} from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { Item, ItemSpellHeader, Spell } from "../../model/spell-item/spell-item";
import { getAllSpells, spellFiles } from "../../model/spell-item/spell-reference";
import { State } from "../../state";
import { AT_WILL } from "../../../config/common";
import { AttackPerRoundTable } from "../../model/game-data/attack-per-round";
import { SPELLS } from "../../../config/spells/spell-database";
import creatureService from "../creature.service";
import monsterFilesService from "../monster-files.service";
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

/** Full immunities to a weapon damage type or to missile weapons. */
const WEAPON_IMMUNITIES: ReadonlySet<ImmunityName> = new Set<ImmunityName>([
  "physicalDamage",
  "slashingDamage",
  "crushingDamage",
  "piercingDamage",
  "missileDamage",
  // Projectile protection against every missile weapon.
  "missileWeapons",
  // Immune to *enchanted* weapons (the magic golem): a weapon immunity, not "magical weapons only".
  "magicalWeapons",
]);

/**
 * Partial damage reduction: the `*DamageResistance` immunities set the resistance to 50%
 * (immunity-config.ts). Like any folded resist value or resistance effect above 0, it is the
 * "immunity to any weapon, including ½ damage" row, counted once with the full immunities.
 */
const DAMAGE_RESISTANCES: ReadonlySet<ImmunityName> = new Set<ImmunityName>([
  "physicalDamageResistance",
  "slashingDamageResistance",
  "crushingDamageResistance",
  "piercingDamageResistance",
  "missileDamageResistance",
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

const RESISTANCE_EFFECTS = [
  { opcode: EffectTypeEnum.SlashingResistanceModifier, label: "slashing" },
  { opcode: EffectTypeEnum.CrushingResistanceModifier, label: "crushing" },
  { opcode: EffectTypeEnum.PiercingResistanceModifier, label: "piercing" },
  { opcode: EffectTypeEnum.MissilesResistanceModifier, label: "missile" },
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
  const apr = attacksPerRound(effective);
  if (apr >= 4) {
    detected.push({ ability: "fourAttacks", source: `${apr} attacks` });
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
    ...matching(immunities, DAMAGE_RESISTANCES),
    ...WEAPON_RESISTANCES.map(({ key, label }) => {
      const value = folded(scope, (d) => d[key]) ?? 0;
      return value > 0 ? `${value}% ${label} resistance` : undefined;
    }),
    ...resistanceEffectSources(scope),
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
  addOnHitAbilities(scope.creature, effective, weapons, add);
  addSpellLevelAbility(scope, effective, add);
  addMissileAbility(scope, effective, add);
  addDamageAbilities(weapons, attacksPerRound(effective), strengthDamage(effective), add);

  return ATTACK_ABILITIES.filter((ability) => sources.has(ability)).map((ability) => ({
    ability,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    source: sources.get(ability)!.join(", "),
  }));
}

type AddSource = (ability: XpAbility, source: string) => void;

/** The weapons' on-hit effects (the weapon as source), then the behaviour abilities' spells. */
function addOnHitAbilities(
  creature: Creature,
  effective: EffectiveAdjustment,
  weapons: Item[],
  add: AddSource,
): void {
  for (const item of weapons) {
    const found = new Set<XpAbility>();
    for (const effect of item.header?.effects ?? []) {
      collectEffect(creature, effect, item.header, found, new Set());
    }
    found.forEach((ability) => {
      add(ability, labelOf(item.file, item.stringRef));
    });
  }
  for (const spell of ownSpells(creature, effective)) {
    for (const ability of spellAbilities(creature, spell)) {
      add(ability, labelOf(spell.file, spell.name));
    }
  }
}

/**
 * The Table 32 abilities one of the creature's own powers gives: what its effects do (poison,
 * paralysis, ...) plus the unlisted form the power itself is (see powerAbility).
 */
export function spellAbilities(creature: Creature, spell: Spell): XpAbility[] {
  const found = new Set<XpAbility>();
  collectSpell(creature, spell, found, new Set());
  const power = powerAbility(spell, found);
  if (power) found.add(power);
  return [...found];
}

/**
 * Spells shared by a creature entry's members (e.g. the basilisks' petrifying gaze, made once on
 * the entry): the creature group registers them, so detection finds them like the creature's own.
 */
const sharedResources = new WeakMap<Creature, { spells: Spell[]; items: Item[] }>();

/**
 * Registers the resources a creature can use without owning them: its entry's and kin's, and its
 * fellow members' (a copy made with createFrom keeps equipping the source's items, e.g. the greater
 * wyvern wields the wyvern's jaws).
 */
export function setSharedResources(
  creature: Creature,
  shared: { spells?: Spell[]; items?: Item[] },
): void {
  sharedResources.set(creature, { spells: shared.spells ?? [], items: shared.items ?? [] });
}

function allSpells(creature: Creature): Spell[] {
  return [...creature.spells, ...(sharedResources.get(creature)?.spells ?? [])];
}

/** Items equipped by file: the creature's own first, then the shared ones. */
function equippedItem(creature: Creature, file: string): Item | undefined {
  const key = file.toUpperCase();
  return [...creature.items, ...(sharedResources.get(creature)?.items ?? [])].find(
    (item) => item.file.toUpperCase() === key,
  );
}

/** The spells the scope has memorized (its own list or any spellbook variant), upper case. */
function memorizedFiles(creature: Creature, effective: EffectiveAdjustment): string[] {
  const spellbooks = effective.spellbooks ?? creature.data.spells.spellbooks ?? [];
  return [
    ...effective.memorized
      .filter((m) => (m.spell.memorizedCount ?? 1) > 0)
      .map((m) => m.spell.file),
    ...spellbooks.flatMap((variant) => variant.memorized.map((m) => m.file)),
  ].map((f) => f.toUpperCase());
}

/**
 * The behaviour abilities this scope can use. The behaviour belongs to the whole creature, but an
 * ability waiting for a memorized spell (HaveSpell...) only fires where that spell is memorized:
 * the polar bears' improved stream of frost is Kaldran's alone.
 */
function usableAbilities(creature: Creature, effective: EffectiveAdjustment): CreatureAbility[] {
  const memorized = new Set(memorizedFiles(creature, effective));
  return creature.behavior.abilities.filter(
    (ability) =>
      !needsMemorizedSpell(ability) ||
      creatureService.getAbilityCastFiles(ability).some((f) => memorized.has(f.toUpperCase())),
  );
}

const MEMORIZATION_TRIGGERS = new Set(["HaveSpell", "HaveSpellRES", "HaveAnySpells"]);

/** Whether the ability's triggers (or its target lists') check for a memorized spell. */
function needsMemorizedSpell(ability: CreatureAbility): boolean {
  const walk = (node: unknown): boolean => {
    if (Array.isArray(node)) return node.some(walk);
    if (!node || typeof node !== "object") return false;
    const { name, negation, triggers } = node as {
      name?: unknown;
      negation?: unknown;
      triggers?: unknown;
    };
    if (typeof name === "string" && MEMORIZATION_TRIGGERS.has(name) && !negation) return true;
    return walk(triggers);
  };
  return walk(ability.triggers) || walk(ability.targets);
}

/**
 * The creature's own spells (made with addSpell) it can use: cast by its behaviour abilities, or
 * memorized (its own spellbook or any spellbook variant) - e.g. the basilisk's petrifying gaze.
 */
function ownSpells(creature: Creature, effective: EffectiveAdjustment): Spell[] {
  const files = new Set(
    [
      ...usableAbilities(creature, effective).flatMap((a) =>
        creatureService.getAbilityCastFiles(a),
      ),
      ...memorizedFiles(creature, effective),
    ].map((f) => f.toUpperCase()),
  );
  const seen = new Set<string>();
  return allSpells(creature).filter((s) => {
    const file = s.file.toUpperCase();
    if (!files.has(file) || seen.has(file)) return false;
    seen.add(file);
    return true;
  });
}

/**
 * The unlisted form an own power is (its explicit `xpAbility` tag wins, see collectSpell):
 * - a killing or summoning power: special magical attack
 * - an escape or protection power: special defense
 * - a reactive power (an aura, a form): nothing unless tagged
 * - any other power (damage, disable, buff such as haste or a burst of speed, grab): a special
 *   non-magical attack (the ankheg's acid stream)
 * A power cast as a wizard or priest spell counts through its spell level only.
 * A power already counting as a listed ability (poison, petrification...) without dealing damage
 * is no unlisted form.
 */
function powerAbility(spell: Spell, found: Set<XpAbility>): XpAbility | undefined {
  if (spell.xpAbility !== undefined) return undefined;
  // Already a listed ability (a petrifying gaze, a poison): not an unlisted form too, unless it
  // also deals damage (a ghost's draining touch)
  if (found.size && !dealsDamage(spell)) return undefined;
  // A power cast as a wizard or priest spell (the ogre mage's cone of cold) is a spell: it counts
  // through its spell level (highestSpell), not as an attack form too
  if (isSpellPower(spell)) return undefined;
  if (spell.role === "kill" || spell.role === "summon") return "specialMagicalAttack";
  if (spell.role === "protection") return "specialDefense";
  if (spell.role === "reactive") return undefined;
  return "specialAttack";
}

function isSpellPower(spell: Spell): boolean {
  return spell.type === SpellTypeEnum.Wizard || spell.type === SpellTypeEnum.Priest;
}

/** Damage (opcode 12) to the power's target, not to its caster. */
function dealsDamage(spell: Spell): boolean {
  const effects = [
    ...spell.effects,
    ...spell.headers.flatMap((h) => (h.target === ItemAbilityTargetEnum.Caster ? [] : h.effects)),
  ];
  return effects.some(
    (e) => e.opcode === EffectTypeEnum.Damage && e.target !== EffectTargetEnum.Self,
  );
}

function addSpellLevelAbility(
  scope: ExperienceScope,
  effective: EffectiveAdjustment,
  add: AddSource,
): void {
  const spell = highestSpell(scope, effective);
  if (spell && spell.level >= 1) add(spell.level >= 3 ? "highSpells" : "lowSpells", spell.file);
  for (const file of atWillInvisibility(scope.creature, effective)) add("invisibleAtWill", file);
}

/** Invisibility spells, memorized at will (the ogre mage's), make a creature invisible at will. */
const INVISIBILITY_SPELLS = new Set(
  [
    SPELLS.Wizard.Invisibility.file,
    SPELLS.Wizard.ImprovedInvisibility.file,
    SPELLS.Wizard.MassInvisibility.file,
  ].map((f) => f.toUpperCase()),
);

function atWillInvisibility(creature: Creature, effective: EffectiveAdjustment): string[] {
  const spellbooks = effective.spellbooks ?? creature.data.spells.spellbooks ?? [];
  return [
    ...effective.memorized.map((m) => m.spell),
    ...spellbooks.flatMap((variant) => variant.memorized),
  ]
    .filter(
      (m) => (m.memorizedCount ?? 1) >= AT_WILL && INVISIBILITY_SPELLS.has(m.file.toUpperCase()),
    )
    .map((m) => m.file.toUpperCase())
    .filter((file, i, all) => all.indexOf(file) === i);
}

/**
 * A missile weapon the file actually wields: a mod-equipped item in a quiver slot, or a ranged game
 * weapon in its creatures.csv weapon slots (not removed by the mod). `attack.ranged` only allows
 * ranged attacks - most skeletons have it and still fight in melee - so it is not a signal. The
 * base creature (no file) uses missile weapons when most of its unadjusted files do.
 */
function addMissileAbility(
  scope: ExperienceScope,
  effective: EffectiveAdjustment,
  add: AddSource,
): void {
  for (const { item } of effective.equipped) {
    const slots = Array.isArray(item.slot) ? item.slot : [item.slot];
    if (slots.some((slot) => QUIVER_SLOTS.has(slot))) add("missileWeapons", item.file);
  }
  if (scope.file !== undefined) {
    for (const weapon of rangedGameWeapons(scope)) add("missileWeapons", weapon);
    return;
  }
  const covered = new Set(scope.creature.adjustments.flatMap((a) => a.files));
  const perFile = scope.creature.files
    .filter((f) => !covered.has(f.name))
    .map((f) => rangedGameWeapons({ ...scope, file: f.name, game: f.game }));
  if (perFile.filter((w) => w.length).length * 2 > perFile.length) {
    for (const weapon of perFile.flat()) add("missileWeapons", weapon);
  }
}

/** Ranged game weapons in the scope file's creatures.csv weapon slots, minus the removed items. */
function rangedGameWeapons(scope: ExperienceScope): string[] {
  if (scope.file === undefined) return [];
  const removed = new Set(
    [
      ...scope.creature.data.items.remove,
      ...matchingAdjustments(scope).flatMap((a) => a.data.items.remove),
    ].map((f) => f.toUpperCase()),
  );
  return monsterFilesService
    .getCreatureRows(scope.file, scope.game)
    .flatMap((row) => row.items)
    .filter((i) => i.slot.startsWith("weapon"))
    .map((i) => i.file.toUpperCase())
    .filter((f) => !removed.has(f) && RANGED_WEAPON_PREFIXES.some((p) => f.startsWith(p)));
}

/** Vanilla resref prefixes of launchers and thrown weapons (bows, crossbows, slings, darts). */
const RANGED_WEAPON_PREFIXES = ["BOW", "XBOW", "SLNG", "DART"];

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
  "breathWeapon",
  "flies",
  "specialDefense",
  "specialMagicalAttack",
  "specialAttack",
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
  const unslottedNatural = (item: Item): boolean =>
    !effective.noWeapon && !item.equippedSlot.length && diceOf(item) !== undefined;
  const own = scope.creature.items.filter((item) => !item.trait && unslottedNatural(item));
  const equipped = effective.equipped
    .map((e) => equippedItem(scope.creature, e.item.file))
    .filter((item): item is Item => item !== undefined && !item.trait);
  return [...new Set([...own, ...equipped])];
}

function collectSpell(
  creature: Creature,
  spell: Spell,
  found: Set<XpAbility>,
  visited: Set<string>,
): void {
  if (visited.has(spell.file)) return;
  visited.add(spell.file);
  if (spell.xpAbility === null) return; // explicitly counts nothing
  // An explicit tag counts wherever the power is reached (a weapon's cast breath, an aura's death)
  if (spell.xpAbility) found.add(spell.xpAbility);
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
  const spell = allSpells(creature).find((s) => s.file === effect.resource);
  if (!spell || visited.has(spell.file)) return;
  // A power cast by a weapon or another power (a bear's hug) counts like a power used directly
  const own = new Set<XpAbility>();
  collectSpell(creature, spell, own, visited);
  const power = powerAbility(spell, own);
  if (power) own.add(power);
  own.forEach((a) => found.add(a));
}

/** Disabling or deadly effects with no Table 32 row of their own (stun, sleep, charm...). */
const HARMFUL_OPCODES: EffectTypeEnum[] = [
  EffectTypeEnum.Stun,
  EffectTypeEnum.Sleep,
  EffectTypeEnum.Slow,
  EffectTypeEnum.Blindness,
  EffectTypeEnum.Confusion,
  EffectTypeEnum.CharmCreature,
  EffectTypeEnum.CharmControlCreature,
  EffectTypeEnum.Silence,
  EffectTypeEnum.Web,
  EffectTypeEnum.EntangleOverlay,
  EffectTypeEnum.Maze,
  EffectTypeEnum.Imprisonment,
  EffectTypeEnum.PolymorphIntoSpecific,
  EffectTypeEnum.DrainWizardSpells,
  EffectTypeEnum.Slay,
  EffectTypeEnum.KillTarget,
];

/** Opcodes that always map to an ability, whoever they land on. */
const OPCODE_ABILITIES: ReadonlyMap<EffectTypeEnum, XpAbility> = new Map<EffectTypeEnum, XpAbility>(
  [
    [EffectTypeEnum.Poison, "poison"],
    [EffectTypeEnum.Paralyze, "paralysis"],
    [EffectTypeEnum.Hold, "paralysis"],
    [EffectTypeEnum.HoldCreatureSpell, "paralysis"],
    [EffectTypeEnum.Petrification, "petrification"],
    [EffectTypeEnum.LevelDrain, "energyDrain"],
    [EffectTypeEnum.Disease, "causesDisease"],
    [EffectTypeEnum.Panic, "weaknessOrFear"],
    // Any other harmful effect, not a Table 32 row of its own: an unlisted attack form (user)
    ...HARMFUL_OPCODES.map((opcode) => [opcode, "specialAttack"] as const),
  ],
);

function abilityOfEffect(
  effect: Effect,
  header: ItemSpellHeader | undefined,
): XpAbility | undefined {
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

/**
 * Spells that add nothing to a creature's power, so never raise its spell bonus: Dimension Door
 * (and Spell Revisions' Dimension Jump that replaces it), a once-a-day teleport (user).
 */
const NO_POWER_SPELLS = new Set(
  [SPELLS.Wizard.DimensionDoor.file, "SPWI128"].map((f) => f.toUpperCase()),
);

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
    ...memorized.map((spell) => ({
      file: spell.file,
      level: spell.level ?? spellLevel(spell.file),
    })),
    ...ownSpells(scope.creature, effective)
      .filter(isSpellPower)
      .map((spell) => ({ file: spell.file, level: spell.level })),
    ...usableAbilities(scope.creature, effective).map((ability) => ({
      file: creatureService.getAbilityCastFiles(ability)[0] ?? "ability",
      level: ability.level ?? undefined,
    })),
  ].filter(
    (c): c is { file: string; level: number } =>
      c.level !== undefined && !isClassSpell(c.file) && !NO_POWER_SPELLS.has(c.file.toUpperCase()),
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
  // A diceless "weapon" dealing no damage only carries a form's effects (a vampire's mist form)
  if (header.diceThrown * header.diceSize === 0 && onHitDamage(item) === 0) return undefined;
  return { thrown: header.diceThrown, size: header.diceSize, bonus: header.damageBonus ?? 0 };
}

/** "+2", "-1", or "" for 0. */
function signed(value: number): string {
  if (!value) return "";
  return value > 0 ? `+${value}` : String(value);
}

/**
 * The maximum extra damage a weapon's hit deals (opcode 12 on its header: a flaming sword's fire,
 * an ooze's acid, a cat's rake): it adds to the attack for the damage thresholds (user).
 */
function onHitDamage(item: Item): number {
  return (item.header?.effects ?? [])
    .filter((e) => e.opcode === EffectTypeEnum.Damage)
    .reduce((sum, e) => {
      const d = e as { diceThrown?: number; diceSize?: number; amount?: number };
      return sum + (d.diceThrown ?? 0) * (d.diceSize ?? 0) + (d.amount ?? 0);
    }, 0);
}

/**
 * The scope's real attacks per round: the game encodes half attacks as 6-10 (8 = 5/2, Bodhi's
 * spellhold files), decoded with AttackPerRoundTable.
 */
function attacksPerRound(effective: EffectiveAdjustment): number {
  const raw = effective.apr.value;
  return AttackPerRoundTable.find((t) => !t.doubleApr && t.value === raw)?.apr ?? raw;
}

/** The scope's strength damage bonus (StrengthTable), added to its melee hits. */
function strengthDamage(effective: EffectiveAdjustment): number {
  return creatureService.getStrengthBonus({
    strength: effective.strength.value,
    exceptionalStrength: effective.exceptionalStrength.value,
  }).damage;
}

/** singleAttack20 / multipleAttacks30 from the wielded items whose dice are known. */
function addDamageAbilities(
  items: Item[],
  apr: number,
  strength: number,
  add: (ability: XpAbility, source: string) => void,
): void {
  const attacks: { file: string; max: number }[] = [];
  for (const item of items) {
    const dice = diceOf(item);
    if (!dice) continue;
    // A melee hit adds the strength damage bonus (a juju zombie's 3d4 at 20 strength: 3d4+8 = 20)
    const str = item.header?.type === ItemAbilityTypeEnum.Melee ? strength : 0;
    const extra = onHitDamage(item);
    const max = dice.thrown * dice.size + dice.bonus + str + extra;
    const strLabel = (str ? signed(str) + " str" : "") + (extra ? signed(extra) + " on hit" : "");
    const base = dice.thrown * dice.size ? `${dice.thrown}d${dice.size}` : "";
    const label = `${base}${signed(dice.bonus)}${strLabel}`.replace(/^\+/, "");
    if (max >= 20) add("singleAttack20", `${item.file}: ${label} = ${max}`);
    attacks.push({ file: item.file, max });
  }
  const round = roundAttacks(attacks, apr);
  const total = round.reduce((sum, a) => sum + a.max, 0);
  if (round.length > 1 && total >= 30) {
    const parts = round.map((a) => a.file + " " + String(a.max)).join(" + ");
    add("multipleAttacks30", `${parts} = ${total}`);
  }
}

/**
 * The attacks of one round at their maximum damage: each weapon once, strongest first, the
 * strongest `apr` when it has more weapons than attacks; extra attacks repeat the weakest weapon
 * (claw/claw/bite: the bite and both claws, not the bite three times).
 */
function roundAttacks(
  attacks: { file: string; max: number }[],
  apr: number,
): { file: string; max: number }[] {
  const sorted = [...attacks].sort((a, b) => b.max - a.max);
  // 2.5 attacks alternate 2 and 3: the stronger round counts
  const count = Math.max(1, Math.ceil(apr));
  const round = sorted.slice(0, count);
  const weakest = sorted.at(-1);
  while (weakest && round.length < count) round.push(weakest);
  return round;
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

/** The permanent effects of the creature: data, folded adjustments and trait items. */
function permanentEffects(scope: ExperienceScope): Effect[] {
  return [
    ...scope.creature.data.effects.list,
    ...matchingAdjustments(scope).flatMap((a) => a.data.effects.list),
    ...scope.creature.items.filter((item) => item.trait).flatMap((item) => item.effects),
  ];
}

function hasRegeneration(scope: ExperienceScope): boolean {
  return permanentEffects(scope).some((effect) => effect.opcode === EffectTypeEnum.Regeneration);
}

/** Positive weapon resistance set by effects (e.g. a vampire's physical resistance trait). */
function resistanceEffectSources(scope: ExperienceScope): (string | undefined)[] {
  const effects = permanentEffects(scope);
  return RESISTANCE_EFFECTS.map(({ opcode, label }) => {
    const value = Math.max(
      0,
      ...effects.map((e) => (e.opcode === opcode && "value" in e ? e.value : 0)),
    );
    return value > 0 ? `${value}% ${label} resistance` : undefined;
  });
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
