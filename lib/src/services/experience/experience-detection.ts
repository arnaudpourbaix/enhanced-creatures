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
import spellService from "../spell.service";
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

/** The hover trait marks a flier. */
const FLYING: ReadonlySet<ImmunityName> = new Set<ImmunityName>(["hover"]);

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

/** PnP movement at or below which a creature is slow (easy to kite), at or above which fast. */
const SLOW_MOVEMENT = 9;
const FAST_MOVEMENT = 15;

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
  const apr = attacksPerRound(scope, effective);
  if (apr >= 4) {
    detected.push({ ability: "fourAttacks", source: `${apr} attacks` });
  }
  // Not in the DMG (user): one step of 3 from a player's 12
  const movement = effective.movement.value;
  if (movement <= SLOW_MOVEMENT) {
    detected.push({ ability: "slowMovement", source: `movement ${movement}` });
  } else if (movement >= FAST_MOVEMENT) {
    detected.push({ ability: "fastMovement", source: `movement ${movement}` });
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

  const magicResistance = magicResistanceAbility(scope, immunities);
  if (magicResistance) detected.push(magicResistance);

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

  // A flier carries the hover trait (no ground effects): wyverns, a helmed horror (user)
  pushIfAny(detected, "flies", matching(immunities, FLYING));

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
  addDamageAbilities(
    scope.creature,
    weapons,
    attacksPerRound(scope, effective),
    strengthDamage(effective),
    add,
  );

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
      collectEffect(allSpells(creature), effect, item.header, found, new Set(), true);
    }
    harmfulOnlyIfUnlisted(found);
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
  collectSpell(allSpells(creature), spell, found, new Set());
  harmfulOnlyIfUnlisted(found);
  // A spell or spell-like power counts through the spell tier: its charm or slay is no special
  // attack on top (a dryad's charm, a banshee's death wail), and a power level 0 counts nothing
  if (isSpellPower(spell) || spellLikeLevel(creature, spell) !== undefined) {
    found.delete("specialAttack");
  }
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
 * A power cast as a wizard or priest spell, or given a power level, counts through that level only.
 * A power already counting as a listed ability (poison, petrification...) without dealing damage
 * is no unlisted form.
 */
function powerAbility(spell: Spell, found: Set<XpAbility>): XpAbility | undefined {
  if (spell.xpAbility !== undefined) return undefined;
  // Already a listed ability (a petrifying gaze, a poison): not an unlisted form too, unless it
  // also deals damage (a ghost's draining touch)
  if (found.size && !dealsDamage(spell)) return undefined;
  // A power cast as a wizard or priest spell (the ogre mage's cone of cold) or given a power level
  // (a dryad's charm) is a spell: it counts through that level (highestSpell), not as an attack
  // form too
  if (isSpellPower(spell) || spell.worthLevel !== undefined) return undefined;
  if (spell.role === "kill" || spell.role === "summon") return "specialMagicalAttack";
  if (spell.role === "protection") return "specialDefense";
  if (spell.role === "reactive") return undefined;
  return "specialAttack";
}

/**
 * The spell level a spell-like innate power counts at: its power level (`worthLevel`, the dryad's
 * charm is worth 5) - unless its effects already count as a listed ability (a fear aura is
 * weakness or fear, a holding web paralysis): not twice. A body's attack form (a leap, a wolf
 * form) has no power level: it is never a spell (user).
 */
function spellLikeLevel(creature: Creature, spell: Spell): number | undefined {
  if (isSpellPower(spell) || spell.worthLevel === undefined) return undefined;
  return listedAbilities(allSpells(creature), spell).size ? undefined : spell.worthLevel;
}

/**
 * The Table 32 rows a power's effects give (followed through the spells it casts), without the
 * special attack every harmful effect with no row of its own falls back on (a charm).
 */
function listedAbilities(spells: readonly Spell[], spell: Spell): Set<XpAbility> {
  const found = new Set<XpAbility>();
  collectSpell(spells, spell, found, new Set());
  found.delete("specialAttack");
  return found;
}

/**
 * The innate spells this mod creates that say neither how strong they are nor what they are: a
 * spell-like power needs a power level (`worthLevel`, 0 for no power), a body's attack form an
 * explicit `xpAbility` (`null` for nothing), unless its effects already give a listed Table 32
 * row (a paralyzing touch). The spells another created spell casts (a fear aura's parts) take
 * their parent's, damage a weapon's hit casts (a bear's hug) counts through the damage rows, and
 * wizard and priest spells and copies of game spells have a real level (user).
 */
export function missingPowerLevels(spells: readonly Spell[], items: readonly Item[] = []): Spell[] {
  const castOnHit = new Set(
    items.flatMap((item) =>
      (item.header?.effects ?? []).flatMap((e) =>
        CAST_OPCODES.has(e.opcode) && typeof e.resource === "string"
          ? [e.resource.toUpperCase()]
          : [],
      ),
    ),
  );
  const resources = (spell: Spell) =>
    [...spell.effects, ...spell.headers.flatMap((h) => h.effects), ...spell.effectFiles].flatMap(
      (e) => (typeof e.resource === "string" ? [e.resource.toUpperCase()] : []),
    );
  const parts = new Set(
    spells.flatMap((spell) => resources(spell).filter((f) => f !== spell.file.toUpperCase())),
  );
  const declared = (spell: Spell) =>
    spell.worthLevel !== undefined || spell.xpAbility !== undefined;
  const covered = (spell: Spell) => {
    const file = spell.file.toUpperCase();
    if (parts.has(file)) return true;
    if (castOnHit.has(file) && dealsDamage(spell)) return true;
    return listedAbilities(spells, spell).size > 0;
  };
  return spells.filter(
    (spell) =>
      spell.type === SpellTypeEnum.Innate && !spell.copyFrom && !declared(spell) && !covered(spell),
  );
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
  if (spell && spell.level >= 1) {
    add(spellTier(spell.level), spellLabel(spell.file));
  }
  for (const file of atWillInvisibility(scope.creature, effective)) {
    add("invisibleAtWill", spellLabel(file));
  }
}

/** The spell tier of a highest spell level: 1-2, 3-4, 5-6, 7-9 (user, beyond Table 32's 3+). */
function spellTier(level: number): XpAbility {
  if (level >= 7) return "supremeSpells";
  if (level >= 5) return "greaterSpells";
  if (level >= 3) return "highSpells";
  return "lowSpells";
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
    if (slots.some((slot) => QUIVER_SLOTS.has(slot))) {
      const owned = equippedItem(scope.creature, item.file);
      add("missileWeapons", owned ? labelOf(owned.file, owned.stringRef) : item.file);
    }
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
  "fatalPoison",
  "strongPoison",
  "poison",
  "weakPoison",
  "paralysis",
  "petrification",
  "energyDrain",
  "causesDisease",
  "weaknessOrFear",
  "invisibleAtWill",
  "supremeSpells",
  "greaterSpells",
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
    !effective.noWeapon && !item.equippedSlot.length && diceOf(scope.creature, item) !== undefined;
  const own = scope.creature.items.filter((item) => !item.trait && unslottedNatural(item));
  const equipped = effective.equipped
    .map((e) => equippedItem(scope.creature, e.item.file))
    .filter((item): item is Item => item !== undefined && !item.trait);
  return [...new Set([...own, ...equipped])];
}

function collectSpell(
  spells: readonly Spell[],
  spell: Spell,
  found: Set<XpAbility>,
  visited: Set<string>,
): void {
  if (visited.has(spell.file)) return;
  visited.add(spell.file);
  if (spell.xpAbility === null) return; // explicitly counts nothing
  // An explicit tag counts wherever the power is reached (a weapon's cast breath, an aura's
  // death), and is the whole power: its effects (the foul breath's slay) are part of it
  if (spell.xpAbility) {
    found.add(spell.xpAbility);
    return;
  }
  const secondary = spell.secondaryType && SECONDARY_TYPE_ABILITIES[String(spell.secondaryType)];
  if (secondary) found.add(secondary);
  for (const effect of spell.effects) collectEffect(spells, effect, undefined, found, visited);
  for (const header of spell.headers) {
    for (const effect of header.effects) collectEffect(spells, effect, header, found, visited);
  }
}

function collectEffect(
  spells: readonly Spell[],
  effect: Effect,
  header: ItemSpellHeader | undefined,
  found: Set<XpAbility>,
  visited: Set<string>,
  onHit = false,
): void {
  const ability = abilityOfEffect(effect, header);
  if (ability) found.add(ability);
  if (!CAST_OPCODES.has(effect.opcode) || effect.resource === undefined) return;
  const spell = spells.find((s) => s.file === effect.resource);
  if (!spell || visited.has(spell.file)) return;
  // A power cast by a weapon or another power counts like a power used directly - except that
  // damage a hit casts (an ankheg's digestive enzymes, a bear's hug) is the hit's extra damage: it
  // feeds the damage rows (onHitDamage), it is no attack form (user)
  const own = new Set<XpAbility>();
  collectSpell(spells, spell, own, visited);
  harmfulOnlyIfUnlisted(own);
  const power = powerAbility(spell, own);
  const extraDamage = onHit && power === "specialAttack" && dealsDamage(spell);
  if (power && !extraDamage) own.add(power);
  own.forEach((a) => found.add(a));
}

/**
 * A harmful effect with no row of its own counts as a special attack only when the power or weapon
 * has no listed one: a web tangle that holds is paralysis, not paralysis and a special attack.
 */
function harmfulOnlyIfUnlisted(found: Set<XpAbility>): void {
  if (found.size > 1) found.delete("specialAttack");
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
  const worth = (file: string, level: number | undefined) =>
    spellWorth(scope.creature, file, level);
  const candidates = [
    ...memorized.map((spell) => ({ file: spell.file, level: worth(spell.file, spell.level) })),
    ...ownSpells(scope.creature, effective)
      .filter((spell) => isSpellPower(spell) || spellLikeLevel(scope.creature, spell) !== undefined)
      .map((spell) => ({ file: spell.file, level: worth(spell.file, spell.level) })),
    ...usableAbilities(scope.creature, effective).map((ability) => {
      const file = creatureService.getAbilityCastFiles(ability)[0] ?? "ability";
      return { file, level: worth(file, ability.level ?? undefined) };
    }),
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
      .flatMap((spell) =>
        spellFiles(spell).map((f) => [f, spell.worthLevel ?? spell.level] as const),
      )
      .reverse(), // the first entry for a file wins
  );
  return spellLevels.get(file);
}

/**
 * The level a spell counts at for the spell bonus: its worth in a fight when rated by hand
 * (`worthLevel`: a vampire's control undead is level 7 but worth 3), else its level. An own power
 * tagged `xpAbility: null` (an innate dimension door) never raises the bonus, nor does an innate
 * power with no power level (a body's attack form).
 */
function spellWorth(
  creature: Creature,
  file: string,
  level: number | undefined,
): number | undefined {
  const own = allSpells(creature).find((s) => s.file.toUpperCase() === file.toUpperCase());
  if (own) {
    if (own.xpAbility === null) return undefined;
    if (isSpellPower(own)) return own.worthLevel ?? own.level;
    return spellLikeLevel(creature, own);
  }
  return spellLevel(file) ?? level;
}

function diceOf(
  creature: Creature,
  item: Item,
): { thrown: number; size: number; bonus: number } | undefined {
  const header = item.header;
  if (header?.diceThrown === undefined || header.diceSize === undefined) return undefined;
  // A diceless "weapon" dealing no damage only carries a form's effects (a vampire's mist form)
  if (header.diceThrown * header.diceSize === 0 && onHitDamage(creature, item) === 0) {
    return undefined;
  }
  return { thrown: header.diceThrown, size: header.diceSize, bonus: header.damageBonus ?? 0 };
}

/** "+2", "-1", or "" for 0. */
function signed(value: number): string {
  if (!value) return "";
  return value > 0 ? `+${value}` : String(value);
}

/**
 * The maximum extra damage a weapon's hit deals: opcode 12 on its header (a flaming sword's fire,
 * an ooze's acid, a cat's rake) and the damage of the powers the hit casts (an ankheg's digestive
 * enzymes, 1d4 acid four times). It adds to the attack for the damage thresholds (user).
 */
function onHitDamage(creature: Creature, item: Item): number {
  const effects = item.header?.effects ?? [];
  const cast = effects
    .filter((e) => CAST_OPCODES.has(e.opcode) && e.resource !== undefined)
    .map((e) => allSpells(creature).find((spell) => spell.file === e.resource))
    .filter((spell): spell is Spell => spell !== undefined)
    .reduce((sum, spell) => sum + damageOf(targetEffects(spell)), 0);
  return damageOf(effects) + cast;
}

/** The maximum damage (opcode 12) of a list of effects, repeated ones each counting. */
function damageOf(effects: Effect[]): number {
  return effects
    .filter((e) => e.opcode === EffectTypeEnum.Damage)
    .reduce((sum, e) => {
      const d = e as { diceThrown?: number; diceSize?: number; amount?: number };
      return sum + (d.diceThrown ?? 0) * (d.diceSize ?? 0) + (d.amount ?? 0);
    }, 0);
}

/** A power's effects that land on its target (not the ones on its caster). */
function targetEffects(spell: Spell): Effect[] {
  return [
    ...spell.effects.filter((e) => e.target !== EffectTargetEnum.Self),
    ...spell.headers.flatMap((h) =>
      h.target === ItemAbilityTargetEnum.Caster
        ? []
        : h.effects.filter((e) => e.target !== EffectTargetEnum.Self),
    ),
  ];
}

/**
 * The scope's real attacks per round. The documented value is the stored one doubled when
 * `doubleApr` is set (a carrion crawler's 8 is 4 x 2: real); without it, the game encodes half
 * attacks as 6-10 (8 = 5/2, Bodhi's spellhold files), decoded with AttackPerRoundTable.
 */
function attacksPerRound(scope: ExperienceScope, effective: EffectiveAdjustment): number {
  const raw = effective.apr.value;
  const doubleApr = folded(scope, (d) => d.doubleApr) ?? false;
  if (doubleApr) return raw;
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
  creature: Creature,
  items: Item[],
  apr: number,
  strength: number,
  add: (ability: XpAbility, source: string) => void,
): void {
  const attacks: { file: string; max: number }[] = [];
  for (const item of items) {
    const dice = diceOf(creature, item);
    if (!dice) continue;
    // A melee hit adds the strength damage bonus (a juju zombie's 3d4 at 20 strength: 3d4+8 = 20)
    const str = item.header?.type === ItemAbilityTypeEnum.Melee ? strength : 0;
    const extra = onHitDamage(creature, item);
    const max = dice.thrown * dice.size + dice.bonus + str + extra;
    const strLabel = (str ? signed(str) + " str" : "") + (extra ? signed(extra) + " on hit" : "");
    const base = dice.thrown * dice.size ? `${dice.thrown}d${dice.size}` : "";
    const label = `${base}${signed(dice.bonus)}${strLabel}`.replace(/^\+/, "");
    const name = labelOf(item.file, item.stringRef);
    if (max >= 20) add("singleAttack20", `${name}: ${label} = ${max}`);
    attacks.push({ file: name, max });
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

/** The item's or spell's name when it resolves (the dashboard reader's view), else its file. */
function labelOf(file: string, name: StringReference | undefined): string {
  let text: string | undefined;
  try {
    text = name === undefined ? undefined : translationService.from(name);
  } catch {
    text = undefined; // a game strref this mod has no text for
  }
  if (text) return text; // an empty translation falls back too
  return spellLabel(file);
}

/** A spell's display name (own or game spell), its file when it has none. */
function spellLabel(file: string): string {
  try {
    return spellService.getSpellName(file) ?? file;
  } catch {
    return file; // a game strref this mod has no text for
  }
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
 * The effective immunities, the engine-forced ones and the trait items', each flattened through
 * the immunities it nests (State.immunities, the walk utils.hasImmunity does). The trait's count
 * too: creatures carry most of their defenses (e.g. banshee's nonMagicalWeapons) on it, and type
 * traits like `undead` or `skeletal` hold the actual spell and weapon defenses only as nested
 * names. A name missing from State.immunities is kept as is, with nothing nested.
 */
function immunitiesOf(scope: ExperienceScope, effective: EffectiveAdjustment): ImmunityName[] {
  const seen = new Set<ImmunityName>();
  const visit = (name: ImmunityName): void => {
    if (seen.has(name)) return;
    seen.add(name);
    // Flying is what makes a flier immune to ground spells (entangle, web): counted as flies,
    // never as spell immunity too (user)
    if (FLYING.has(name)) return;
    const config = State.immunities.find((immunity) => immunity.name === name);
    for (const nested of config?.immunities ?? []) visit(nested);
  };
  [
    ...effective.immunities.map((i) => i.name),
    ...scope.creature.autoImmunities,
    ...traitItems(scope, effective).flatMap((item) => item.immunities),
  ].forEach(visit);
  return [...seen];
}

/** The permanent effects of the creature: data, folded adjustments and trait items. */
function permanentEffects(scope: ExperienceScope): Effect[] {
  return [
    ...scope.creature.data.effects.list,
    ...matchingAdjustments(scope).flatMap((a) => a.data.effects.list),
    ...traitItems(scope, effectiveOf(scope)).flatMap((item) => item.effects),
  ];
}

/**
 * The scope's trait items: its own (unless an adjustment removes them) and the equipped ones a
 * fellow member or the entry owns - a createFrom copy keeps its source's traits (the greater
 * wyvern's hover).
 */
function traitItems(scope: ExperienceScope, effective: EffectiveAdjustment): Item[] {
  const removed = new Set(
    [
      ...scope.creature.data.items.remove,
      ...matchingAdjustments(scope).flatMap((a) => a.data.items.remove),
    ].map((f) => f.toUpperCase()),
  );
  const own = scope.creature.items.filter(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- fixtures omit files
    (item) => item.trait && !removed.has((item.file ?? "").toUpperCase()),
  );
  const equipped = effective.equipped
    .map((e) => equippedItem(scope.creature, e.item.file))
    .filter((item): item is Item => item?.trait === true);
  return [...new Set([...own, ...equipped])];
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

/** Magic resistance below this is no ability; from it to the next tier it is a lesser one (user). */
const LOW_MAGIC_RESISTANCE = 20;
const MAGIC_RESISTANCE = 50;

/**
 * Magic resistance by tier (user): a full immunity or 50%+ = magicResistance, 20-49% =
 * lowMagicResistance, less = nothing. The value is the highest of the folded resistMagic and
 * the permanent magic resistance effects (e.g. the sirine's 20% trait).
 */
function magicResistanceAbility(
  scope: ExperienceScope,
  immunities: ImmunityName[],
): DetectedAbility | undefined {
  const immune = matching(immunities, MAGIC_RESISTANCE_IMMUNITIES);
  if (immune.length) return { ability: "magicResistance", source: immune.join(", ") };
  const value = Math.max(
    folded(scope, (d) => d.resistMagic) ?? 0,
    ...permanentEffects(scope).map((e) =>
      e.opcode === EffectTypeEnum.MagicResistanceModifier && "value" in e ? e.value : 0,
    ),
  );
  const source = `${value}% magic resistance`;
  if (value >= MAGIC_RESISTANCE) return { ability: "magicResistance", source };
  if (value >= LOW_MAGIC_RESISTANCE) return { ability: "lowMagicResistance", source };
  return undefined;
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
