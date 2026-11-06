import { CreatureAdjustment } from "../../model/creature/adjustment";
import { Creature } from "../../model/creature/creature";
import { CreatureData } from "../../model/creature/data";
import { Game } from "../../model/creature/game";
import { ImmunityName } from "../../model/final/immunity";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { State } from "../../state";
import adjustmentService, { EffectiveAdjustment } from "../doc/adjustment.service";
import { DetectedAbility, HitDice } from "./experience-table";

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
